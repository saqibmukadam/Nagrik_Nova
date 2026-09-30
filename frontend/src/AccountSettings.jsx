import React, { useState } from "react";
import { User, Lock, Trash2, Save, ArrowLeft, ShieldAlert, Pencil, X, Globe, Sparkles, Shield, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { DarkModeToggle } from "./main"; // Assuming this is exported from main.jsx

const api = axios.create({ baseURL: 'https://nagrik-nova.onrender.com/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("nn-token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' }
];

export default function AccountSettings({ user, auth }) {
  const nav = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  
  const [editState, setEditState] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
  });
  
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Load saved language or default to English
  const [lang, setLang] = useState(localStorage.getItem('nn-language') || 'en');
  const [langMsg, setLangMsg] = useState('');

  const toggleEdit = (field) => {
    setEditState(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLanguageChange = (code) => {
    setLang(code);
    localStorage.setItem('nn-language', code);
    setLangMsg('Interface language updated! Changes will apply globally shortly.');
    setTimeout(() => setLangMsg(''), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    
    try {
      const userId = user.id || user._id;
      await api.put(`/users/${userId}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });

      auth.updateUser({
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });
      
      setMsg("Profile updated successfully in the database!");
      setEditState({ name: false, email: false, phone: false, address: false });
    } catch (error) {
      console.error("Save error:", error);
      setErr("Failed to save to database.");
      // Fallback for UI responsiveness
      auth.updateUser({
        ...user, name: formData.name, email: formData.email, phone: formData.phone, address: formData.address
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setSavingPass(true);
    setPassMsg("");
    setPassErr("");

    try {
      const userId = user.id || user._id;
      await api.put(`/users/${userId}/password`, { newPassword });
      setPassMsg("Password successfully and securely updated!");
      setNewPassword("");
    } catch (error) {
      setPassErr(error.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPass(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you absolutely sure? This will permanently delete your account and all reported civic issues. This action cannot be undone.");
    if (confirm) {
      try {
        const userId = user.id || user._id;
        await api.delete(`/users/${userId}`);
        alert("Account permanently deleted from the server.");
        auth.out();
        nav("/");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete account from server.");
      }
    }
  };

  const inputStyle = (isEditing) => ({
    opacity: isEditing ? 1 : 0.6,
    cursor: isEditing ? 'text' : 'not-allowed',
    background: isEditing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)'
  });

  return (
    <section className="page dashboard">
      <Link className="back" to="/dashboard" style={{ display: 'inline-flex', marginBottom: '20px' }}>
        <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Back to Dashboard
      </Link>
      
      <div className="page-head" style={{ marginBottom: '30px' }}>
        <div>
          <div className="eyebrow"><User size={15} /> Customer Lifecycle</div>
          <h1>Account <em>Settings</em></h1>
          <p>Manage your profile, security, and accessibility preferences.</p>
        </div>
      </div>

      <div className="dash-grid">
        
        {/* LEFT COLUMN: Settings Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
          
          {/* NEW: Display & Accessibility Settings */}
          <div className="issue" style={{ padding: '30px', minHeight: 'auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: '0 0 15px 0' }}>
              <Globe size={20} color="#10b981" /> Display & Language
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Interface Theme</strong>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Toggle between Light and Dark mode.</span>
              </div>
              <DarkModeToggle />
            </div>

            <p style={{ color: 'var(--muted)', marginBottom: '15px' }}>
              Select your preferred regional language for the Nagrik Nova interface.
            </p>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                gap: '12px'
            }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguageChange(l.code)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '10px',
                    border: lang === l.code ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: lang === l.code ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: lang === l.code ? '#10b981' : 'inherit',
                    cursor: 'pointer',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: lang === l.code ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{l.native}</span>
                  <span style={{ fontSize: '12px', opacity: 0.6 }}>{l.name}</span>
                </button>
              ))}
            </div>
            {langMsg && <div className="success" style={{ marginTop: '15px', margin: '15px 0 0 0' }}>{langMsg}</div>}
          </div>

          {/* Profile Settings */}
          <div className="issue" style={{ padding: '30px', minHeight: 'auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: '0 0 20px 0' }}>
              <User size={20} color="#3b82f6" /> Personal Information
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div className="two">
                <label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Full Name 
                    <button type="button" onClick={() => toggleEdit('name')} style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex' }} title={editState.name ? "Lock" : "Edit"}>
                      {editState.name ? <X size={14} color="#ef4444" /> : <Pencil size={14} color="#10b981" />}
                    </button>
                  </span>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={!editState.name} style={inputStyle(editState.name)} />
                </label>
                
                <label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Email Address 
                    <button type="button" onClick={() => toggleEdit('email')} style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex' }} title={editState.email ? "Lock" : "Edit"}>
                      {editState.email ? <X size={14} color="#ef4444" /> : <Pencil size={14} color="#10b981" />}
                    </button>
                  </span>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!editState.email} style={inputStyle(editState.email)} />
                </label>
              </div>

              <div className="two">
                <label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Phone Number 
                    <button type="button" onClick={() => toggleEdit('phone')} style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex' }} title={editState.phone ? "Lock" : "Edit"}>
                      {editState.phone ? <X size={14} color="#ef4444" /> : <Pencil size={14} color="#10b981" />}
                    </button>
                  </span>
                  <input type="text" placeholder="Add your phone number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={!editState.phone} style={inputStyle(editState.phone)} />
                </label>
                
                <label>
                  Role
                  <input type="text" value={user?.role} disabled style={inputStyle(false)} />
                </label>
              </div>

              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Address 
                  <button type="button" onClick={() => toggleEdit('address')} style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex' }} title={editState.address ? "Lock" : "Edit"}>
                    {editState.address ? <X size={14} color="#ef4444" /> : <Pencil size={14} color="#10b981" />}
                  </button>
                </span>
                <input type="text" placeholder="Add your residential address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} disabled={!editState.address} style={inputStyle(editState.address)} />
              </label>
              
              {msg && <div className="success" style={{ margin: 0 }}>{msg}</div>}
              {err && <div className="error" style={{ margin: 0 }}>{err}</div>}
              
              <button type="submit" className="btn" disabled={saving || !Object.values(editState).some(Boolean)} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
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
            
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
              <label style={{ position: 'relative' }}>
                New Password
                <input 
                  required 
                  type={showPass ? "text" : "password"} 
                  minLength="6"
                  placeholder="Enter at least 6 characters"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  {showPass ? <X size={18} /> : <EyeOff size={18} />} 
                </button>
              </label>
              
              {passMsg && <div className="success" style={{ margin: 0 }}>{passMsg}</div>}
              {passErr && <div className="error" style={{ margin: 0 }}>{passErr}</div>}
              
              <button type="submit" className="btn small" disabled={savingPass || !newPassword}>
                <Lock size={16} /> {savingPass ? "Encrypting..." : "Update Password"}
              </button>
            </form>
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

        {/* RIGHT COLUMN: Sidebar Info */}
        <aside className="my-issues">
          <h2>Account Status</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Shield size={20} color="#10b981" />
              <strong style={{ fontSize: '16px' }}>Network Member</strong>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Your account is active and in good standing. You are registered as: <strong>{user?.role?.toUpperCase() || 'CITIZEN'}</strong>.
            </p>
          </div>

          <h2>Your Nova Balance</h2>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '5px' }}>
              <Sparkles size={24} /> {user?.nova_coins || 0}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#d97706' }}>
              Submit accurate civic reports to earn more coins. Redeem them in the Rewards tab.
            </p>
          </div>
        </aside>

      </div>
    </section>
  );
}