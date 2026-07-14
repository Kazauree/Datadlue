// ============================================================
// DATADLUE LABS — AUTH SYSTEM v3
// • When VITE_CLERK_PUBLISHABLE_KEY is set  → real Clerk auth
//   (email + password + email-code OTP via useSignIn/useSignUp)
// • When key is missing                     → mock localStorage auth
// • Admin login always via email+password   (bypasses OTP)
// • Paystack payment helper exported
// ============================================================

import React, {
  createContext, useContext, useState, useEffect, useRef,
} from 'react';
import {
  ClerkProvider,
  useUser,
  useAuth    as useClerkAuth,
  useSignIn,
  useSignUp,
} from '@clerk/react';

/* ── Paystack public key from env ──────────────────────────── */
const PAYSTACK_PUBLIC_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
  'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

/* ── Admin credentials (mock admin bypass) ─────────────────── */
const ADMIN_EMAIL = 'auwalsalekazaure@gmail.com';
const ADMIN_PASS  = 'FuckAdmin20';

/* ══════════════════════════════════════════════════════════ */
/* AUTH CONTEXT                                               */
/* ══════════════════════════════════════════════════════════ */
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/* ══════════════════════════════════════════════════════════ */
/* PAYSTACK HELPER (exported)                                  */
/* ══════════════════════════════════════════════════════════ */
let _paystackReady = false;
function _loadPaystack() {
  return new Promise(resolve => {
    if (_paystackReady || window.PaystackPop) { _paystackReady = true; return resolve(); }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = () => { _paystackReady = true; resolve(); };
    document.head.appendChild(s);
  });
}
export async function openPaystack({ email, amount, name, onSuccess, onClose }) {
  await _loadPaystack();
  const handler = window.PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    email,
    amount:   amount * 100, // kobo
    currency: 'NGN',
    ref:      'DDLUE_' + Date.now(),
    metadata: { custom_fields: [{ display_name: 'Product', variable_name: 'product', value: name }] },
    callback: res => onSuccess && onSuccess(res),
    onClose:  ()  => onClose  && onClose(),
  });
  handler.openIframe();
}

