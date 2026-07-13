// ============================================================
// DATADLUE LABS — AUTH SYSTEM WRAPPER (ClerkMockAuth.jsx)
// Support for Clerk React Provider with dynamic mock fallback
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

// Unified Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // Checks environment variables for Clerk
  const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('datadlue_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !email.includes('@')) {
          reject(new Error('Please enter a valid email address.'));
          return;
        }

        const ADMIN_EMAIL = 'auwalsalekazaure@gmail.com';
        const ADMIN_PASS  = 'FuckAdmin20';
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS;

        if (email.toLowerCase() === ADMIN_EMAIL && password !== ADMIN_PASS) {
          reject(new Error('Invalid credentials. Please try again.'));
          return;
        }

        const userData = {
          id: isAdmin ? 'usr-admin' : 'usr-' + Math.random().toString(36).substr(2, 9),
          email: email.toLowerCase(),
          fullName: isAdmin ? 'System Administrator' : email.split('@')[0],
          isAdmin,
          joinedAt: new Date().toISOString()
        };

        setUser(userData);
        localStorage.setItem('datadlue_user', JSON.stringify(userData));
        setShowLoginModal(false);
        resolve(userData);
      }, 800);
    });
  };

  const register = (email, fullName, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !email.includes('@')) {
          reject(new Error('Please enter a valid email address.'));
          return;
        }
        if (!fullName || fullName.length < 3) {
          reject(new Error('Please enter your full name.'));
          return;
        }

        // Admin account cannot be self-registered
        const isAdmin = false;
        const userData = {
          id: isAdmin ? 'usr-admin' : 'usr-' + Math.random().toString(36).substr(2, 9),
          email: email.toLowerCase(),
          fullName: fullName,
          isAdmin,
          joinedAt: new Date().toISOString()
        };

        setUser(userData);
        localStorage.setItem('datadlue_user', JSON.stringify(userData));
        setShowRegisterModal(false);
        resolve(userData);
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('datadlue_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    showLoginModal,
    setShowLoginModal,
    showRegisterModal,
    setShowRegisterModal,
    isMockAuth: !hasClerkKey
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLoginModal && <LoginModal />}
      {showRegisterModal && <RegisterModal />}
    </AuthContext.Provider>
  );
}

// ── LOGIN MODAL OVERLAY ──────────────────────────────────────
function LoginModal() {
  const { login, setShowLoginModal, setShowRegisterModal } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay-shell" role="dialog" aria-modal="true">
      <div className="auth-modal-card glass">
        <button
          className="auth-close-btn"
          type="button"
          onClick={() => setShowLoginModal(false)}
        >
          ✕
        </button>
        <div className="auth-header">
          <h3>Welcome Back</h3>
          <p>Login to your Datadlue account</p>
        </div>

        {error && <div className="auth-error-chip">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="auth-pass">Password</label>
            <input
              id="auth-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>


          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Verifying Neural Match...' : 'Log In →'}
          </button>
        </form>

        <div className="auth-footer-link">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
}

// ── REGISTER MODAL OVERLAY ───────────────────────────────────
function RegisterModal() {
  const { register, setShowRegisterModal, setShowLoginModal } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, fullName, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay-shell" role="dialog" aria-modal="true">
      <div className="auth-modal-card glass">
        <button
          className="auth-close-btn"
          type="button"
          onClick={() => setShowRegisterModal(false)}
        >
          ✕
        </button>
        <div className="auth-header">
          <h3>Create Account</h3>
          <p>Register to view and purchase projects</p>
        </div>

        {error && <div className="auth-error-chip">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-pass">Password</label>
            <input
              id="reg-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Initializing Profile...' : 'Sign Up →'}
          </button>
        </form>

        <div className="auth-footer-link">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
