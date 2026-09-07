import React from "react";
import { ShieldCheck, Scale, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Shared layout wrapper for a clean reading experience
function LegalShell({ title, icon, lastUpdated, children }) {
  return (
    <section className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" className="back" style={{ display: 'inline-flex', marginBottom: '20px' }}>
        <ArrowLeft size={16} style={{ marginRight: '5px' }}/> Back to Home
      </Link>
      <div className="page-head" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '20px', marginBottom: '30px' }}>
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon} Legal & Safety
        </div>
        <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Last Updated: {lastUpdated}</p>
      </div>
      <div className="legal-content" style={{ lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </div>
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy" icon={<ShieldCheck size={18} />} lastUpdated="September 2026">
      <h3>1. Information We Collect</h3>
      <p>When you use Nagrik Nova, we collect information you provide directly, including your account details (name, email, role), civic report descriptions, photographic evidence, and precision spatial location data (GPS/AR coordinates) used to map civic issues.</p>
      
      <h3>2. How We Use Your Data</h3>
      <p>Your data is strictly used to facilitate civic intelligence. AI analysis (via Google Gemini) is performed on uploaded images solely to extract issue context. Location data is shared with verified NGOs, universities, and industry partners to coordinate infrastructure solutions.</p>
      
      <h3>3. Data Security</h3>
      <p>We implement industry-standard security measures to protect your personal information. Community reports are public by nature, but sensitive account settings and wallet balances (Nova Coins) are encrypted and secured.</p>
    </LegalShell>
  );
}

export function TermsOfService() {
  return (
    <LegalShell title="Terms of Service" icon={<Scale size={18} />} lastUpdated="September 2026">
      <h3>1. Acceptance of Terms</h3>
      <p>By registering an account on Nagrik Nova (whether as a Citizen, NGO, University, or Industry partner), you agree to abide by these Terms of Service. Nagrik Nova is a platform for civic reporting and collaboration, not an emergency response service.</p>
      
      <h3>2. User Responsibilities</h3>
      <p>You are responsible for the accuracy of the reports you submit. Deliberately falsifying locations, uploading misleading images, or abusing the Nova Coin rewards system will result in account suspension and revocation of pending orders.</p>
      
      <h3>3. Platform Rights</h3>
      <p>Nagrik Nova reserves the right to moderate, flag, or delete any civic report that violates our guidelines or does not align with the platform's mission to improve public infrastructure.</p>
    </LegalShell>
  );
}

export function CommunityGuidelines() {
  return (
    <LegalShell title="Community Guidelines" icon={<Users size={18} />} lastUpdated="September 2026">
      <h3>1. Be Constructive</h3>
      <p>Nagrik Nova exists to solve problems. Ensure your reports are clear, actionable, and focused on civic infrastructure (e.g., potholes, broken pipes, illegal dumping). Do not use the platform for personal grievances or political statements.</p>
      
      <h3>2. Respect Privacy</h3>
      <p>When capturing photos of civic issues using our Mobile AI Scanner, avoid including identifiable faces, license plates, or private property windows unless absolutely necessary to demonstrate the hazard.</p>
      
      <h3>3. Zero Tolerance for Abuse</h3>
      <p>We enforce a strict zero-tolerance policy against hate speech, harassment of municipal workers, or explicit imagery. Violations will result in an immediate and permanent ban from the network.</p>
    </LegalShell>
  );
}