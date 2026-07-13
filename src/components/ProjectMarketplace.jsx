// ============================================================
// DATADLUE LABS — PROJECT MARKETPLACE (ProjectMarketplace.jsx)
// Full-featured search, filter sidebar, grids, and detail slides
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../database/db';
import { useAuth } from './ClerkMockAuth';

export default function ProjectMarketplace() {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [priceRange, setPriceRange] = useState(70000); // Max cap
  const [selectedTechs, setSelectedTechs] = useState([]);

  // Detail Modal state
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [buying, setBuying] = useState(false);

  // Load projects from database helper
  const loadProjects = async () => {
    try {
      const data = await db.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // Listen for custom project update events to reload data
    const handler = () => loadProjects();
    window.addEventListener('datadlue_projects_updated', handler);
    return () => window.removeEventListener('datadlue_projects_updated', handler);
  }, []);

  // Extract unique tech tags from all projects
  const allTechs = useMemo(() => {
    const techs = new Set();
    projects.forEach((p) => {
      if (Array.isArray(p.technologies)) {
        p.technologies.forEach((t) => techs.add(t));
      }
    });
    return Array.from(techs);
  }, [projects]);

  // Handle tech stack filter toggle
  const handleTechToggle = (tech) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  // Filter projects dynamically
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      // 1. Search Query Match
      const matchesSearch =
        searchQuery === '' ||
        proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(proj.technologies) &&
          proj.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      // 2. Department Match
      const matchesDept = selectedDept === 'All' || proj.department === selectedDept;

      // 3. Level Match
      const matchesLevel = selectedLevel === 'All' || proj.level === selectedLevel;

      // 4. Price Match
      const matchesPrice = proj.price <= priceRange;

      // 5. Tech Stack Match
      const matchesTech =
        selectedTechs.length === 0 ||
        (Array.isArray(proj.technologies) &&
          selectedTechs.every((t) => proj.technologies.includes(t)));

      return matchesSearch && matchesDept && matchesLevel && matchesPrice && matchesTech;
    });
  }, [projects, searchQuery, selectedDept, selectedLevel, priceRange, selectedTechs]);

  // Handle mock buy flow
  const handleBuy = async (proj) => {
    if (!user) {
      setSelectedProject(null);
      setShowLoginModal(true);
      return;
    }

    setBuying(true);
    try {
      await db.purchaseProject(proj.id, user.email);
      alert(`🎉 Purchase Successful! "${proj.title}" has been added to your dashboard.`);
      setSelectedProject(null);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="marketplace-container" data-reveal>
      <div className="marketplace-hero">
        <p className="eyebrow">Academic Research Hub</p>
        <h1>Final Year Project Marketplace</h1>
        <p className="marketplace-subtitle">
          Accelerate your research with premium, tested, and pre-packaged final year projects across key IT sectors in Nigeria.
        </p>
      </div>

      <div className="marketplace-layout">
        {/* ── FILTER PANEL (LEFT) ────────────────────────────── */}
        <aside className="filter-sidebar glass">
          <div className="filter-group">
            <h3>Search Marketplace</h3>
            <input
              type="text"
              placeholder="Search title, keywords, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <h3>Department</h3>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Networking">Networking</option>
              <option value="IT">Information Technology</option>
            </select>
          </div>

          <div className="filter-group">
            <h3>Academic Level</h3>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="All">All Levels</option>
              <option value="ND">ND (National Diploma)</option>
              <option value="HND">HND (Higher National Diploma)</option>
              <option value="B.Sc">B.Sc (Bachelor of Science)</option>
              <option value="M.Sc">M.Sc (Master of Science)</option>
            </select>
          </div>

          <div className="filter-group">
            <div className="price-label-row">
              <h3>Max Price</h3>
              <strong>₦{priceRange.toLocaleString()}</strong>
            </div>
            <input
              type="range"
              min="15000"
              max="100000"
              step="5000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="price-slider"
            />
          </div>

          <div className="filter-group">
            <h3>Technology Stack</h3>
            <div className="tech-checkbox-grid">
              {allTechs.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleTechToggle(tech)}
                  className={`tech-checkbox-btn ${selectedTechs.includes(tech) ? 'active' : ''}`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedDept('All');
              setSelectedLevel('All');
              setPriceRange(70000);
              setSelectedTechs([]);
            }}
          >
            Clear Filters
          </button>
        </aside>

        {/* ── PROJECTS GRID (RIGHT) ─────────────────────────── */}
        <main className="projects-feed">
          <div className="feed-header">
            <span>Showing {filteredProjects.length} Projects</span>
          </div>

          {loading ? (
            <div className="feed-placeholder">
              <span className="spinner-loader" />
              <p>Scanning database index...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="feed-placeholder">
              <span>🔍</span>
              <h3>No Projects Found</h3>
              <p>Try widening your search queries or clearing active filter matrices.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {filteredProjects.map((proj) => (
                <article key={proj.id} className="project-card glass">
                  <div className="card-badge-row">
                    <span className="level-badge">{proj.level}</span>
                    <span className="dept-badge">{proj.department}</span>
                  </div>
                  
                  <h3 className="project-title-heading">{proj.title}</h3>
                  <p className="project-desc-short">{proj.description}</p>

                  <div className="project-tech-row">
                    {proj.technologies && proj.technologies.slice(0, 4).map((tech) => (
                      <span key={tech} className="tech-tag">{tech}</span>
                    ))}
                  </div>

                  <div className="card-footer-row">
                    <div className="project-price-wrap">
                      <small>Source Code + PDF</small>
                      <strong>₦{proj.price.toLocaleString()}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-card-action"
                      onClick={() => {
                        setCurrentImageIndex(0);
                        setSelectedProject(proj);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── DETAIL & SCREENSHOT GALLERY LIGHTBOX MODAL ────────────────── */}
      {selectedProject && (
        <div className="detail-modal-overlay" role="dialog" aria-modal="true">
          <div className="detail-modal-card glass">
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedProject(null)}
            >
              ✕
            </button>

            <div className="modal-layout-grid">
              {/* Left Column: Output Images Carousel */}
              <div className="modal-visual-column">
                <div className="screenshot-gallery-box">
                  {selectedProject.images && selectedProject.images.length > 0 ? (
                    <img
                      src={selectedProject.images[currentImageIndex]}
                      alt={`${selectedProject.title} Screenshot ${currentImageIndex + 1}`}
                      className="modal-gallery-img"
                    />
                  ) : (
                    <div className="no-images-box">No GUI Screenshots Uploaded</div>
                  )}

                  {selectedProject.images && selectedProject.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="gallery-nav-btn nav-left"
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) =>
                              (prev - 1 + selectedProject.images.length) %
                              selectedProject.images.length
                          )
                        }
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        className="gallery-nav-btn nav-right"
                        onClick={() =>
                          setCurrentImageIndex(
                            (prev) => (prev + 1) % selectedProject.images.length
                          )
                        }
                      >
                        ▶
                      </button>
                    </>
                  )}
                </div>

                <div className="gallery-thumbs-row">
                  {selectedProject.images &&
                    selectedProject.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`thumb-btn ${idx === currentImageIndex ? 'active' : ''}`}
                      >
                        <img src={img} alt="Thumbnail" />
                      </button>
                    ))}
                </div>
              </div>

              {/* Right Column: Project Info */}
              <div className="modal-info-column">
                <div className="modal-tags">
                  <span className="level-badge">{selectedProject.level}</span>
                  <span className="dept-badge">{selectedProject.department}</span>
                </div>
                <h2>{selectedProject.title}</h2>
                <p className="modal-full-desc">{selectedProject.description}</p>

                <div className="info-block">
                  <h4>Core Technologies</h4>
                  <div className="modal-tech-list">
                    {selectedProject.technologies &&
                      selectedProject.technologies.map((tech) => (
                        <span key={tech} className="tech-tag">
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="info-block">
                  <h4>What is included</h4>
                  <ul className="included-checklist">
                    <li>✓ Complete System Source Code (.zip)</li>
                    <li>✓ Final Project Documentation Report (.pdf)</li>
                    <li>✓ Setup & Deployment Guidelines (.txt)</li>
                    <li>✓ 100% Verified Bug-Free execution</li>
                  </ul>
                </div>

                <div className="modal-footer-action">
                  <div className="modal-price-wrap">
                    <span>Package Price</span>
                    <strong>₦{selectedProject.price.toLocaleString()}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary buy-submit-btn"
                    onClick={() => handleBuy(selectedProject)}
                    disabled={buying}
                  >
                    {buying ? 'Securing Package...' : 'Buy Now →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
