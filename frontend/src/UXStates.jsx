import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ServerCrash, Home, ArrowLeft } from "lucide-react";

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