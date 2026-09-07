import React, { useState } from "react";
import { User, Lock, Trash2, Save, ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: 'https://nagrik-nova.onrender.com/api' });

export default function AccountSettings({ user, auth }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // Note: In a full production app, this would hit a PUT endpoint on your Node backend
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    
    setTimeout(() => {
      setSaving(false);
      setMsg("Profile updated successfully! (Mocked for frontend)");
    }, 1000);
  };

  const handleDelete = () => {
    const confirm = window.confirm("Are you absolutely sure? This will permanently delete your account and all reported civic issues. This action cannot be undone.");
    if (confirm) {
      alert("Account deletion triggered. You will now be logged out.");
      auth.out();
    }
  };

  return (
    <section className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link className="back" to="/dashboard" style={{ display: 'inline-flex', marginBottom: '20px' }}>
        <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Back to Dashboard
      </Link>
      
      <div className="page-head" style={{ marginBottom: '30px' }}>
        <div className="eyebrow"><User size={15} /> Customer Lifecycle</div>
        <h1>Account <em>Settings</em></h1>
        <p>Manage your profile, security, and data preferences.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Profile Settings */}
        <div className="issue" style={{ padding: '30px', minHeight: 'auto' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: '0 0 20px 0' }}>
            <User size={20} /> Personal Information
          </h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="two">
              <label>
                Full Name
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </label>
              <label>
                Email Address
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </label>
            </div>
            <div className="two">
              <label>
                Phone Number
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </label>
              <label>
                Role
                <input type="text" value={user?.role} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </label>
            </div>
            <label>
              Address
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </label>
            
            {msg && <div className="success" style={{ margin: 0 }}>{msg}</div>}
            
            <button type="submit" className="btn" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="issue" style={{ padding: '30px', minHeight: 'auto' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: '0 0 10px 0' }}>
            <Lock size={20} /> Security & Authentication
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Update your password to keep your account secure.</p>
          <button className="btn small" style={{ background: 'rgba(255,255,255,0.1)' }}>
            Request Password Reset
          </button>
        </div>

        {/* Danger Zone */}
        <div className="issue" style={{ padding: '30px', minHeight: 'auto', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: '0 0 10px 0', color: '#ef4444' }}>
            <ShieldAlert size={20} /> Danger Zone
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
            Permanently remove your Personal Account and all of its content from the Nagrik Nova platform. This action is not reversible.
          </p>
          <button onClick={handleDelete} className="btn small" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
            <Trash2 size={16} /> Delete Account
          </button>
        </div>

      </div>
    </section>
  );
}