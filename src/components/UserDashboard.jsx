// ============================================================
// DATADLUE LABS — USER DASHBOARD (UserDashboard.jsx)
// Fix: removed data-reveal (blank screen), fixed fetching guard
// Premium dark card UI with purchase history & download links
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../database/db';
import { useAuth } from './ClerkMockAuth';

/* ── Scoped styles ─────────────────────────────────────────── */
const UD_CSS = `
  @keyframes ud-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  .ud-shell {
    min-height: 100vh;
    padding: 100px 0 80px;
    background: #0d0d0d;
    animation: ud-in .4s ease;
  }
  .ud-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  /* Header */
  .ud-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 20px; flex-wrap: wrap; margin-bottom: 40px;
    padding-bottom: 32px; border-bottom: 1px solid rgba(245,164,74,.12);
  }
  .ud-eyebrow { font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:#f5a44a;font-weight:700;margin:0 0 6px; }
  .ud-title   { font-size:clamp(1.6rem,4vw,2.4rem);font-weight:800;color:#fff;margin:0 0 6px; }
  .ud-sub     { font-size:.9rem;color:#666;margin:0; }

  /* Profile chip */
  .ud-profile-chip {
    display:flex;align-items:center;gap:14px;
    background:#141414;border:1px solid rgba(245,164,74,.15);border-radius:14px;padding:14px 18px;
  }
  .ud-avatar {
    width:46px;height:46px;border-radius:12px;
    background:linear-gradient(135deg,#f5a44a,#e07b1a);
    display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;
  }
  .ud-profile-info strong { display:block;color:#ddd;font-size:.92rem; }
  .ud-profile-info span   { font-size:.72rem;color:#555; }

  /* Stat bar */
  .ud-stats { display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:36px; }
  .ud-stat-card {
    background:#141414;border:1px solid rgba(255,255,255,.06);border-radius:14px;
    padding:18px 20px;display:flex;align-items:center;gap:14px;
  }
  .ud-stat-icon { font-size:1.5rem; }
  .ud-stat-val  { font-size:1.3rem;font-weight:800;color:#f5a44a;display:block;line-height:1.2; }
  .ud-stat-lbl  { font-size:.7rem;color:#555;text-transform:uppercase;letter-spacing:.05em; }

  /* Section */
  .ud-section-title {
    font-size:1.05rem;font-weight:700;color:#ddd;
    display:flex;align-items:center;gap:10px;margin:0 0 20px;
  }
  .ud-badge {
    background:rgba(245,164,74,.15);color:#f5a44a;border-radius:20px;
    padding:2px 10px;font-size:.72rem;font-weight:700;
  }

  /* Empty state */
  .ud-empty {
    background:#141414;border:1px dashed rgba(245,164,74,.2);border-radius:18px;
    text-align:center;padding:60px 32px;
  }
  .ud-empty-icon { font-size:3.5rem;display:block;margin-bottom:16px; }
  .ud-empty h3   { font-size:1.2rem;color:#ddd;margin:0 0 8px; }
  .ud-empty p    { color:#555;font-size:.88rem;margin:0 0 24px; }

  /* Purchase card */
  .ud-purchase-list { display:flex;flex-direction:column;gap:20px; }
  .ud-purchase-card {
    background:#141414;border:1px solid rgba(255,255,255,.06);border-radius:16px;
    overflow:hidden;transition:border-color .2s,transform .2s;
  }
  .ud-purchase-card:hover { border-color:rgba(245,164,74,.25);transform:translateY(-2px); }

  .ud-card-top { display:flex;gap:16px;padding:22px 22px 0;align-items:flex-start;flex-wrap:wrap; }
  .ud-card-img { width:110px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;background:#1a1a1a; }

  .ud-card-meta { flex:1;min-width:0; }
  .ud-order-tag { font-size:.65rem;font-family:monospace;color:#f5a44a;background:rgba(245,164,74,.1);padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:6px; }
  .ud-card-title{ font-size:1rem;font-weight:700;color:#ddd;margin:0 0 8px;line-height:1.4; }
  .ud-tags      { display:flex;gap:6px;flex-wrap:wrap; }
  .ud-tag       { font-size:.67rem;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(245,164,74,.12);color:#f5a44a; }

  .ud-card-price{ font-size:1.2rem;font-weight:800;color:#22c55e;flex-shrink:0; }

  .ud-card-desc { padding:12px 22px;font-size:.85rem;color:#666;line-height:1.6;margin:0; }

  .ud-card-footer {
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
    padding:16px 22px;border-top:1px solid rgba(255,255,255,.05);background:#111;
  }
  .ud-date { font-size:.75rem;color:#555; }
  .ud-dl-btns { display:flex;gap:8px;flex-wrap:wrap; }

  /* Buttons */
  .ud-btn {
    display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;
    font-weight:700;font-size:.8rem;text-decoration:none;border:none;cursor:pointer;transition:.2s;
  }
  .ud-btn-primary { background:linear-gradient(135deg,#f5a44a,#e07b1a);color:#1a0800; }
  .ud-btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 18px rgba(245,164,74,.3); }
  .ud-btn-ghost   { background:rgba(255,255,255,.06);color:#aaa;border:1px solid rgba(255,255,255,.1); }
  .ud-btn-ghost:hover { background:rgba(255,255,255,.1);color:#ddd; }
  .ud-btn-green   { background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2); }
  .ud-btn-green:hover { background:rgba(34,197,94,.18); }

  /* Loading */
  .ud-loading {
    min-height:100vh;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:16px;background:#0d0d0d;
  }
  .ud-spinner {
    width:44px;height:44px;border:3px solid rgba(245,164,74,.12);
    border-top-color:#f5a44a;border-radius:50%;animation:au-spin 1s linear infinite;
  }
  @keyframes au-spin { to{transform:rotate(360deg)} }

  @media(max-width:600px){
    .ud-card-top { flex-direction:column; }
    .ud-card-img { width:100%;height:160px; }
    .ud-card-footer { flex-direction:column;align-items:flex-start; }
  }
`;

