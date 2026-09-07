import React, { useState } from "react";
import { User, Lock, Trash2, Save, ArrowLeft, ShieldAlert, Pencil, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// THE FIX: Added the auth token interceptor so the backend knows who is making the request
const api = axios.create({ baseURL: 'https://nagrik-nova.onrender.com/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("nn-token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

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

  const toggleEdit = (field) => {
    setEditState(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    
    try {
      const userId = user.id || user._id;
      // THE FIX: Actually send the updated data to your Node.js backend
      await api.put(`/users/${userId}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });

      // Update the local state so the UI feels instant
      auth.updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });
      
      setMsg("Profile updated successfully in the database!");
      setEditState({ name: false, email: false, phone: false, address: false });
    } catch (error) {
      console.error("Save error:", error);
      setErr("Failed to save to database. Make sure your backend has a PUT /api/users/:id route!");
      
      // Fallback: still save locally even if backend fails so UX doesn't break
      auth.updateUser({
        name: formData.name, email: formData.email, phone: formData.phone, address: formData.address
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = () => {
    alert(`A password reset link has been sent to ${formData.email}. (Note: Backend email server integration required for live delivery!)`);
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you absolutely sure? This will permanently delete your account and all reported civic issues. This action cannot be undone.");
    if (confirm) {
      try {
        const userId = user.id || user._id;
        // THE FIX: Tell the backend to actually wipe the database record
        await api.delete(`/users/${userId}`);
        
        alert("Account permanently deleted from the server.");
        auth.out();
        nav("/");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete account from server. Ensure your backend has a DELETE /api/users/:id route.");
      }
    }
  };

  const inputStyle = (isEditing) => ({
    opacity: isEditing ? 1 : 0.6,
    cursor: isEditing ? 'text' : 'not-allowed',
    background: isEditing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)'
  });

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
          <button onClick={handlePasswordReset} className="btn small" style={{ background: 'rgba(255,255,255,0.1)' }}>
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