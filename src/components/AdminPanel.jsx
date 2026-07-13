// ============================================================
// DATADLUE LABS — ADMIN CONTROL PANEL v2
// Fully fixed: no data-reveal bug, proper loading guards,
// premium dark UI with sidebar navigation
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../database/db';
import { useAuth } from './ClerkMockAuth';

/* ═══════════════════════════════════════════════════════════ */
/* CONSTANTS & HELPERS                                          */
/* ═══════════════════════════════════════════════════════════ */
const DEPARTMENTS = ['Computer Science','Cybersecurity','Networking','IT','Electrical Engineering','Mechanical Engineering'];
const LEVELS      = ['ND','HND','B.Sc','M.Sc','Ph.D'];

function fmt(n) { return Number(n || 0).toLocaleString(); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }

/* ── Toast hook ─────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800);
  };
  return { toasts, ok: m => push(m,'ok'), err: m => push(m,'err'), info: m => push(m,'info') };
}

function ToastLayer({ toasts }) {
  const colors = {
    ok:   { bg:'rgba(34,197,94,0.12)',  border:'#22c55e', color:'#22c55e'  },
    err:  { bg:'rgba(239,68,68,0.12)',  border:'#ef4444', color:'#ef4444'  },
    info: { bg:'rgba(245,164,74,0.12)', border:'#f5a44a', color:'#f5a44a' },
  };
  return (
    <div style={{position:'fixed',top:84,right:20,zIndex:99999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            background:c.bg, border:`1px solid ${c.border}`, color:c.color,
            padding:'12px 20px', borderRadius:10, fontSize:'0.88rem', fontWeight:600,
            backdropFilter:'blur(16px)', animation:'ap-slide-in 0.3s ease',
            boxShadow:`0 4px 24px ${c.border}33`, maxWidth:320,
          }}>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* STAT CARD                                                    */
