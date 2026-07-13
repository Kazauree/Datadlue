// ============================================================
// DATADLUE LABS — AUTH SYSTEM (ClerkMockAuth.jsx)
// Features: Email OTP verification, Paystack payment hook,
//           secure admin login, persistent session
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

/* ── Paystack public key (replace with your real key) ──────── */
const PAYSTACK_PUBLIC_KEY = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

/* ── Context ─────────────────────────────────────────────── */
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/* ══════════════════════════════════════════════════════════ */
/* UTILITIES                                                   */
/* ══════════════════════════════════════════════════════════ */

/** Generate a 6-digit OTP */
function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

/**
 * Simulate sending an OTP email.
 * In production replace with your real email API (e.g. EmailJS, Resend, Supabase Auth).
 * For now it logs to console AND shows as a toast so it works offline too.
 */
function sendOTPEmail(email, otp) {
  console.info(`%c[Datadlue Auth] OTP for ${email}: ${otp}`, 'color:#f5a44a;font-weight:bold;font-size:1.1em');
  // NOTE: To wire real emails, call your backend here.
  return Promise.resolve();
}

/** Load Paystack inline script once */
let paystackReady = false;
function loadPaystack() {
  return new Promise(resolve => {
    if (paystackReady || window.PaystackPop) { paystackReady = true; return resolve(); }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = () => { paystackReady = true; resolve(); };
    document.head.appendChild(s);
  });
}

/**
 * Open Paystack payment popup.
 * @returns Promise<{reference, status}>
 */
export async function openPaystack({ email, amount, name, onSuccess, onClose }) {
  await loadPaystack();
  const handler = window.PaystackPop.setup({
    key:       PAYSTACK_PUBLIC_KEY,
    email:     email,
    amount:    amount * 100, // kobo
    currency:  'NGN',
    ref:       'DDLUE_' + Date.now(),
    metadata:  { custom_fields: [{ display_name: 'Product', variable_name: 'product', value: name }] },
    callback:  res => onSuccess && onSuccess(res),
    onClose:   ()  => onClose  && onClose(),
  });
  handler.openIframe();
}