/* ══════════════════════════════════════════════════════════ */
/* SCOPED CSS                                                  */
/* ══════════════════════════════════════════════════════════ */
const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes auth-in    { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes auth-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
  @keyframes otp-pop    { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
  @keyframes au-spin    { to{transform:rotate(360deg)} }
  @keyframes au-pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

  .au-overlay {
    position:fixed;inset:0;z-index:90000;
    background:rgba(0,0,0,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    display:flex;align-items:center;justify-content:center;padding:16px;
    font-family:'Inter',system-ui,sans-serif;
  }
  .au-card {
    background:linear-gradient(150deg,#161616 0%,#0f0f0f 100%);
    border:1px solid rgba(245,164,74,.22);border-radius:22px;
    width:100%;max-width:440px;padding:38px 34px;position:relative;
    box-shadow:0 50px 100px rgba(0,0,0,.85),0 0 80px rgba(245,164,74,.06),inset 0 1px 0 rgba(255,255,255,.04);
    animation:auth-in .35s cubic-bezier(.34,1.56,.64,1);
  }

  /* Glow accent */
  .au-card::before {
    content:'';position:absolute;inset:0;border-radius:22px;
    background:radial-gradient(ellipse 60% 30% at 50% 0%,rgba(245,164,74,.07),transparent 70%);
    pointer-events:none;
  }

  .au-logo {
    width:48px;height:48px;border-radius:14px;
    background:linear-gradient(135deg,#f5a44a,#e07b1a);
    display:flex;align-items:center;justify-content:center;
    font-size:1.35rem;margin-bottom:22px;
    box-shadow:0 8px 24px rgba(245,164,74,.3);
  }
  .au-title { font-size:1.45rem;font-weight:800;color:#fff;margin:0 0 5px;letter-spacing:-.02em; }
  .au-sub   { font-size:.83rem;color:#555;margin:0 0 26px; }
  .au-close {
    position:absolute;top:18px;right:18px;width:34px;height:34px;border-radius:10px;
    border:none;background:rgba(255,255,255,.05);color:#666;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:.18s;font-size:.9rem;
  }
  .au-close:hover{background:rgba(255,255,255,.11);color:#ccc}

  /* ── Form ── */
  .au-form  { display:flex;flex-direction:column;gap:15px; }
  .au-label { font-size:.67rem;text-transform:uppercase;letter-spacing:.06em;color:#555;font-weight:700;display:block;margin-bottom:5px; }
  .au-input {
    width:100%;box-sizing:border-box;background:#0c0c0c;
    border:1px solid rgba(255,255,255,.08);border-radius:11px;
    color:#e0e0e0;padding:12px 15px;font-size:.9rem;outline:none;
    transition:border-color .18s,box-shadow .18s;font-family:inherit;
  }
  .au-input:focus { border-color:#f5a44a;box-shadow:0 0 0 3px rgba(245,164,74,.13); }
  .au-input.au-err { border-color:#ef4444;animation:auth-shake .4s ease; }
  .au-pw-wrap { position:relative; }
  .au-pw-wrap .au-input { padding-right:44px; }
  .au-pw-eye {
    position:absolute;right:13px;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:#555;font-size:1rem;
    padding:4px;line-height:1;transition:.15s;
  }
  .au-pw-eye:hover { color:#aaa; }

  /* ── Banners ── */
  .au-error   { background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;border-radius:9px;padding:11px 14px;font-size:.83rem;font-weight:600;line-height:1.45; }
  .au-success { background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22c55e;border-radius:9px;padding:11px 14px;font-size:.83rem;font-weight:600; }
  .au-info    { background:rgba(245,164,74,.08);border:1px solid rgba(245,164,74,.2);color:#f5a44a;border-radius:9px;padding:10px 14px;font-size:.8rem;font-weight:600;line-height:1.45; }

  /* ── CTA button ── */
  .au-btn {
    display:flex;align-items:center;justify-content:center;gap:9px;
    width:100%;padding:13px;border-radius:11px;font-weight:800;font-size:.92rem;
    border:none;cursor:pointer;transition:.2s;margin-top:2px;font-family:inherit;
    letter-spacing:-.01em;
  }
  .au-btn-primary { background:linear-gradient(135deg,#f5a44a,#e07b1a);color:#1a0800; }
  .au-btn-primary:hover { transform:translateY(-2px);box-shadow:0 10px 28px rgba(245,164,74,.35); }
  .au-btn-primary:disabled { opacity:.5;cursor:not-allowed;transform:none;box-shadow:none; }
  .au-spinner { width:16px;height:16px;border:2.5px solid rgba(26,8,0,.2);border-top-color:#1a0800;border-radius:50%;animation:au-spin .8s linear infinite; }

  /* ── Footer ── */
  .au-foot { text-align:center;font-size:.82rem;color:#555;margin-top:20px; }
  .au-foot button { background:none;border:none;color:#f5a44a;font-weight:700;cursor:pointer;font-size:.82rem;font-family:inherit; }
  .au-foot button:hover { text-decoration:underline; }

  /* ── OTP boxes ── */
  .au-otp-wrap { display:flex;gap:10px;justify-content:center;margin:4px 0; }
  .au-otp-box  {
    width:52px;height:60px;text-align:center;font-size:1.55rem;font-weight:800;
    background:#0c0c0c;border:1px solid rgba(255,255,255,.1);border-radius:11px;
    color:#f5a44a;outline:none;caret-color:transparent;transition:.18s;
    animation:otp-pop .22s cubic-bezier(.34,1.56,.64,1);font-family:inherit;
  }
  .au-otp-box:focus { border-color:#f5a44a;box-shadow:0 0 0 3px rgba(245,164,74,.15); }
  .au-otp-info  { text-align:center;font-size:.81rem;color:#555;margin:0;line-height:1.55; }
  .au-otp-timer { color:#f5a44a;font-weight:700; }
  .au-resend    { background:none;border:none;color:#f5a44a;cursor:pointer;font-weight:700;font-size:.81rem;font-family:inherit; }
  .au-resend:disabled { color:#444;cursor:not-allowed; }

  /* ── Divider ── */
  .au-divider { display:flex;align-items:center;gap:12px;margin:4px 0; }
  .au-divider-line { flex:1;height:1px;background:rgba(255,255,255,.06); }
  .au-divider-txt  { font-size:.71rem;color:#444;white-space:nowrap; }

  /* ── Password strength ── */
  .au-strength { margin-top:6px; }
  .au-strength-bar { height:3px;border-radius:2px;transition:all .3s;background:#1a1a1a; }
  .au-strength-lbl { font-size:.68rem;margin-top:4px;font-weight:600; }

  /* ── Admin badge ── */
  .au-admin-tag {
    display:flex;align-items:center;gap:8px;
    background:rgba(245,164,74,.08);border:1px solid rgba(245,164,74,.2);
    border-radius:8px;padding:8px 12px;font-size:.78rem;color:#f5a44a;font-weight:700;
  }

  @media(max-width:480px){
    .au-card{padding:28px 20px;}
    .au-otp-box{width:44px;height:52px;font-size:1.3rem;}
  }
`;

/* ══════════════════════════════════════════════════════════ */
/* UTILITIES                                                   */
/* ══════════════════════════════════════════════════════════ */
function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

function sendOTPEmailMock(email, otp) {
  console.info(
    `%c[Datadlue Mock OTP] Code for ${email}: ${otp}`,
    'color:#f5a44a;font-weight:bold;font-size:1.1em'
  );
  return Promise.resolve();
}

/* ══════════════════════════════════════════════════════════ */
/* SHARED UI COMPONENTS                                        */
/* ══════════════════════════════════════════════════════════ */
function PasswordStrength({ password }) {
  const score = !password ? 0
    : [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const map    = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return (
    <div className="au-strength">
      <div className="au-strength-bar" style={{ width: `${score * 25}%`, background: colors[score] }} />
      {password && <p className="au-strength-lbl" style={{ color: colors[score] }}>{map[score]} password</p>}
    </div>
  );
}

/* ─── OTP digit input panel ─────────────────────────────── */
function OTPDigits({ onComplete, onResend, timer, setTimer }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [err,    setErr]    = useState('');
  const refs = Array.from({ length: 6 }, () => useRef()); // eslint-disable-line

  useEffect(() => { refs[0].current?.focus(); }, []); // eslint-disable-line

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const d = [...digits]; d[i] = '';
      setDigits(d);
      if (i > 0) refs[i - 1].current.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const d = [...digits]; d[i] = e.key;
    setDigits(d);
    if (i < 5) refs[i + 1].current.focus();
    // Auto-submit when all 6 filled
    if (i === 5) {
      const code = [...d.slice(0, 5), e.key].join('');
      if (code.length === 6) setTimeout(() => onComplete(code, setErr), 80);
    }
  };

  const handlePaste = e => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setDigits(paste.split(''));
      refs[5].current.focus();
      setTimeout(() => onComplete(paste, setErr), 80);
    }
    e.preventDefault();
  };

  const handleSubmit = () => {
    const code = digits.join('');
    if (code.length < 6) { setErr('Enter all 6 digits.'); return; }
    onComplete(code, setErr);
  };

  const resend = () => {
    setDigits(['', '', '', '', '', '']);
    setErr('');
    setTimer(60);
    onResend();
    refs[0].current?.focus();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
          : <button className="au-resend" onClick={resend} type="button">↺ Resend Code</button>
        }
      </p>
      <button className="au-btn au-btn-primary" type="button" onClick={handleSubmit}>
        ✅ Verify & Continue
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* CLERK LOGIN MODAL (real Clerk useSignIn)                    */
/* ══════════════════════════════════════════════════════════ */
function ClerkLoginModal() {
  const { setShowLoginModal, setShowRegisterModal } = useAuth();
  const { signIn, isLoaded } = useSignIn();

  const [step,     setStep]    = useState('form');
  const [email,    setEmail]   = useState('');
  const [password, setPassword]= useState('');
  const [showPw,   setShowPw]  = useState(false);
  const [err,      setErr]     = useState('');
  const [busy,     setBusy]    = useState(false);
  const [timer,    setTimer]   = useState(60);

  // Admin shortcut — uses mock admin handler from context
  const { loginAdmin } = useAuth();
  const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL;

  useEffect(() => {
    if (step !== 'otp') return;
    const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (isAdmin) {
        // Admin mock bypass
        await loginAdmin(email.trim(), password);
        setShowLoginModal(false);
      } else {
        // Real Clerk: start email+password sign-in, send email OTP
        const res = await signIn.create({ identifier: email.trim(), password });
        if (res.status === 'complete') {
          // Session created immediately (no OTP needed)
          setShowLoginModal(false);
        } else {
          // Prepare email code verification
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: res.supportedFirstFactors?.find(f => f.strategy === 'email_code')?.emailAddressId });
          setStep('otp');
          setTimer(60);
        }
      }
    } catch (ex) {
      const msg = ex?.errors?.[0]?.longMessage || ex?.errors?.[0]?.message || ex?.message || 'Login failed.';
      setErr(msg);
    } finally { setBusy(false); }
  };

  const onOTPComplete = async (code, setOtpErr) => {
    setBusy(true);
    try {
      const res = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (res.status === 'complete') {
        setShowLoginModal(false);
      } else {
        setOtpErr('Verification failed. Please try again.');
      }
    } catch (ex) {
      const msg = ex?.errors?.[0]?.longMessage || ex?.errors?.[0]?.message || 'Invalid code.';
      setOtpErr(msg);
    } finally { setBusy(false); }
  };

  const onResendOTP = async () => {
    try {
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: signIn.supportedFirstFactors?.find(f => f.strategy === 'email_code')?.emailAddressId });
    } catch {}
  };

  return (
    <div className="au-overlay" onClick={e => e.target === e.currentTarget && setShowLoginModal(false)}>
      <div className="au-card">
        <style>{AUTH_CSS}</style>
        <button className="au-close" onClick={() => setShowLoginModal(false)} aria-label="Close">✕</button>
        <div className="au-logo">🔐</div>

        {step === 'form' ? (
          <>
            <h2 className="au-title">Welcome back</h2>
            <p className="au-sub">Sign in to your Datadlue account</p>
            {err && <div className="au-error" style={{ marginBottom: 14 }}>{err}</div>}
            <form onSubmit={submit} className="au-form">
              <div>
                <label className="au-label" htmlFor="cl-li-email">Email Address</label>
                <input id="cl-li-email" className="au-input" type="email" autoComplete="email"
                  placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="cl-li-pw">Password</label>
                <div className="au-pw-wrap">
                  <input id="cl-li-pw" className="au-input" type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="au-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              {isAdmin && (
                <div className="au-admin-tag">🛡 Admin account — direct login, no email code</div>
              )}
              <button className="au-btn au-btn-primary" type="submit" disabled={busy || !isLoaded}>
                {busy
                  ? <><span className="au-spinner" />&nbsp;Signing in…</>
                  : isAdmin ? '🛡 Admin Sign In' : 'Continue →'}
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
            <p className="au-sub" style={{ marginBottom: 8 }}>Enter the 6-digit code sent to</p>
            <div className="au-info" style={{ marginBottom: 18 }}>📧 {email}</div>
            <OTPDigits onComplete={onOTPComplete} onResend={onResendOTP} timer={timer} setTimer={setTimer} />
            <button onClick={() => { setStep('form'); setErr(''); }}
              type="button" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '.82rem', marginTop: 12, width: '100%', textAlign: 'center', fontFamily: 'inherit' }}>
              ← Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* CLERK REGISTER MODAL (real Clerk useSignUp)                 */
/* ══════════════════════════════════════════════════════════ */
function ClerkRegisterModal() {
  const { setShowRegisterModal, setShowLoginModal } = useAuth();
  const { signUp, isLoaded } = useSignUp();

  const [step,     setStep]    = useState('form');
  const [email,    setEmail]   = useState('');
  const [fullName, setFullName]= useState('');
  const [password, setPassword]= useState('');
  const [confirm,  setConfirm] = useState('');
  const [showPw,   setShowPw]  = useState(false);
  const [err,      setErr]     = useState('');
  const [busy,     setBusy]    = useState(false);
  const [timer,    setTimer]   = useState(60);

  useEffect(() => {
    if (step !== 'otp') return;
    const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const submit = async e => {
    e.preventDefault();
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    setErr(''); setBusy(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: fullName.trim().split(' ')[0] || fullName.trim(),
        lastName:  fullName.trim().split(' ').slice(1).join(' ') || '',
      });
      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('otp');
      setTimer(60);
    } catch (ex) {
      const msg = ex?.errors?.[0]?.longMessage || ex?.errors?.[0]?.message || ex?.message || 'Registration failed.';
      setErr(msg);
    } finally { setBusy(false); }
  };

  const onOTPComplete = async (code, setOtpErr) => {
    setBusy(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === 'complete') {
        setShowRegisterModal(false);
      } else {
        setOtpErr('Verification failed. Please try again.');
      }
    } catch (ex) {
      const msg = ex?.errors?.[0]?.longMessage || ex?.errors?.[0]?.message || 'Invalid code.';
      setOtpErr(msg);
    } finally { setBusy(false); }
  };

  const onResendOTP = async () => {
    try { await signUp.prepareEmailAddressVerification({ strategy: 'email_code' }); } catch {}
  };

  return (
    <div className="au-overlay" onClick={e => e.target === e.currentTarget && setShowRegisterModal(false)}>
      <div className="au-card">
        <style>{AUTH_CSS}</style>
        <button className="au-close" onClick={() => setShowRegisterModal(false)} aria-label="Close">✕</button>
        <div className="au-logo">✨</div>

        {step === 'form' ? (
          <>
            <h2 className="au-title">Create account</h2>
            <p className="au-sub">Join Datadlue — browse & purchase projects</p>
            {err && <div className="au-error" style={{ marginBottom: 14 }}>{err}</div>}
            <form onSubmit={submit} className="au-form">
              <div>
                <label className="au-label" htmlFor="cl-rg-name">Full Name</label>
                <input id="cl-rg-name" className="au-input" type="text" autoComplete="name"
                  placeholder="e.g. Auwal Kazaure" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="cl-rg-email">Email Address</label>
                <input id="cl-rg-email" className="au-input" type="email" autoComplete="email"
                  placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="cl-rg-pw">Password</label>
                <div className="au-pw-wrap">
                  <input id="cl-rg-pw" className="au-input" type={showPw ? 'text' : 'password'}
                    placeholder="min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="au-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="au-label" htmlFor="cl-rg-confirm">Confirm Password</label>
                <input id="cl-rg-confirm"
                  className={`au-input${confirm && confirm !== password ? ' au-err' : ''}`}
                  type="password" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
                {confirm && confirm !== password && (
                  <p style={{ color: '#ef4444', fontSize: '.72rem', marginTop: 5 }}>Passwords don't match</p>
                )}
              </div>
              <button className="au-btn au-btn-primary" type="submit"
                disabled={busy || !isLoaded || (confirm && confirm !== password)}>
                {busy ? <><span className="au-spinner" />&nbsp;Creating account…</> : '✉️ Send Verification Code →'}
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
            <p className="au-sub" style={{ marginBottom: 8 }}>Check your inbox — we sent a code to</p>
            <div className="au-info" style={{ marginBottom: 18 }}>📧 {email}</div>
            <OTPDigits onComplete={onOTPComplete} onResend={onResendOTP} timer={timer} setTimer={setTimer} />
            <button onClick={() => { setStep('form'); setErr(''); }}
              type="button" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '.82rem', marginTop: 12, width: '100%', textAlign: 'center', fontFamily: 'inherit' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* MOCK LOGIN MODAL (no Clerk key)                             */
/* ══════════════════════════════════════════════════════════ */
function MockLoginModal() {
  const { setShowLoginModal, setShowRegisterModal, loginAdmin, initiateLogin, completeLogin } = useAuth();
  const [step,     setStep]    = useState('form');
  const [email,    setEmail]   = useState('');
  const [password, setPassword]= useState('');
  const [showPw,   setShowPw]  = useState(false);
  const [pending,  setPending] = useState(null);
  const [err,      setErr]     = useState('');
  const [busy,     setBusy]    = useState(false);
  const [timer,    setTimer]   = useState(60);

  const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL;

  useEffect(() => {
    if (step !== 'otp') return;
    const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (isAdmin) {
        await loginAdmin(email.trim(), password);
      } else {
        const res = await initiateLogin(email.trim(), password);
        setPending(res); setStep('otp'); setTimer(60);
      }
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const onOTPComplete = (code, setOtpErr) => {
    if (code !== pending.otp) { setOtpErr('Incorrect code. Try again.'); return; }
    completeLogin(pending.email, pending.password);
    setShowLoginModal(false);
  };

  const onResend = () => {
    const otp = genOTP();
    sendOTPEmailMock(pending.email, otp);
    setPending(p => ({ ...p, otp }));
  };

  return (
    <div className="au-overlay" onClick={e => e.target === e.currentTarget && setShowLoginModal(false)}>
      <div className="au-card">
        <style>{AUTH_CSS}</style>
        <button className="au-close" onClick={() => setShowLoginModal(false)} aria-label="Close">✕</button>
        <div className="au-logo">🔐</div>
        {step === 'form' ? (
          <>
            <h2 className="au-title">Welcome back</h2>
            <p className="au-sub">Sign in to your Datadlue account</p>
            {err && <div className="au-error" style={{ marginBottom: 14 }}>{err}</div>}
            <form onSubmit={submit} className="au-form">
              <div>
                <label className="au-label" htmlFor="mk-li-email">Email Address</label>
                <input id="mk-li-email" className="au-input" type="email" autoComplete="email"
                  placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="mk-li-pw">Password</label>
                <div className="au-pw-wrap">
                  <input id="mk-li-pw" className="au-input" type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="au-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              {isAdmin && <div className="au-admin-tag">🛡 Admin — no OTP required</div>}
              <button className="au-btn au-btn-primary" type="submit" disabled={busy}>
                {busy ? <><span className="au-spinner" />&nbsp;Verifying…</> : isAdmin ? '🛡 Admin Sign In' : 'Continue →'}
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
            <p className="au-sub" style={{ marginBottom: 8 }}>Enter the 6-digit code sent to</p>
            <div className="au-info" style={{ marginBottom: 4 }}>📧 {pending?.email}</div>
            <div className="au-info" style={{ marginBottom: 18, fontSize: '.75rem' }}>
              🔑 Dev mode: OTP printed in browser Console (F12)
            </div>
            <OTPDigits onComplete={onOTPComplete} onResend={onResend} timer={timer} setTimer={setTimer} />
            <button onClick={() => { setStep('form'); setErr(''); }}
              type="button" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '.82rem', marginTop: 12, width: '100%', textAlign: 'center', fontFamily: 'inherit' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* MOCK REGISTER MODAL                                         */
/* ══════════════════════════════════════════════════════════ */
function MockRegisterModal() {
  const { setShowRegisterModal, setShowLoginModal, initiateRegister, completeRegister } = useAuth();
  const [step,     setStep]    = useState('form');
  const [email,    setEmail]   = useState('');
  const [fullName, setFullName]= useState('');
  const [password, setPassword]= useState('');
  const [confirm,  setConfirm] = useState('');
  const [showPw,   setShowPw]  = useState(false);
  const [pending,  setPending] = useState(null);
  const [err,      setErr]     = useState('');
  const [busy,     setBusy]    = useState(false);
  const [timer,    setTimer]   = useState(60);

  useEffect(() => {
    if (step !== 'otp') return;
    const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const submit = async e => {
    e.preventDefault();
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    setErr(''); setBusy(true);
    try {
      const res = await initiateRegister(email.trim(), fullName.trim(), password);
      setPending(res); setStep('otp'); setTimer(60);
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const onOTPComplete = (code, setOtpErr) => {
    if (code !== pending.otp) { setOtpErr('Incorrect code. Try again.'); return; }
    completeRegister(pending.email, pending.fullName);
    setShowRegisterModal(false);
  };

  const onResend = () => {
    const otp = genOTP();
    sendOTPEmailMock(pending.email, otp);
    setPending(p => ({ ...p, otp }));
  };

  return (
    <div className="au-overlay" onClick={e => e.target === e.currentTarget && setShowRegisterModal(false)}>
      <div className="au-card">
        <style>{AUTH_CSS}</style>
        <button className="au-close" onClick={() => setShowRegisterModal(false)} aria-label="Close">✕</button>
        <div className="au-logo">✨</div>
        {step === 'form' ? (
          <>
            <h2 className="au-title">Create account</h2>
            <p className="au-sub">Join Datadlue — browse & purchase projects</p>
            {err && <div className="au-error" style={{ marginBottom: 14 }}>{err}</div>}
            <form onSubmit={submit} className="au-form">
              <div>
                <label className="au-label" htmlFor="mk-rg-name">Full Name</label>
                <input id="mk-rg-name" className="au-input" type="text" autoComplete="name"
                  placeholder="e.g. Auwal Kazaure" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="mk-rg-email">Email Address</label>
                <input id="mk-rg-email" className="au-input" type="email" autoComplete="email"
                  placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="au-label" htmlFor="mk-rg-pw">Password</label>
                <div className="au-pw-wrap">
                  <input id="mk-rg-pw" className="au-input" type={showPw ? 'text' : 'password'}
                    placeholder="min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="au-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div>
                <label className="au-label" htmlFor="mk-rg-confirm">Confirm Password</label>
                <input id="mk-rg-confirm"
                  className={`au-input${confirm && confirm !== password ? ' au-err' : ''}`}
                  type="password" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
                {confirm && confirm !== password && (
                  <p style={{ color: '#ef4444', fontSize: '.72rem', marginTop: 5 }}>Passwords don't match</p>
                )}
              </div>
              <button className="au-btn au-btn-primary" type="submit"
                disabled={busy || (confirm && confirm !== password)}>
                {busy ? <><span className="au-spinner" />&nbsp;Sending OTP…</> : '✉️ Send Verification Code →'}
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
            <p className="au-sub" style={{ marginBottom: 8 }}>Enter the code sent to</p>
            <div className="au-info" style={{ marginBottom: 4 }}>📧 {pending?.email}</div>
            <div className="au-info" style={{ marginBottom: 18, fontSize: '.75rem' }}>
              🔑 Dev mode: OTP in browser Console (F12)
            </div>
            <OTPDigits onComplete={onOTPComplete} onResend={onResend} timer={timer} setTimer={setTimer} />
            <button onClick={() => { setStep('form'); setErr(''); }}
              type="button" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '.82rem', marginTop: 12, width: '100%', textAlign: 'center', fontFamily: 'inherit' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* CLERK BRIDGE (reads Clerk user, maps to our user shape)    */
/* ══════════════════════════════════════════════════════════ */
function ClerkAuthBridge({ children, mockState }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const { showLoginModal, setShowLoginModal, showRegisterModal, setShowRegisterModal, loginAdmin } = mockState;

  const bridgedUser = React.useMemo(() => {
    if (!isLoaded || !clerkUser) return null;
    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    return {
      id:       clerkUser.id,
      email,
      fullName: clerkUser.fullName || clerkUser.firstName || email.split('@')[0],
      isAdmin:  email.toLowerCase() === ADMIN_EMAIL,
      joinedAt: clerkUser.createdAt
        ? new Date(clerkUser.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }, [clerkUser, isLoaded]);

  // Also honour mock-admin session stored in localStorage
  // (admin logs in via mock loginAdmin, so we merge both sources)
  const [mockAdminUser, setMockAdminUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('datadlue_user') || 'null'); } catch { return null; }
  });
  React.useEffect(() => {
    const handle = () => {
      try { setMockAdminUser(JSON.parse(localStorage.getItem('datadlue_user') || 'null')); } catch {}
    };
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, []);

  const effectiveUser = bridgedUser || (mockAdminUser?.isAdmin ? mockAdminUser : null);

  const logout = async () => {
    localStorage.removeItem('datadlue_user');
    setMockAdminUser(null);
    await signOut();
  };

  const ctxValue = React.useMemo(() => ({
    user: effectiveUser,
    loading: !isLoaded,
    logout,
    showLoginModal,    setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    loginAdmin,
    // unused in Clerk mode but kept for API compat
    initiateLogin:    () => Promise.resolve(),
    completeLogin:    () => {},
    initiateRegister: () => Promise.resolve(),
    completeRegister: () => {},
    isMockAuth: false,
  }), [effectiveUser, isLoaded, logout, showLoginModal, showRegisterModal, loginAdmin]); // eslint-disable-line

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
      {showLoginModal    && <ClerkLoginModal />}
      {showRegisterModal && <ClerkRegisterModal />}
    </AuthContext.Provider>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* AUTH PROVIDER (top-level export)                           */
/* ══════════════════════════════════════════════════════════ */
export function AuthProvider({ children }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  /* ── Mock-mode state ─────────────────────────────────── */
  const [mockUser,          setMockUser]          = useState(null);
  const [mockLoading,       setMockLoading]       = useState(true);
  const [showLoginModal,    setShowLoginModal]    = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('datadlue_user');
      if (saved) setMockUser(JSON.parse(saved));
    } catch {}
    setMockLoading(false);
  }, []);

  /* ── Admin login (mock, works in both modes) ─────────── */
  const loginAdmin = (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASS) {
        reject(new Error('Invalid admin credentials.')); return;
      }
      const u = {
        id: 'usr-admin', email: ADMIN_EMAIL,
        fullName: 'System Administrator', isAdmin: true,
        joinedAt: new Date().toISOString(),
      };
      setMockUser(u);
      localStorage.setItem('datadlue_user', JSON.stringify(u));
      resolve(u);
    }, 600);
  });

  /* ── Mock regular login ──────────────────────────────── */
  const initiateLogin = (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes('@')) { reject(new Error('Enter a valid email.')); return; }
      if (!password || password.length < 6) { reject(new Error('Password must be ≥ 6 chars.')); return; }
      const otp = genOTP();
      sendOTPEmailMock(email, otp);
      resolve({ otp, email, password });
    }, 700);
  });

  const completeLogin = (email) => {
    const u = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(), fullName: email.split('@')[0],
      isAdmin: false, joinedAt: new Date().toISOString(),
    };
    setMockUser(u);
    localStorage.setItem('datadlue_user', JSON.stringify(u));
    setShowLoginModal(false);
    return u;
  };

  /* ── Mock register ───────────────────────────────────── */
  const initiateRegister = (email, fullName, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !email.includes('@')) { reject(new Error('Enter a valid email.')); return; }
      if (!fullName || fullName.trim().length < 3) { reject(new Error('Name too short (min 3 chars).')); return; }
      if (!password || password.length < 8) { reject(new Error('Password must be ≥ 8 chars.')); return; }
      const otp = genOTP();
      sendOTPEmailMock(email, otp);
      resolve({ otp, email, fullName, password });
    }, 700);
  });

  const completeRegister = (email, fullName) => {
    const u = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(), fullName: fullName.trim(),
      isAdmin: false, joinedAt: new Date().toISOString(),
    };
    setMockUser(u);
    localStorage.setItem('datadlue_user', JSON.stringify(u));
    setShowRegisterModal(false);
    return u;
  };

  const mockLogout = () => {
    setMockUser(null);
    localStorage.removeItem('datadlue_user');
  };

  const mockState = {
    showLoginModal, setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    loginAdmin,
  };

  /* ── Clerk mode ──────────────────────────────────────── */
  if (publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        <ClerkAuthBridge mockState={mockState}>
          {children}
        </ClerkAuthBridge>
      </ClerkProvider>
    );
  }

  /* ── Mock mode (no Clerk key) ────────────────────────── */
  const mockValue = {
    user: mockUser, loading: mockLoading, logout: mockLogout,
    showLoginModal,    setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    loginAdmin, initiateLogin, completeLogin,
    initiateRegister, completeRegister,
    isMockAuth: true,
  };

  return (
    <AuthContext.Provider value={mockValue}>
      {children}
      {showLoginModal    && <MockLoginModal />}
      {showRegisterModal && <MockRegisterModal />}
    </AuthContext.Provider>
  );
}