/* ═══════════════════════════════════════════════════════════ */
function KPICard({ icon, label, value, sub, color = '#f5a44a', trend }) {
  return (
    <div className="ap-kpi-card">
      <div className="ap-kpi-icon" style={{background:`${color}18`, color}}>{icon}</div>
      <div className="ap-kpi-body">
        <span className="ap-kpi-label">{label}</span>
        <strong className="ap-kpi-value" style={{color}}>{value}</strong>
        {sub && <span className="ap-kpi-sub">{sub}</span>}
      </div>
      {trend !== undefined && (
        <div className="ap-kpi-trend" style={{color: trend >= 0 ? '#22c55e' : '#ef4444'}}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* BAR CHART                                                    */
/* ═══════════════════════════════════════════════════════════ */
function BarChart({ title, rows, valueKey, labelKey, color = '#f5a44a', unit = '' }) {
  const max = Math.max(...rows.map(r => r[valueKey]), 1);
  return (
    <div className="ap-chart-card">
      <h4 className="ap-chart-title">{title}</h4>
      <div className="ap-bars">
        {rows.map((r, i) => {
          const pct = (r[valueKey] / max) * 100;
          return (
            <div key={i} className="ap-bar-row">
              <span className="ap-bar-label" title={r[labelKey]}>{r[labelKey]}</span>
              <div className="ap-bar-track">
                <div className="ap-bar-fill" style={{width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`}}>
                  <span className="ap-bar-val">{unit}{typeof r[valueKey] === 'number' ? fmt(r[valueKey]) : r[valueKey]}</span>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="ap-empty-msg">No data yet.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* PROJECT FORM MODAL                                           */
/* ═══════════════════════════════════════════════════════════ */
const BLANK = {title:'',description:'',department:'Computer Science',level:'B.Sc',price:30000,technologies:'',pdfUrl:'',img0:'',img1:'',img2:'',img3:''};

function ProjectForm({ project, onClose, onDone, toast }) {
  const init = project ? {
    title:       project.title,
    description: project.description,
    department:  project.department,
    level:       project.level,
    price:       project.price,
    technologies:(project.technologies||[]).join(', '),
    pdfUrl:      project.pdfUrl || '',
    img0: project.images?.[0] || '',
    img1: project.images?.[1] || '',
    img2: project.images?.[2] || '',
    img3: project.images?.[3] || '',
  } : BLANK;

  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!f.title.trim()) return toast.err('Title is required.');
    if (!f.img0.trim()) return toast.err('At least one screenshot URL is required.');
    setBusy(true);
    const data = {
      title:       f.title.trim(),
      description: f.description.trim(),
      department:  f.department,
      level:       f.level,
      price:       Number(f.price),
      technologies: f.technologies.split(',').map(t => t.trim()).filter(Boolean),
      pdfUrl:      f.pdfUrl.trim(),
      images:      [f.img0,f.img1,f.img2,f.img3].filter(Boolean),
    };
    if (project) { data.id = project.id; data.sales = project.sales; data.createdAt = project.createdAt; }
    try {
      await db.saveProject(data);
      window.dispatchEvent(new Event('datadlue_projects_updated'));
      toast.ok(project ? '✅ Project updated!' : '🚀 Project published!');
      onDone(); onClose();
    } catch (err) { toast.err('❌ ' + err.message); }
    finally { setBusy(false); }
  };

  const previews = [f.img0,f.img1,f.img2,f.img3].filter(Boolean);

  return (
    <div className="ap-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal-box">
        {/* Header */}
        <div className="ap-modal-header">
          <div>
            <h3 className="ap-modal-title">{project ? '✏️ Edit Project' : '🚀 Add New Project'}</h3>
            <p className="ap-modal-sub">All fields marked * are required</p>
          </div>
          <button className="ap-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={submit} className="ap-form">
          {/* Title + Price */}
          <div className="ap-form-row">
            <div className="ap-form-group ap-form-grow">
              <label className="ap-label" htmlFor="pf-title">Project Title *</label>
              <input id="pf-title" className="ap-input" value={f.title} onChange={set('title')}
                placeholder="e.g. AgriSense AI Crop Monitor" required />
            </div>
            <div className="ap-form-group" style={{width:140}}>
              <label className="ap-label" htmlFor="pf-price">Price (₦) *</label>
              <input id="pf-price" className="ap-input" type="number" value={f.price}
                onChange={set('price')} min="1000" required />
            </div>
          </div>

          {/* Description */}
          <div className="ap-form-group">
            <label className="ap-label" htmlFor="pf-desc">Description *</label>
            <textarea id="pf-desc" className="ap-input ap-textarea" rows={4} value={f.description}
              onChange={set('description')} placeholder="What does this project do? Mention modules, methodology, impact…" required />
          </div>

          {/* Dept / Level / Tech */}
          <div className="ap-form-row">
            <div className="ap-form-group ap-form-grow">
              <label className="ap-label" htmlFor="pf-dept">Department *</label>
              <select id="pf-dept" className="ap-input ap-select" value={f.department} onChange={set('department')}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="ap-form-group" style={{width:120}}>
              <label className="ap-label" htmlFor="pf-level">Level *</label>
              <select id="pf-level" className="ap-input ap-select" value={f.level} onChange={set('level')}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="ap-form-group ap-form-grow">
              <label className="ap-label" htmlFor="pf-tech">Technologies * <small>(comma-separated)</small></label>
              <input id="pf-tech" className="ap-input" value={f.technologies} onChange={set('technologies')}
                placeholder="React, Python, TensorFlow" required />
            </div>
          </div>

          {/* Screenshots */}
          <p className="ap-section-label">📸 GUI Screenshots (URLs)</p>
          <div className="ap-form-row ap-form-wrap">
            {['img0','img1','img2','img3'].map((k,i) => (
              <div key={k} className="ap-form-group" style={{flex:'1 1 200px'}}>
                <label className="ap-label" htmlFor={`pf-${k}`}>
                  Screenshot {i+1}{i===0?' *':''}
                </label>
                <input id={`pf-${k}`} className="ap-input" value={f[k]} onChange={set(k)}
                  placeholder="https://… or /img.png" required={i===0} />
              </div>
            ))}
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="ap-img-previews">
              {previews.map((url,i) => (
                <img key={i} src={url} alt={`preview ${i+1}`} className="ap-img-thumb"
                  onError={e => e.target.style.opacity='0.2'} />
              ))}
            </div>
          )}

          {/* Download link */}
          <div className="ap-form-group">
            <label className="ap-label" htmlFor="pf-pdf">Download Link (ZIP / PDF / APK) *</label>
            <input id="pf-pdf" className="ap-input" value={f.pdfUrl} onChange={set('pdfUrl')}
              placeholder="https://… or /files/project.zip" required />
          </div>

          {/* Actions */}
          <div className="ap-form-actions">
            <button type="button" className="ap-btn ap-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="ap-btn ap-btn-primary" disabled={busy}>
              {busy ? <span className="ap-spin" /> : null}
              {busy ? 'Saving…' : project ? '💾 Save Changes' : '🚀 Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* OVERVIEW TAB                                                 */
/* ═══════════════════════════════════════════════════════════ */
function OverviewTab({ analytics, projects, orders }) {
  const topSales = analytics.popularProjects.map(p => ({
    title: p.title.length > 28 ? p.title.slice(0,28)+'…' : p.title,
    sales: p.sales,
  }));

  const topRev = [...projects]
    .map(p => ({ title: p.title.length > 28 ? p.title.slice(0,28)+'…' : p.title, rev: p.price * p.sales }))
    .sort((a,b) => b.rev - a.rev).slice(0,5);

  const byDept = Object.entries(
    projects.reduce((acc,p) => { acc[p.department] = (acc[p.department]||0)+1; return acc; }, {})
  ).map(([title,count]) => ({title,count})).sort((a,b) => b.count - a.count);

  return (
    <div className="ap-tab-body">
      {/* KPI row */}
      <div className="ap-kpi-grid">
        <KPICard icon="💰" label="Total Revenue"      value={`₦${fmt(analytics.totalRevenue)}`}   color="#f5a44a" sub="all time" />
        <KPICard icon="📦" label="Projects Listed"    value={projects.length}                      color="#a855f7" sub="in marketplace" />
        <KPICard icon="🛒" label="Total Orders"       value={fmt(analytics.totalSales)}            color="#22c55e" sub="packages sold" />
        <KPICard icon="👥" label="Registered Users"   value={fmt(analytics.uniqueBuyers)}          color="#38bdf8" sub="unique buyers" />
        <KPICard icon="⭐" label="Avg. Project Price"
          value={`₦${projects.length ? fmt(Math.round(projects.reduce((s,p)=>s+p.price,0)/projects.length)) : 0}`}
          color="#fb923c" />
        <KPICard icon="🔥" label="Best Seller"
          value={analytics.popularProjects[0]?.title?.split(':')[0] || '—'}
          color="#f43f5e" sub={`${analytics.popularProjects[0]?.sales||0} sales`} />
      </div>

      {/* Charts */}
      <div className="ap-charts-grid">
        <BarChart title="🏆 Top Projects by Sales"    rows={topSales} valueKey="sales" labelKey="title" color="#f5a44a" />
        <BarChart title="💵 Top by Revenue"           rows={topRev}   valueKey="rev"   labelKey="title" color="#a855f7" unit="₦" />
        <BarChart title="📂 Projects per Department"  rows={byDept}   valueKey="count" labelKey="title" color="#22c55e" />
      </div>

      {/* Recent orders */}
      <div className="ap-section-card">
        <h4 className="ap-section-title">🕐 Recent Orders</h4>
        {orders.length === 0
          ? <p className="ap-empty-msg">No orders yet. Sales will appear here once users purchase projects.</p>
          : (
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Project</th><th>Buyer</th><th>Amount</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0,10).map(o => (
                    <tr key={o.orderId}>
                      <td><code className="ap-code">{o.orderId}</code></td>
                      <td className="ap-clamp">{o.projectTitle}</td>
                      <td>{o.purchasedBy}</td>
                      <td><strong style={{color:'#22c55e'}}>₦{fmt(o.projectPrice)}</strong></td>
                      <td style={{opacity:.7}}>{fmtDate(o.purchaseDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* PROJECTS TAB                                                 */
/* ═══════════════════════════════════════════════════════════ */
function ProjectsTab({ projects, onAdd, onEdit, onDelete }) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? projects.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.department.toLowerCase().includes(q.toLowerCase()) ||
        (p.technologies||[]).some(t => t.toLowerCase().includes(q.toLowerCase()))
      )
    : projects;

  return (
    <div className="ap-tab-body">
      <div className="ap-tab-topbar">
        <div className="ap-search-wrap">
          <span className="ap-search-icon">🔍</span>
          <input className="ap-search" value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search by title, department, or technology…" />
          {q && <button className="ap-search-clear" onClick={()=>setQ('')}>✕</button>}
        </div>
        <button className="ap-btn ap-btn-primary" onClick={onAdd}>
          + Add Project
        </button>
      </div>

      <div className="ap-section-card ap-no-pad">
        <div className="ap-section-header">
          <h4 className="ap-section-title" style={{margin:0}}>
            Marketplace Inventory
            <span className="ap-badge">{filtered.length} / {projects.length}</span>
          </h4>
        </div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th><th>Project</th><th>Dept</th><th>Level</th>
                <th>Technologies</th><th>Price</th><th>Sales</th><th>Revenue</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="ap-empty-msg" style={{padding:40}}>
                  No projects match your search.
                </td></tr>
              )}
              {filtered.map((p,i) => (
                <tr key={p.id} className="ap-table-row-hover">
                  <td className="ap-dim">{i+1}</td>
                  <td>
                    <div className="ap-proj-cell">
                      <strong>{p.title}</strong>
                      <small className="ap-dim">{fmtDate(p.createdAt)}</small>
                    </div>
                  </td>
                  <td><span className="ap-chip ap-chip-dept">{p.department}</span></td>
                  <td><span className="ap-chip ap-chip-level">{p.level}</span></td>
                  <td>
                    <div className="ap-tags">
                      {(p.technologies||[]).slice(0,3).map(t => (
                        <span key={t} className="ap-chip ap-chip-tech">{t}</span>
                      ))}
                      {(p.technologies||[]).length > 3 && (
                        <span className="ap-chip ap-chip-tech ap-dim">+{p.technologies.length-3}</span>
                      )}
                    </div>
                  </td>
                  <td><strong>₦{fmt(p.price)}</strong></td>
                  <td>
                    <span style={{color: p.sales>10?'#22c55e':p.sales>5?'#f5a44a':'inherit', fontWeight:700}}>
                      {p.sales}
                    </span>
                  </td>
                  <td><strong style={{color:'#22c55e'}}>₦{fmt(p.price*p.sales)}</strong></td>
                  <td>
                    <div className="ap-row-actions">
                      <button className="ap-btn-sm ap-btn-edit" onClick={()=>onEdit(p)}>✏️ Edit</button>
                      <button className="ap-btn-sm ap-btn-del"  onClick={()=>onDelete(p.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* USERS TAB                                                    */
/* ═══════════════════════════════════════════════════════════ */
function UsersTab({ orders }) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState(null);

  // Build user map from orders
  const userMap = {};
  orders.forEach(o => {
    if (!userMap[o.purchasedBy]) {
      userMap[o.purchasedBy] = { email:o.purchasedBy, spent:0, purchases:0, last:o.purchaseDate, orders:[] };
    }
    userMap[o.purchasedBy].spent      += o.projectPrice;
    userMap[o.purchasedBy].purchases  += 1;
    if (o.purchaseDate > userMap[o.purchasedBy].last) userMap[o.purchasedBy].last = o.purchaseDate;
    userMap[o.purchasedBy].orders.push(o);
  });

  // Also include currently logged-in non-admin user
  try {
    const u = JSON.parse(localStorage.getItem('datadlue_user')||'null');
    if (u && !u.isAdmin && !userMap[u.email]) {
      userMap[u.email] = { email:u.email, fullName:u.fullName, spent:0, purchases:0, last:u.joinedAt, orders:[] };
    }
  } catch {}

  let users = Object.values(userMap).sort((a,b) => b.spent - a.spent);
  if (q.trim()) users = users.filter(u => u.email.toLowerCase().includes(q.toLowerCase()));

  const totalRev  = users.reduce((s,u) => s+u.spent, 0);
  const active    = users.filter(u => u.purchases > 0).length;
  const avgSpend  = active ? Math.round(totalRev/active) : 0;

  return (
    <div className="ap-tab-body">
      <div className="ap-kpi-grid">
        <KPICard icon="👤" label="Total Accounts"   value={users.length}        color="#38bdf8" />
        <KPICard icon="🛒" label="Active Buyers"    value={active}              color="#22c55e" sub="made ≥1 purchase" />
        <KPICard icon="💰" label="User Revenue"     value={`₦${fmt(totalRev)}`} color="#f5a44a" />
        <KPICard icon="📊" label="Avg. Spend"       value={`₦${fmt(avgSpend)}`} color="#a855f7" />
      </div>

      <div className="ap-tab-topbar">
        <div className="ap-search-wrap">
          <span className="ap-search-icon">🔍</span>
          <input className="ap-search" value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search users by email…" />
          {q && <button className="ap-search-clear" onClick={()=>setQ('')}>✕</button>}
        </div>
      </div>

      <div className="ap-section-card ap-no-pad">
        <div className="ap-section-header">
          <h4 className="ap-section-title" style={{margin:0}}>
            Registered Users <span className="ap-badge">{users.length}</span>
          </h4>
        </div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th><th>Email</th><th>Purchases</th>
                <th>Total Spent</th><th>Last Active</th><th>Status</th><th>History</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={7} className="ap-empty-msg" style={{padding:40}}>
                  No users yet. Users appear here once they register or make a purchase.
                </td></tr>
              )}
              {users.map((u,i) => (
                <React.Fragment key={u.email}>
                  <tr className="ap-table-row-hover">
                    <td className="ap-dim">{i+1}</td>
                    <td>
                      <div className="ap-proj-cell">
                        <strong>{u.email}</strong>
                        {u.fullName && <small className="ap-dim">{u.fullName}</small>}
                      </div>
                    </td>
                    <td>
                      <span style={{fontWeight:700, color:u.purchases>2?'#22c55e':u.purchases>0?'#f5a44a':'inherit'}}>
                        {u.purchases}
                      </span>
                    </td>
                    <td><strong style={{color:'#f5a44a'}}>₦{fmt(u.spent)}</strong></td>
                    <td className="ap-dim">{fmtDate(u.last)}</td>
                    <td>
                      {u.purchases > 0
                        ? <span className="ap-status ap-status-active">● Active</span>
                        : <span className="ap-status ap-status-reg">○ Registered</span>
                      }
                    </td>
                    <td>
                      {u.orders.length > 0 ? (
                        <button
                          className="ap-btn-sm ap-btn-edit"
                          onClick={() => setExpanded(expanded===u.email ? null : u.email)}
                        >
                          {expanded===u.email ? 'Hide ▲' : `${u.orders.length} orders ▼`}
                        </button>
                      ) : <span className="ap-dim">—</span>}
                    </td>
                  </tr>
                  {expanded === u.email && (
                    <tr>
                      <td colSpan={7} style={{background:'rgba(245,164,74,0.04)', padding:'12px 20px 16px'}}>
                        <p style={{fontSize:'0.78rem', color:'#f5a44a', fontWeight:700, marginBottom:8}}>
                          Purchase History — {u.email}
                        </p>
                        <table style={{width:'100%', fontSize:'0.82rem', borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{opacity:.6}}>
                              {['Order ID','Project','Amount','Date'].map(h => (
                                <th key={h} style={{textAlign:'left',padding:'4px 10px',fontWeight:600}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {u.orders.map(o => (
                              <tr key={o.orderId} style={{borderTop:'1px solid rgba(245,164,74,0.1)'}}>
                                <td style={{padding:'6px 10px',color:'#f5a44a',fontFamily:'monospace'}}>{o.orderId}</td>
                                <td style={{padding:'6px 10px'}}>{o.projectTitle}</td>
                                <td style={{padding:'6px 10px'}}>₦{fmt(o.projectPrice)}</td>
                                <td style={{padding:'6px 10px',opacity:.7}}>{fmtDate(o.purchaseDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* MAIN ADMIN PANEL                                             */
/* ═══════════════════════════════════════════════════════════ */
const TABS = [
  { id:'overview',  icon:'📊', label:'Overview'  },
  { id:'projects',  icon:'📦', label:'Projects'  },
  { id:'users',     icon:'👥', label:'Users'     },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const toast = useToast();

  const [tab,      setTab]      = useState('overview');
  const [projects, setProjects] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [analytics,setAnalytics]= useState(null);
  const [dataErr,  setDataErr]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  /* ── Auth guard ──────────────────────────────────────────── */
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  /* ── Load data (safe, no data-reveal dependency) ─────────── */
  const load = async () => {
    try {
      setDataErr(null);
      const [projs, ords, stats] = await Promise.all([
        db.getProjects(), db.getOrders(), db.getAnalytics()
      ]);
      setProjects(projs || []);
      setOrders((ords || []).slice().reverse());
      setAnalytics(stats);
    } catch (e) {
      setDataErr(e.message);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin) load();
  }, [user]); // eslint-disable-line

  /* ── Handlers ────────────────────────────────────────────── */
  const openAdd  = ()    => { setEditing(null); setShowForm(true); };
  const openEdit = proj  => { setEditing(proj); setShowForm(true); };
  const closeForm= ()    => setShowForm(false);

  const handleDelete = async id => {
    const proj = projects.find(p => p.id === id);
    if (!window.confirm(`Delete "${proj?.title}"?\n\nThis cannot be undone.`)) return;
    try {
      await db.deleteProject(id);
      window.dispatchEvent(new Event('datadlue_projects_updated'));
      toast.ok('🗑 Project deleted.');
      load();
    } catch (err) { toast.err('❌ ' + err.message); }
  };

  /* ── Loading state (auth still loading OR data not yet in) ── */
  if (loading || (user?.isAdmin && !analytics && !dataErr)) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:16,
        background:'var(--clr-bg,#0a0a0a)'
      }}>
        <div style={{width:48,height:48,border:'3px solid rgba(245,164,74,0.15)',
          borderTopColor:'#f5a44a',borderRadius:'50%',animation:'ap-spin 1s linear infinite'}} />
        <p style={{color:'#f5a44a', fontWeight:600}}>Loading Admin Core…</p>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────── */
  if (dataErr) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <p style={{color:'#ef4444',fontSize:'1.2rem'}}>⚠️ Failed to load data</p>
          <p style={{opacity:.6,marginBottom:16}}>{dataErr}</p>
          <button className="ap-btn ap-btn-primary" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  /* ── Do not render if not admin (prevent flash) ────────────── */
  if (!user?.isAdmin) return null;

  return (
    <>
      {/* ── Global CSS + animations ── */}
      <style>{`
        @keyframes ap-slide-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ap-spin      { to{transform:rotate(360deg)} }

        .ap-shell { display:flex; min-height:100vh; background:#0d0d0d; padding-top:72px; }

        /* Sidebar */
        .ap-sidebar {
          width:220px; flex-shrink:0; border-right:1px solid rgba(245,164,74,0.12);
          display:flex; flex-direction:column; padding:32px 0; position:sticky;
          top:72px; height:calc(100vh - 72px); background:#0d0d0d; z-index:10;
        }
        .ap-sidebar-brand {
          padding:0 24px 28px; border-bottom:1px solid rgba(245,164,74,0.1);
          margin-bottom:16px;
        }
        .ap-sidebar-brand h2 { font-size:1rem; color:#f5a44a; font-weight:700; margin:0; }
        .ap-sidebar-brand p  { font-size:0.7rem; color:#666; margin:4px 0 0; }
        .ap-sidebar-nav { display:flex; flex-direction:column; gap:4px; padding:0 12px; }
        .ap-nav-btn {
          display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:10px;
          border:none; cursor:pointer; font-size:0.88rem; font-weight:600;
          color:#999; background:transparent; transition:all 0.2s; text-align:left; width:100%;
        }
        .ap-nav-btn:hover { color:#f5a44a; background:rgba(245,164,74,0.08); }
        .ap-nav-btn.active { color:#1a0800; background:linear-gradient(135deg,#f5a44a,#e07b1a); }
        .ap-nav-icon { font-size:1.1rem; width:22px; text-align:center; }
        .ap-sidebar-footer {
          margin-top:auto; padding:20px 24px 0; border-top:1px solid rgba(245,164,74,0.1);
        }
        .ap-user-chip {
          font-size:0.72rem; color:#666; word-break:break-all;
          display:block; margin-bottom:8px;
        }

        /* Main content */
        .ap-main { flex:1; overflow:hidden; }
        .ap-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:24px 32px 20px; border-bottom:1px solid rgba(245,164,74,0.1);
          gap:16px; flex-wrap:wrap;
        }
        .ap-topbar-title { font-size:1.5rem; font-weight:800; color:#fff; margin:0; }
        .ap-topbar-sub   { font-size:0.82rem; color:#666; margin:4px 0 0; }
        .ap-tab-body { padding:28px 32px; animation:ap-slide-in 0.25s ease; }

        /* KPI grid */
        .ap-kpi-grid {
          display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:16px; margin-bottom:28px;
        }
        .ap-kpi-card {
          background:#141414; border:1px solid rgba(255,255,255,0.06); border-radius:14px;
          padding:20px; display:flex; align-items:center; gap:16px;
          transition:border-color 0.2s, transform 0.2s;
        }
        .ap-kpi-card:hover { transform:translateY(-2px); }
        .ap-kpi-icon  { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
        .ap-kpi-body  { display:flex; flex-direction:column; gap:2px; flex:1; }
        .ap-kpi-label { font-size:0.68rem; text-transform:uppercase; letter-spacing:.06em; color:#555; }
        .ap-kpi-value { font-size:1.4rem; font-weight:800; line-height:1.2; }
        .ap-kpi-sub   { font-size:0.72rem; color:#555; }
        .ap-kpi-trend { font-size:0.82rem; font-weight:700; flex-shrink:0; }

        /* Charts */
        .ap-charts-grid {
          display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr));
          gap:16px; margin-bottom:28px;
        }
        .ap-chart-card {
          background:#141414; border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:22px;
        }
        .ap-chart-title { font-size:0.8rem; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.05em; margin:0 0 18px; }
        .ap-bars { display:flex; flex-direction:column; gap:12px; }
        .ap-bar-row { display:flex; align-items:center; gap:12px; }
        .ap-bar-label { width:130px; font-size:0.78rem; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-shrink:0; }
        .ap-bar-track { flex:1; height:22px; background:rgba(255,255,255,0.03); border-radius:4px; overflow:hidden; }
        .ap-bar-fill  { height:100%; border-radius:4px; display:flex; align-items:center; padding-left:8px; transition:width 0.8s ease; min-width:24px; }
        .ap-bar-val   { font-size:0.68rem; font-weight:700; color:#1a0800; white-space:nowrap; }

        /* Section card */
        .ap-section-card { background:#141414; border:1px solid rgba(255,255,255,0.06); border-radius:14px; overflow:hidden; margin-bottom:24px; }
        .ap-no-pad {}
        .ap-section-header { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .ap-section-title { font-size:1rem; font-weight:700; color:#ddd; display:flex; align-items:center; gap:10px; }
        .ap-badge { background:rgba(245,164,74,0.15); color:#f5a44a; border-radius:20px; padding:2px 10px; font-size:0.72rem; font-weight:700; }

        /* Table */
        .ap-table-wrap { overflow-x:auto; }
        .ap-table { width:100%; border-collapse:collapse; }
        .ap-table th, .ap-table td { padding:13px 18px; text-align:left; font-size:0.86rem; border-bottom:1px solid rgba(255,255,255,0.04); }
        .ap-table th { font-size:0.68rem; text-transform:uppercase; letter-spacing:.05em; color:#555; background:#111; font-weight:700; position:sticky; top:0; }
        .ap-table-row-hover:hover { background:rgba(245,164,74,0.04); }
        .ap-proj-cell { display:flex; flex-direction:column; gap:3px; }
        .ap-clamp { max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ap-dim { color:#555; font-size:0.78rem; }
        .ap-code { font-family:monospace; font-size:0.78rem; color:#f5a44a; }
        .ap-empty-msg { text-align:center; color:#555; font-size:0.9rem; padding:32px; display:block; }

        /* Chips */
        .ap-tags { display:flex; gap:4px; flex-wrap:wrap; }
        .ap-chip { font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:20px; white-space:nowrap; }
        .ap-chip-dept  { background:rgba(168,85,247,0.15); color:#a855f7; }
        .ap-chip-level { background:rgba(56,189,248,0.15); color:#38bdf8; }
        .ap-chip-tech  { background:rgba(245,164,74,0.12); color:#f5a44a; }

        /* Row actions */
        .ap-row-actions { display:flex; gap:6px; }
        .ap-btn-sm { font-size:0.75rem; font-weight:700; padding:5px 10px; border-radius:6px; border:none; cursor:pointer; transition:all 0.2s; }
        .ap-btn-edit { background:rgba(245,164,74,0.1); color:#f5a44a; }
        .ap-btn-edit:hover { background:rgba(245,164,74,0.2); }
        .ap-btn-del  { background:rgba(239,68,68,0.1);  color:#ef4444; }
        .ap-btn-del:hover  { background:rgba(239,68,68,0.2); }

        /* Status */
        .ap-status { font-size:0.78rem; font-weight:700; }
        .ap-status-active { color:#22c55e; }
        .ap-status-reg    { color:#555; }

        /* Top bar (tab) */
        .ap-tab-topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .ap-search-wrap { display:flex; align-items:center; gap:8px; background:#141414; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0 14px; flex:1; min-width:220px; }
        .ap-search-icon { font-size:0.9rem; color:#555; }
        .ap-search { background:transparent; border:none; outline:none; color:#ddd; font-size:0.88rem; padding:11px 0; flex:1; }
        .ap-search-clear { background:transparent; border:none; color:#555; cursor:pointer; font-size:0.9rem; }

        /* Buttons */
        .ap-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 22px; border-radius:10px; font-weight:700; font-size:0.88rem; cursor:pointer; border:none; transition:all 0.2s; }
        .ap-btn-primary { background:linear-gradient(135deg,#f5a44a,#e07b1a); color:#1a0800; }
        .ap-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(245,164,74,0.35); }
        .ap-btn-ghost   { background:rgba(255,255,255,0.06); color:#aaa; }
        .ap-btn-ghost:hover { background:rgba(255,255,255,0.1); }
        .ap-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .ap-spin { width:14px; height:14px; border:2px solid rgba(26,8,0,0.3); border-top-color:#1a0800; border-radius:50%; animation:ap-spin 0.8s linear infinite; }
        .ap-icon-btn { background:rgba(255,255,255,0.06); border:none; color:#aaa; width:36px; height:36px; border-radius:8px; cursor:pointer; font-size:1rem; transition:all 0.2s; flex-shrink:0; }
        .ap-icon-btn:hover { background:rgba(255,255,255,0.12); color:#fff; }

        /* Modal */
        .ap-modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center; z-index:10000; padding:20px;
        }
        .ap-modal-box {
          background:#141414; border:1px solid rgba(245,164,74,0.2); border-radius:20px;
          width:100%; max-width:780px; max-height:90vh; overflow-y:auto;
          box-shadow:0 40px 80px rgba(0,0,0,0.8), 0 0 40px rgba(245,164,74,0.1);
          animation:ap-slide-in 0.3s ease;
        }
        .ap-modal-header {
          display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
          padding:28px 28px 0;
        }
        .ap-modal-title { font-size:1.4rem; font-weight:800; color:#fff; margin:0; }
        .ap-modal-sub   { font-size:0.82rem; color:#666; margin:6px 0 0; }

        /* Form */
        .ap-form { display:flex; flex-direction:column; gap:18px; padding:24px 28px 28px; }
        .ap-form-row { display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap; }
        .ap-form-group { display:flex; flex-direction:column; gap:6px; }
        .ap-form-grow { flex:1; min-width:160px; }
        .ap-form-wrap { flex-wrap:wrap; }
        .ap-label { font-size:0.68rem; text-transform:uppercase; letter-spacing:.05em; color:#666; font-weight:700; }
        .ap-input {
          background:#0d0d0d; border:1px solid rgba(255,255,255,0.08); border-radius:10px;
          color:#ddd; padding:10px 14px; font-size:0.9rem; outline:none; width:100%; box-sizing:border-box;
          transition:border-color 0.2s;
        }
        .ap-input:focus { border-color:#f5a44a; box-shadow:0 0 0 3px rgba(245,164,74,0.1); }
        .ap-textarea { resize:vertical; }
        .ap-select { appearance:none; cursor:pointer; }
        .ap-section-label { font-size:0.8rem; font-weight:700; color:#f5a44a; margin:0; }
        .ap-img-previews { display:flex; gap:8px; flex-wrap:wrap; }
        .ap-img-thumb { width:110px; height:72px; object-fit:cover; border-radius:8px; border:1px solid rgba(245,164,74,0.2); }
        .ap-form-actions { display:flex; gap:10px; justify-content:flex-end; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); }

        /* Responsive */
        @media(max-width:768px){
          .ap-sidebar{display:none}
          .ap-topbar{padding:16px 18px 14px}
          .ap-tab-body{padding:18px}
          .ap-kpi-grid{grid-template-columns:repeat(2,1fr)}
          .ap-charts-grid{grid-template-columns:1fr}
          .ap-bar-label{width:80px}
        }
        @media(max-width:480px){
          .ap-kpi-grid{grid-template-columns:1fr}
        }
      `}</style>

      <ToastLayer toasts={toast.toasts} />

      <div className="ap-shell">
        {/* ── Sidebar ────────────────────────────────────────── */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-brand">
            <h2>Datadlue Admin</h2>
            <p>Control Panel v2.0</p>
          </div>
          <nav className="ap-sidebar-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`ap-nav-btn${tab===t.id?' active':''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="ap-nav-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ap-sidebar-footer">
            <span className="ap-user-chip">Logged in as<br/><strong>{user.email}</strong></span>
            <button className="ap-btn ap-btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:'0.8rem'}}
              onClick={() => navigate('/')}>← Back to Site</button>
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────── */}
        <main className="ap-main">
          {/* Top bar */}
          <div className="ap-topbar">
            <div>
              <h1 className="ap-topbar-title">
                {TABS.find(t => t.id===tab)?.icon} {TABS.find(t => t.id===tab)?.label}
              </h1>
              <p className="ap-topbar-sub">
                {tab==='overview' && 'Performance snapshot — revenue, sales, and recent orders'}
                {tab==='projects' && `${projects.length} projects in marketplace · manage inventory`}
                {tab==='users'    && 'User accounts, purchase history, and spend analytics'}
              </p>
            </div>
            {/* Mobile tab switcher */}
            <div style={{display:'flex',gap:6}}>
              {TABS.map(t => (
                <button key={t.id} className={`ap-btn ${tab===t.id?'ap-btn-primary':'ap-btn-ghost'}`}
                  style={{padding:'8px 14px',fontSize:'0.8rem'}}
                  onClick={() => setTab(t.id)}>
                  {t.icon}
                </button>
              ))}
              <button className="ap-btn ap-btn-primary" onClick={openAdd} style={{marginLeft:8}}>
                + Add
              </button>
            </div>
          </div>

          {/* Tab content */}
          {tab === 'overview' && analytics && (
            <OverviewTab analytics={analytics} projects={projects} orders={orders} />
          )}
          {tab === 'projects' && (
            <ProjectsTab
              projects={projects}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          {tab === 'users' && (
            <UsersTab orders={orders} />
          )}
        </main>
      </div>

      {/* ── Project Form Modal ─────────────────────────────── */}
      {showForm && (
        <ProjectForm
          project={editing}
          onClose={closeForm}
          onDone={load}
          toast={toast}
        />
      )}
    </>
  );
}
