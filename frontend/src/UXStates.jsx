import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ServerCrash, Home, ArrowLeft } from "lucide-react";
import { AlertTriangle, ServerCrash, Home, ArrowLeft, LogOut } from "lucide-react";

export function NotFound() {
  return (
    <section className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
        <AlertTriangle size={64} color="#10b981" />
      </div>
      <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 20px 0' }}>Lost in the network.</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '400px', marginBottom: '30px', lineHeight: '1.6' }}>
        We couldn't find the civic report or page you were looking for. It might have been resolved, deleted, or the link is broken.
      </p>
      <Link to="/" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <Home size={18} /> Return to Dashboard
      </Link>
    </section>
  );
}

export function ServerError() {
  return (
    <section className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
        <ServerCrash size={64} color="#ef4444" />
      </div>
      <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>500</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 20px 0' }}>Server Outage.</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '400px', marginBottom: '30px', lineHeight: '1.6' }}>
        Our civic intelligence backend is currently experiencing a hiccup. We are likely running maintenance or deploying an upgrade.
      </p>
      <button onClick={() => window.location.reload()} className="btn" style={{ background: '#ef4444', borderColor: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={18} /> Try Reloading
      </button>
    </section>
  );
}
export function SessionExpiredModal({ onLoginClick }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
      <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px', display: 'inline-block' }}>
          <LogOut size={48} color="#f59e0b" />
        </div>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Session Expired</h2>
        <p style={{ color: '#94a3b8', marginBottom: '30px', lineHeight: '1.5' }}>
          For your security, you have been automatically logged out due to inactivity. Please sign in again to continue shaping your community.
        </p>
        <button onClick={onLoginClick} className="btn full" style={{ display: 'flex', justifyContent: 'center' }}>
          Sign In Again
        </button>
      </div>
    </div>
  );
}