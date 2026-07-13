// ============================================================
// DATADLUE LABS — ADMIN CONTROL PANEL (AdminPanel.jsx)
// Full analytics metrics, project list CRUD table, and forms
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../database/db';
import { useAuth } from './ClerkMockAuth';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [level, setLevel] = useState('B.Sc');
  const [price, setPrice] = useState(30000);
  const [technologies, setTechnologies] = useState('');
  const [pdfUrl, setPdfUrl] = useState('/app-release.apk');
  const [imageUrl1, setImageUrl1] = useState('/screen1.png');
  const [imageUrl2, setImageUrl2] = useState('/screen2.png');
  const [imageUrl3, setImageUrl3] = useState('/screen3.png');

  const loadData = async () => {
    try {
      const projs = await db.getProjects();
      setProjects(projs);
      const stats = await db.getAnalytics();
      setAnalytics(stats);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin) {
      loadData();
    }
  }, [user]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setDepartment('Computer Science');
    setLevel('B.Sc');
    setPrice(30000);
    setTechnologies('React, Node.js');
    setPdfUrl('/app-release.apk');
    setImageUrl1('/screen1.png');
    setImageUrl2('/screen2.png');
    setImageUrl3('/screen3.png');
    setShowFormModal(true);
  };

  const handleOpenEdit = (proj) => {
    setEditingProject(proj);
    setTitle(proj.title);
    setDescription(proj.description);
    setDepartment(proj.department);
    setLevel(proj.level);
    setPrice(proj.price);
    setTechnologies(Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '');
    setPdfUrl(proj.pdfUrl || '/app-release.apk');
    setImageUrl1(proj.images?.[0] || '/screen1.png');
    setImageUrl2(proj.images?.[1] || '/screen2.png');
    setImageUrl3(proj.images?.[2] || '/screen3.png');
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this project? This action is irreversible.')) {
      try {
        await db.deleteProject(id);
        alert('Project deleted successfully.');
        loadData();
        // Dispatch custom update event to sync other views
        window.dispatchEvent(new Event('datadlue_projects_updated'));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const projData = {
      title,
      description,
      department,
      level,
      price: Number(price),
      technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
      pdfUrl,
      images: [imageUrl1, imageUrl2, imageUrl3].filter(Boolean)
    };

    if (editingProject) {
      projData.id = editingProject.id;
      projData.sales = editingProject.sales;
      projData.createdAt = editingProject.createdAt;
    }

    try {
      await db.saveProject(projData);
      alert(editingProject ? 'Project updated successfully.' : 'Project added successfully.');
      setShowFormModal(false);
      loadData();
      // Dispatch custom update event to sync other views
      window.dispatchEvent(new Event('datadlue_projects_updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="dashboard-loading-container">
        <span className="spinner-loader" />
        <p>Loading Admin Core Data...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell container" data-reveal>
      {/* Header */}
      <div className="admin-header-row">
        <div>
          <p className="eyebrow">Control Panel</p>
          <h1>Admin Command Dashboard</h1>
          <p className="welcome-subtext">Manage marketplace inventory, upload resources, and view financial stats.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          + Upload New Project
        </button>
      </div>

      {/* ── ANALYTICS ROW ────────────────────────────────────── */}
      <section className="analytics-section">
        <div className="analytics-grid">
          <div className="stat-card glass">
            <span className="stat-icon">💰</span>
            <div className="stat-text-wrap">
              <span>Total Revenue</span>
              <strong>₦{analytics.totalRevenue.toLocaleString()}</strong>
            </div>
          </div>
          <div className="stat-card glass">
            <span className="stat-icon">📈</span>
            <div className="stat-text-wrap">
              <span>Total Sales</span>
              <strong>{analytics.totalSales} Packages</strong>
            </div>
          </div>
          <div className="stat-card glass">
            <span className="stat-icon">👥</span>
            <div className="stat-text-wrap">
              <span>Active Buyers</span>
              <strong>{analytics.uniqueBuyers} Users</strong>
            </div>
          </div>
        </div>

        {/* CSS Chart: Popular Projects Visualizer */}
        <div className="chart-wrapper glass">
          <h3>Popular Project Performance (Sales Count)</h3>
          <div className="sales-bar-chart">
            {analytics.popularProjects.map((p) => {
              const maxSales = Math.max(...analytics.popularProjects.map((proj) => proj.sales), 1);
              const percentage = (p.sales / maxSales) * 100;
              return (
                <div key={p.id} className="chart-bar-row">
                  <span className="bar-label" title={p.title}>{p.title}</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${percentage}%` }}>
                      <span className="bar-count-label">{p.sales} sales</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CRUD TABLE ───────────────────────────────────────── */}
      <section className="admin-table-section glass">
        <div className="table-header-row">
          <h2>Marketplace Inventory ({projects.length})</h2>
        </div>
        
        <div className="table-responsive-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Project Details</th>
                <th>Dept / Level</th>
                <th>Price (₦)</th>
                <th>Sales</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id}>
                  <td>
                    <div className="table-project-cell">
                      <strong>{proj.title}</strong>
                      <div className="table-tech-tags">
                        {proj.technologies && proj.technologies.slice(0, 3).map((t) => (
                          <span key={t} className="tech-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="table-badge-cell">
                      <span className="dept-badge">{proj.department}</span>
                      <span className="level-badge">{proj.level}</span>
                    </div>
                  </td>
                  <td>
                    <strong>₦{proj.price.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className="table-sales-count">{proj.sales} sold</span>
                  </td>
                  <td>
                    <div className="table-action-btns">
                      <button
                        type="button"
                        className="table-btn-edit"
                        onClick={() => handleOpenEdit(proj)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-btn-delete"
                        onClick={() => handleDelete(proj.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── UPLOAD / EDIT FORM MODAL ─────────────────────────── */}
      {showFormModal && (
        <div className="detail-modal-overlay" role="dialog" aria-modal="true">
          <div className="form-modal-card glass">
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowFormModal(false)}
            >
              ✕
            </button>

            <h3>{editingProject ? 'Modify Research Project' : 'Upload Research Project'}</h3>
            <p className="form-sub-heading">Upload source code, documentation logs, and preview screens.</p>

            <form onSubmit={handleSubmit} className="admin-crud-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="form-title">Project Title</label>
                  <input
                    id="form-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Autonomous Drone Mapping System..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-price">Price (₦)</label>
                  <input
                    id="form-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min="5000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="form-desc">Detailed Description</label>
                <textarea
                  id="form-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline abstract, modules, hardware specifications..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="form-dept">Department</label>
                  <select id="form-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Networking">Networking</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="form-level">Academic Level</label>
                  <select id="form-level" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="ND">ND</option>
                    <option value="HND">HND</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="M.Sc">M.Sc</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="form-techs">Technologies (Comma-separated)</label>
                  <input
                    id="form-techs"
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="React, Node.js, Firebase"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="form-img1">GUI Screenshot 1 URL</label>
                  <input
                    id="form-img1"
                    type="text"
                    value={imageUrl1}
                    onChange={(e) => setImageUrl1(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-img2">GUI Screenshot 2 URL</label>
                  <input
                    id="form-img2"
                    type="text"
                    value={imageUrl2}
                    onChange={(e) => setImageUrl2(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-img3">GUI Screenshot 3 URL</label>
                  <input
                    id="form-img3"
                    type="text"
                    value={imageUrl3}
                    onChange={(e) => setImageUrl3(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="form-pdf">ZIP/PDF Download Link</label>
                <input
                  id="form-pdf"
                  type="text"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-submit-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Save Project Details' : 'Publish Project Packages'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
