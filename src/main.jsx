import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

// NOTE: ClerkProvider is managed inside AuthProvider (ClerkMockAuth.jsx)
// which conditionally wraps with Clerk when VITE_CLERK_PUBLISHABLE_KEY is set.
// Do NOT add a second ClerkProvider here — it will break auth.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);