/* ══════════════════════════════════════════════════════════ */
/* COMPONENT                                                   */
/* ══════════════════════════════════════════════════════════ */
export default function UserDashboard() {
  const navigate  = useNavigate();
  const { user, loading, logout } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [fetching,  setFetching]  = useState(false); // start false — only true during active fetch

  /* ── Auth guard ─────────────────────────────────────────── */
  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  /* ── Load purchases whenever user changes ───────────────── */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    db.getUserPurchases(user.email)
      .then(data => { if (!cancelled) setPurchases(data || []); })
      .catch(err  => console.error('Dashboard load error:', err))
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [user]);

  /* ── Full loading state (auth not resolved yet) ──────────── */
  if (loading) {
    return (
      <div className="ud-loading">
        <style>{UD_CSS}</style>
        <div className="ud-spinner" />
        <p style={{color:'#f5a44a',fontWeight:600}}>Loading your workspace…</p>
      </div>
    );
  }

  if (!user) return null; // guard — redirect already fired

  const totalSpent = purchases.reduce((s, p) => s + (p.projectPrice || 0), 0);

  return (
    <>
      <style>{UD_CSS}</style>
      <div className="ud-shell">
        <div className="ud-container">

          {/* ── Header ────────────────────────────────────────── */}
          <div className="ud-header">
            <div>
              <p className="ud-eyebrow">User Workspace</p>
              <h1 className="ud-title">Hello, {user.fullName || user.email.split('@')[0]} 👋</h1>
              <p className="ud-sub">Manage your purchases, downloads, and project files.</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,alignItems:'flex-end'}}>
              <div className="ud-profile-chip">
                <div className="ud-avatar">👤</div>
                <div className="ud-profile-info">
                  <strong>{user.email}</strong>
                  <span>✅ Verified Account</span>
                </div>
              </div>
              <button
                className="ud-btn ud-btn-ghost"
                onClick={() => { logout(); navigate('/'); }}
                style={{alignSelf:'stretch',justifyContent:'center'}}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* ── Stats ─────────────────────────────────────────── */}
          <div className="ud-stats">
            <div className="ud-stat-card">
              <span className="ud-stat-icon">📦</span>
              <div>
                <span className="ud-stat-val">{purchases.length}</span>
                <span className="ud-stat-lbl">Projects Purchased</span>
              </div>
            </div>
            <div className="ud-stat-card">
              <span className="ud-stat-icon">💰</span>
              <div>
                <span className="ud-stat-val">₦{totalSpent.toLocaleString()}</span>
                <span className="ud-stat-lbl">Total Invested</span>
              </div>
            </div>
            <div className="ud-stat-card">
              <span className="ud-stat-icon">📥</span>
              <div>
                <span className="ud-stat-val">{purchases.length}</span>
                <span className="ud-stat-lbl">Downloads Available</span>
              </div>
            </div>
            <div className="ud-stat-card">
              <span className="ud-stat-icon">📅</span>
              <div>
                <span className="ud-stat-val">{new Date(user.joinedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                <span className="ud-stat-lbl">Member Since</span>
              </div>
            </div>
          </div>

          {/* ── Purchases ─────────────────────────────────────── */}
          <h2 className="ud-section-title">
            🗂 Your Purchased Projects
            <span className="ud-badge">{purchases.length}</span>
          </h2>

          {fetching ? (
            <div style={{textAlign:'center',padding:40}}>
              <div className="ud-spinner" style={{margin:'0 auto 12px'}} />
              <p style={{color:'#555',fontSize:'.88rem'}}>Loading your orders…</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="ud-empty">
              <span className="ud-empty-icon">📁</span>
              <h3>No Projects Yet</h3>
              <p>Browse our marketplace and purchase final year projects — source code, PDFs, and full documentation included.</p>
              <Link to="/marketplace" className="ud-btn ud-btn-primary">
                🛒 Browse Marketplace →
              </Link>
            </div>
          ) : (
            <div className="ud-purchase-list">
              {purchases.map(purchase => {
                const proj = purchase.projectDetails || {};
                const img  = proj.images?.[0];
                return (
                  <article key={purchase.orderId} className="ud-purchase-card">
                    <div className="ud-card-top">
                      {img && (
                        <img src={img} alt={proj.title} className="ud-card-img"
                          onError={e => e.target.style.display='none'} />
                      )}
                      <div className="ud-card-meta">
                        <span className="ud-order-tag">ORDER #{purchase.orderId?.toUpperCase()}</span>
                        <h3 className="ud-card-title">{proj.title || purchase.projectTitle}</h3>
                        <div className="ud-tags">
                          {(proj.technologies || []).slice(0,5).map(t => (
                            <span key={t} className="ud-tag">{t}</span>
                          ))}
                          {proj.department && <span className="ud-tag" style={{background:'rgba(168,85,247,.12)',color:'#a855f7'}}>{proj.department}</span>}
                          {proj.level      && <span className="ud-tag" style={{background:'rgba(56,189,248,.12)',color:'#38bdf8'}}>{proj.level}</span>}
                        </div>
                      </div>
                      <div className="ud-card-price">₦{(purchase.projectPrice||0).toLocaleString()}</div>
                    </div>

                    {proj.description && (
                      <p className="ud-card-desc">{proj.description}</p>
                    )}

                    <div className="ud-card-footer">
                      <span className="ud-date">
                        📅 Purchased {new Date(purchase.purchaseDate).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}
                      </span>
                      <div className="ud-dl-btns">
                        <a
                          href={proj.pdfUrl || '#'}
                          download={`${(proj.title||'project').replace(/\s+/g,'_')}_Source.zip`}
                          className="ud-btn ud-btn-primary"
                          onClick={e => { if (!proj.pdfUrl || proj.pdfUrl === '#') { e.preventDefault(); alert('Download link not available for this project yet. Contact support.'); } }}
                        >
                          📥 Source Code
                        </a>
                        <a
                          href={proj.pdfUrl || '#'}
                          download={`${(proj.title||'project').replace(/\s+/g,'_')}_Report.pdf`}
                          className="ud-btn ud-btn-ghost"
                          onClick={e => { if (!proj.pdfUrl || proj.pdfUrl === '#') { e.preventDefault(); alert('PDF not available yet. Contact support.'); } }}
                        >
                          📄 PDF Report
                        </a>
                        <a href="mailto:Datadlue@gmail.com" className="ud-btn ud-btn-green">
                          💬 Get Support
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── CTA to marketplace ──────────────────────────── */}
          {purchases.length > 0 && (
            <div style={{textAlign:'center',marginTop:40}}>
              <Link to="/marketplace" className="ud-btn ud-btn-primary" style={{fontSize:'.95rem',padding:'12px 28px'}}>
                🛒 Browse More Projects →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
