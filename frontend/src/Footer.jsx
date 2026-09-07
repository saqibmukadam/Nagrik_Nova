import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '40px 20px', marginTop: '50px', background: '#0f172a', color: '#94a3b8' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px' }}>
        
        <div style={{ maxWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 'bold', fontSize: '18px', marginBottom: '15px' }}>
            <Leaf color="#10b981" /> Nagrik Nova
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Civic intelligence made collective. Connect your local challenges with the people ready to solve them.</p>
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ color: '#fff' }}>Trust & Safety</strong>
            <Link to="/guidelines" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Community Guidelines</Link>
            <Link to="/privacy" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Terms of Service</Link>
          </div>
        </div>
        
      </div>
    </footer>
  );
}