/* ══════════════════════════════════════════════════════════ */
/* SCOPED CSS                                                  */
/* ══════════════════════════════════════════════════════════ */
const AUTH_CSS = `
  @keyframes auth-in  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes auth-shake{ 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes otp-pop   { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }

  .au-overlay {
    position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;z-index:50000;padding:16px;
  }
  .au-card {
    background:linear-gradient(145deg,#141414,#0f0f0f);
    border:1px solid rgba(245,164,74,.22);border-radius:20px;
    width:100%;max-width:430px;padding:36px 32px;position:relative;
    box-shadow:0 40px 80px rgba(0,0,0,.8),0 0 60px rgba(245,164,74,.07);
    animation:auth-in .3s cubic-bezier(.34,1.56,.64,1);
  }
  .au-logo {
    width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f5a44a,#e07b1a);
    display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:20px;
  }
  .au-title  { font-size:1.4rem;font-weight:800;color:#fff;margin:0 0 4px; }
  .au-sub    { font-size:0.82rem;color:#666;margin:0 0 24px; }
  .au-close  {
    position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:8px;
    border:none;background:rgba(255,255,255,.06);color:#aaa;cursor:pointer;font-size:.9rem;
    display:flex;align-items:center;justify-content:center;transition:.2s;
  }
  .au-close:hover{background:rgba(255,255,255,.12);color:#fff}

  /* Form */
  .au-form   { display:flex;flex-direction:column;gap:14px; }
  .au-label  { font-size:.67rem;text-transform:uppercase;letter-spacing:.06em;color:#666;font-weight:700;display:block;margin-bottom:5px; }
  .au-input  {
    width:100%;box-sizing:border-box;background:#0d0d0d;border:1px solid rgba(255,255,255,.08);
    border-radius:10px;color:#ddd;padding:11px 14px;font-size:.9rem;outline:none;transition:.2s;
  }
  .au-input:focus{border-color:#f5a44a;box-shadow:0 0 0 3px rgba(245,164,74,.12)}
  .au-input.au-err{border-color:#ef4444;animation:auth-shake .4s ease}
  .au-pw-wrap {position:relative}
  .au-pw-wrap .au-input{padding-right:42px}
  .au-pw-eye  {
    position:absolute;right:12px;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:#555;font-size:1rem;
  }

  /* Error / success banners */
  .au-error   { background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.35);color:#ef4444;border-radius:8px;padding:10px 14px;font-size:.82rem;font-weight:600; }
  .au-success { background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);color:#22c55e;border-radius:8px;padding:10px 14px;font-size:.82rem;font-weight:600; }

  /* CTA */
  .au-btn {
    display:flex;align-items:center;justify-content:center;gap:8px;
    width:100%;padding:13px;border-radius:10px;font-weight:800;font-size:.9rem;
    border:none;cursor:pointer;transition:.2s;margin-top:4px;
  }
  .au-btn-primary{background:linear-gradient(135deg,#f5a44a,#e07b1a);color:#1a0800}
  .au-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(245,164,74,.35)}
  .au-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
  .au-spinner{width:16px;height:16px;border:2px solid rgba(26,8,0,.25);border-top-color:#1a0800;border-radius:50%;animation:au-spin 0.8s linear infinite}
  @keyframes au-spin{to{transform:rotate(360deg)}}

  /* Footer toggle */
  .au-foot  { text-align:center;font-size:.82rem;color:#555;margin-top:18px; }
  .au-foot button{background:none;border:none;color:#f5a44a;font-weight:700;cursor:pointer;font-size:.82rem;}
  .au-foot button:hover{text-decoration:underline}

  /* OTP boxes */
  .au-otp-wrap { display:flex;gap:10px;justify-content:center; }
  .au-otp-box  {
    width:50px;height:58px;text-align:center;font-size:1.5rem;font-weight:800;
    background:#0d0d0d;border:1px solid rgba(255,255,255,.1);border-radius:10px;
    color:#f5a44a;outline:none;caret-color:#f5a44a;transition:.2s;
    animation:otp-pop .25s ease;
  }
  .au-otp-box:focus{border-color:#f5a44a;box-shadow:0 0 0 3px rgba(245,164,74,.15)}

  .au-otp-info  { text-align:center;font-size:.8rem;color:#666;margin:0; }
  .au-otp-timer { color:#f5a44a;font-weight:700; }
  .au-resend    { background:none;border:none;color:#f5a44a;cursor:pointer;font-weight:700;font-size:.8rem; }
  .au-resend:disabled{color:#555;cursor:not-allowed}

  .au-divider { display:flex;align-items:center;gap:12px;margin:4px 0; }
  .au-divider-line{flex:1;height:1px;background:rgba(255,255,255,.06)}
  .au-divider-txt{font-size:.72rem;color:#555;white-space:nowrap}

  .au-strength { margin-top:6px; }
  .au-strength-bar { height:3px;border-radius:2px;transition:all .3s;background:#1a1a1a; }
  .au-strength-lbl { font-size:.68rem;margin-top:4px; }
`;

