// ============================================================
// DATADLUE LABS — USER DASHBOARD (UserDashboard.jsx)
// User workspace listing purchases, order info, and downloads
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../database/db';
import { useAuth } from './ClerkMockAuth';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadPurchases = async () => {
      if (user) {
        try {
          const data = await db.getUserPurchases(user.email);
          setPurchases(data);
        } catch (err) {
          console.error(err);
        } finally {
          setFetching(false);
        }
      }
    };
    loadPurchases();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="dashboard-loading-container">
        <span className="spinner-loader" />
        <p>Retrieving your cryptographic keys...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell container" data-reveal>
      {/* Dashboard Welcome Header */}
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">User Workspace</p>
          <h1>Welcome, {user?.fullName}</h1>
          <p className="welcome-subtext">Manage your purchases, downloads, and final year projects.</p>
        </div>
        <div className="profile-chip glass">
          <div className="profile-icon">👤</div>
          <div className="profile-info-text">
            <strong>{user?.email}</strong>
            <span>Verified Student Account</span>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="dashboard-layout">
        <section className="purchases-section">
          <h2>Your Purchased Projects</h2>

          {purchases.length === 0 ? (
            <div className="empty-dashboard-card glass">
              <span className="empty-icon">📁</span>
              <h3>No Projects Purchased Yet</h3>
              <p>Explore the project marketplace to purchase source code and full research PDFs.</p>
              <Link to="/marketplace" className="btn btn-primary">
                Browse Marketplace →
              </Link>
            </div>
          ) : (
            <div className="purchased-list">
              {purchases.map((purchase) => (
                <article key={purchase.orderId} className="purchase-card glass">
                  <div className="purchase-card-header">
                    <div>
                      <span className="order-id-tag">ORDER ID: {purchase.orderId}</span>
                      <h3 className="purchase-title">{purchase.projectDetails.title}</h3>
                    </div>
                    <div className="purchase-price">₦{purchase.projectPrice.toLocaleString()}</div>
                  </div>

                  <p className="purchase-desc">{purchase.projectDetails.description}</p>

                  <div className="purchase-tech-list">
                    {purchase.projectDetails.technologies &&
                      purchase.projectDetails.technologies.map((t) => (
                        <span key={t} className="tech-tag">
                          {t}
                        </span>
                      ))}
                  </div>

                  <div className="purchase-footer">
                    <span className="purchase-date-label">
                      Purchased on: {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </span>

                    <div className="download-actions">
                      <a
                        href={purchase.projectDetails.pdfUrl || '/app-release.apk'}
                        download={`${purchase.projectDetails.title.replace(/\s+/g, '_')}_Code.zip`}
                        className="btn btn-primary btn-sm"
                      >
                        📥 Source Code (.zip)
                      </a>
                      <a
                        href={purchase.projectDetails.pdfUrl || '/app-release.apk'}
                        download={`${purchase.projectDetails.title.replace(/\s+/g, '_')}_PDF.pdf`}
                        className="btn btn-secondary btn-sm"
                      >
                        📄 Project Report (PDF)
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
