import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Leaf size={18} />
          </span>
          <span>Nagrik <i>Nova</i></span>
        </Link>
        <p>A shared space for practical civic problem-solving.</p>
      </div>
      
      <div className="footer-links">
        <div>
          <small>Platform</small>
          <Link to="/issues">Explore issues</Link>
          <Link to="/register">Join the network</Link>
        </div>
        
        {/* Added the Trust & Safety section to expose the legal pages */}
        <div>
          <small>Trust & Safety</small>
          <Link to="/guidelines">Community Guidelines</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
      
      <div className="footer-note">
        © 2026 Nagrik Nova<br />Built for better local futures.
      </div>
    </footer>
  );
}