/* ══════════════════════════════════════════════════════════ */
/* PROVIDER                                                    */
/* ══════════════════════════════════════════════════════════ */
export function AuthProvider({ children }) {
  const [user,              setUser]              = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [showLoginModal,    setShowLoginModal]    = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  /* Load persisted session */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('datadlue_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  /* ── Admin login (email + password, no OTP) ────────────── */
  const loginAdmin = (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      const ADMIN_EMAIL = 'auwalsalekazaure@gmail.com';
      const ADMIN_PASS  = 'FuckAdmin20';
      if (email.toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASS) {
        reject(new Error('Invalid admin credentials.'));
        return;
      }
      const u = { id:'usr-admin', email:ADMIN_EMAIL, fullName:'System Administrator', isAdmin:true, joinedAt:new Date().toISOString() };
      setUser(u);
      localStorage.setItem('datadlue_user', JSON.stringify(u));
      setShowLoginModal(false);
      resolve(u);
    }, 600);
  });

  /* ── Regular user login — step 1: verify, step 2: OTP ── */
  const initiateLogin = (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes('@')) { reject(new Error('Enter a valid email.')); return; }
      if (!password || password.length < 6) { reject(new Error('Password must be at least 6 characters.')); return; }
      const otp = genOTP();
      sendOTPEmail(email, otp).catch(() => {});
      // Return OTP so the modal can verify it (in production, never expose this on client)
      resolve({ otp, email, password });
    }, 700);
  });

  const completeLogin = (email, password) => {
    const u = {
      id:       'usr-' + Math.random().toString(36).substr(2, 9),
      email:    email.toLowerCase(),
      fullName: email.split('@')[0],
      isAdmin:  false,
      joinedAt: new Date().toISOString()
    };
    setUser(u);
    localStorage.setItem('datadlue_user', JSON.stringify(u));
    setShowLoginModal(false);
    return u;
  };

  /* ── Register — step 1: collect info, step 2: OTP ──────── */
  const initiateRegister = (email, fullName, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes('@')) { reject(new Error('Enter a valid email.')); return; }
      if (!fullName || fullName.trim().length < 3) { reject(new Error('Enter your full name (min 3 chars).')); return; }
      if (!password || password.length < 8) { reject(new Error('Password must be at least 8 characters.')); return; }
      const otp = genOTP();
      sendOTPEmail(email, otp).catch(() => {});
      resolve({ otp, email, fullName, password });
    }, 700);
  });

  const completeRegister = (email, fullName) => {
    const u = {
      id:       'usr-' + Math.random().toString(36).substr(2, 9),
      email:    email.toLowerCase(),
      fullName: fullName.trim(),
      isAdmin:  false,
      joinedAt: new Date().toISOString()
    };
    setUser(u);
    localStorage.setItem('datadlue_user', JSON.stringify(u));
    setShowRegisterModal(false);
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('datadlue_user');
  };

  const value = {
    user, loading, logout,
    showLoginModal,    setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    loginAdmin, initiateLogin, completeLogin,
    initiateRegister, completeRegister,
    // Legacy compat
    login: initiateLogin,
    register: initiateRegister,
  };

  return (
    <AuthContext.Provider value={value}>
      <style>{AUTH_CSS}</style>
      {children}
      {showLoginModal    && <LoginModal />}
      {showRegisterModal && <RegisterModal />}
    </AuthContext.Provider>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* PASSWORD STRENGTH                                           */
/* ══════════════════════════════════════════════════════════ */
function PasswordStrength({ password }) {
  const score = !password ? 0
    : [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const map = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#ef4444','#f59e0b','#3b82f6','#22c55e'];
  return (
    <div className="au-strength">
      <div className="au-strength-bar" style={{ width:`${score*25}%`, background:colors[score] }} />
      {password && <p className="au-strength-lbl" style={{color:colors[score]}}>{map[score]} password</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* OTP STEP COMPONENT                                          */
/* ══════════════════════════════════════════════════════════ */
function OTPStep({ expectedOTP, email, onVerified, onBack, onResend }) {
  const [digits, setDigits] = useState(['','','','','','']);
  const [err, setErr] = useState('');
  const [timer, setTimer] = useState(60);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    refs[0].current?.focus();
    const iv = setInterval(() => setTimer(t => t > 0 ? t-1 : 0), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const d = [...digits]; d[i] = '';
      setDigits(d);
      if (i > 0) refs[i-1].current.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const d = [...digits]; d[i] = e.key;
    setDigits(d);
    if (i < 5) refs[i+1].current.focus();
  };

  const handlePaste = e => {
    const paste = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (paste.length === 6) {
      setDigits(paste.split(''));
      refs[5].current.focus();
    }
    e.preventDefault();
  };

  const verify = () => {
    const entered = digits.join('');
    if (entered.length < 6) { setErr('Enter all 6 digits.'); return; }
    if (entered !== expectedOTP) { setErr('Incorrect code. Please try again.'); setDigits(['','','','','','']); refs[0].current.focus(); return; }
    setErr('');
    onVerified();
  };

  const resend = () => { setTimer(60); setDigits(['','','','','','']); onResend(); };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div>
        <p className="au-otp-info">
          We sent a 6-digit code to <strong style={{color:'#f5a44a'}}>{email}</strong>.<br/>
          Check your inbox (and spam folder).
        </p>
        {/* DEV helper — remove in production */}
        <p className="au-otp-info" style={{marginTop:8,background:'rgba(245,164,74,.08)',padding:'6px 10px',borderRadius:6,border:'1px solid rgba(245,164,74,.2)'}}>
          🔑 Dev mode: OTP logged to browser console (F12 → Console)
        </p>
      </div>

      <div className="au-otp-wrap">
        {digits.map((d, i) => (
          <input
            key={i} ref={refs[i]} className="au-otp-box"
            type="text" inputMode="numeric" maxLength={1}
            value={d} onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste} readOnly
          />
        ))}
      </div>

      {err && <div className="au-error">{err}</div>}

      <p className="au-otp-info">
        {timer > 0
          ? <>Resend in <span className="au-otp-timer">{timer}s</span></>
          : <button className="au-resend" onClick={resend} type="button">Resend Code</button>
        }
      </p>

      <button className="au-btn au-btn-primary" type="button" onClick={verify}>
        ✅ Verify & Continue
      </button>
      <button onClick={onBack} type="button" style={{background:'none',border:'none',color:'#666',cursor:'pointer',fontSize:'.82rem',marginTop:-8}}>
        ← Back
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* LOGIN MODAL                                                 */
/* ══════════════════════════════════════════════════════════ */
const ADMIN_EMAIL = 'auwalsalekazaure@gmail.com';

function LoginModal() {
  const { setShowLoginModal, setShowRegisterModal, loginAdmin, initiateLogin, completeLogin } = useAuth();
  const [step,     setStep]     = useState('form'); // 'form' | 'otp'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [pending,  setPending]  = useState(null); // {otp, email, password}
  const [err,      setErr]      = useState('');
  const [busy,     setBusy]     = useState(false);

  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isAdmin) {
        await loginAdmin(email, password);
      } else {
        const res = await initiateLogin(email, password);
        setPending(res);
        setStep('otp');
      }
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const onVerified = () => {
    completeLogin(pending.email, pending.password);
  };

  const onResend = async () => {
    const { sendOTPEmail: send, genOTP: gen } = await import('./ClerkMockAuth');
    // re-use via closure
    const otp = genOTP();
    sendOTPEmail(pending.email, otp);
    setPending(p => ({ ...p, otp }));
  };

  // Resend helper (inline since gen/send are module-level)
  const handleResend = () => {
    const otp = genOTP();
    sendOTPEmail(pending.email, otp).catch(() => {});
    setPending(p => ({ ...p, otp }));
  };

  return (
    <div className="au-overlay" onClick={e => e.target === e.currentTarget && setShowLoginModal(false)}>
      <div className="au-card">
        <button className="au-close" onClick={() => setShowLoginModal(false)} aria-label="Close">✕</button>
        <div className="au-logo">🔐</div>

        {step === 'form' ? (
          <>
            <h2 className="au-title">Welcome back</h2>
            <p className="au-sub">Sign in to your Datadlue account</p>

            {err && <div className="au-error" style={{marginBottom:12}}>{err}</div>}

            <form onSubmit={submit} className="au-form">
              <div>
                <label className="au-label" htmlFor="li-email">Email Address</label>
                <input id="li-email" className="au-input" type="email" autoComplete="email"
                  placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="li-pw">Password</label>
                <div className="au-pw-wrap">
                  <input id="li-pw" className="au-input" type={showPw?'text':'password'}
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="au-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {isAdmin && (
                <p style={{fontSize:'.72rem',color:'#f5a44a',background:'rgba(245,164,74,.08)',padding:'6px 10px',borderRadius:6,margin:0}}>
                  🛡 Admin login — no OTP required
                </p>
              )}

              <button className="au-btn au-btn-primary" type="submit" disabled={busy}>
                {busy ? <><span className="au-spinner"/>&nbsp;Verifying…</> : isAdmin ? '🛡 Admin Sign In' : 'Continue →'}
              </button>
            </form>

            <div className="au-foot">
              Don't have an account?{' '}
              <button onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Register here</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="au-title">Verify your email</h2>
            <p className="au-sub">Enter the 6-digit code we sent you</p>
            <OTPStep
              expectedOTP={pending.otp}
              email={pending.email}
              onVerified={onVerified}
              onBack={() => { setStep('form'); setErr(''); }}
              onResend={handleResend}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* REGISTER MODAL                                              */
/* ══════════════════════════════════════════════════════════ */
function RegisterModal() {
  const { setShowRegisterModal, setShowLoginModal, initiateRegister, completeRegister } = useAuth();
  const [step,     setStep]     = useState('form');
  const [email,    setEmail]    = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [pending,  setPending]  = useState(null);
  const [err,      setErr]      = useState('');
  const [busy,     setBusy]     = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await initiateRegister(email, fullName, password);
      setPending(res);
      setStep('otp');
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const onVerified = () => completeRegister(pending.email, pending.fullName);

  const handleResend = () => {
    const otp = genOTP();
    sendOTPEmail(pending.email, otp).catch(() => {});
    setPending(p => ({ ...p, otp }));
  };

  return (
    <div className="au-overlay" onClick={e => e.target === e.currentTarget && setShowRegisterModal(false)}>
      <div className="au-card">
        <button className="au-close" onClick={() => setShowRegisterModal(false)} aria-label="Close">✕</button>
        <div className="au-logo">✨</div>

        {step === 'form' ? (
          <>
            <h2 className="au-title">Create account</h2>
            <p className="au-sub">Join Datadlue — browse & purchase projects</p>

            {err && <div className="au-error" style={{marginBottom:12}}>{err}</div>}

            <form onSubmit={submit} className="au-form">
              <div>
                <label className="au-label" htmlFor="rg-name">Full Name</label>
                <input id="rg-name" className="au-input" type="text" autoComplete="name"
                  placeholder="e.g. Auwal Kazaure" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="rg-email">Email Address</label>
                <input id="rg-email" className="au-input" type="email" autoComplete="email"
                  placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="rg-pw">Password</label>
                <div className="au-pw-wrap">
                  <input id="rg-pw" className="au-input" type={showPw?'text':'password'}
                    placeholder="min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="au-pw-eye" onClick={() => setShowPw(v=>!v)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="au-label" htmlFor="rg-confirm">Confirm Password</label>
                <input id="rg-confirm" className={`au-input${confirm && confirm!==password?' au-err':''}`}
                  type="password" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
                {confirm && confirm !== password && (
                  <p style={{color:'#ef4444',fontSize:'.72rem',marginTop:4}}>Passwords don't match</p>
                )}
              </div>

              <button className="au-btn au-btn-primary" type="submit" disabled={busy || (confirm && confirm !== password)}>
                {busy ? <><span className="au-spinner"/>&nbsp;Sending OTP…</> : 'Send Verification Code →'}
              </button>
            </form>

            <div className="au-foot">
              Already have an account?{' '}
              <button onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}>Sign in</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="au-title">Verify your email</h2>
            <p className="au-sub">Last step — enter the code we emailed you</p>
            <OTPStep
              expectedOTP={pending.otp}
              email={pending.email}
              onVerified={onVerified}
              onBack={() => { setStep('form'); setErr(''); }}
              onResend={handleResend}
            />
          </>
        )}
      </div>
    </div>
  );
}
