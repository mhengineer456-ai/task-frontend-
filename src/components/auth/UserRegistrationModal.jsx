import React, { useState, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  UserPlus,
  Mail,
  User,
  Building2,
  CheckCircle2,
  X,
  AlertCircle,
  Lock,
  Briefcase,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80'
];

export default function UserRegistrationModal({ isOpen, onClose }) {
  const {
    users = [],
    departments = [],
    registerUser,
    isRegisterModalOpen,
    setIsRegisterModalOpen
  } = useTaskContext();

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering & DevOps',
    role: 'Employee',
    managerId: '',
    managerName: '',
    avatar: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successUser, setSuccessUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen && !isRegisterModalOpen) return null;

  const handleClose = () => {
    setIsRegisterModalOpen(false);
    if (onClose) onClose();
    setFormData({
      name: '',
      email: '',
      password: '',
      department: 'Engineering & DevOps',
      role: 'Employee',
      managerId: '',
      managerName: '',
      avatar: ''
    });
    setErrorMessage('');
    setSuccessUser(null);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, avatar: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Please fill in all required fields (Name and Work Email).');
      return;
    }

    setIsSubmitting(true);
    const isManagerOrAdmin = formData.role === 'Manager' || formData.role === 'Admin';
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password ? formData.password.trim() : 'Welcome@123',
      department: formData.department,
      role: formData.role,
      managerId: isManagerOrAdmin ? null : (formData.managerId || null),
      managerName: isManagerOrAdmin ? 'Executive Board' : (formData.managerName || null),
      avatar: formData.avatar ? formData.avatar.trim() : undefined
    };

    const res = await registerUser(payload);
    setIsSubmitting(false);

    if (res && res.success && res.user) {
      setSuccessUser(res.user);
      setTimeout(() => {
        handleClose();
      }, 1600);
    } else {
      setErrorMessage(res?.error || 'Registration failed. Please try again.');
    }
  };

  const existingManagers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
          border: '1px solid #bae6fd',
          overflow: 'hidden',
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Add Team Member / Manager</h3>
              <p style={{ fontSize: '0.72rem', color: '#e0f2fe' }}>Direct activation into local MySQL database</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Body Form */}
        <div style={{ padding: '1.5rem' }}>
          {successUser ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 style={{ width: '32px', height: '32px', color: '#16a34a' }} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Account Created Successfully!</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <strong>{successUser.name}</strong> was registered as <strong>{successUser.role}</strong> in <strong>{successUser.department}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {errorMessage && (
                <div style={{ padding: '0.65rem 0.85rem', background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Profile Photo Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f0f9ff', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFile}
                />
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar Preview"
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', border: '2px dashed #0284c7' }}>
                      <Camera style={{ width: '22px', height: '22px' }} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', margin: 0 }}>
                      Profile Photo (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffffff', color: '#0284c7' }}
                    >
                      <Upload style={{ width: '12px', height: '12px' }} /> Upload Photo
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {PRESET_AVATARS.slice(0, 5).map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt="preset"
                        onClick={() => setFormData({ ...formData, avatar: preset })}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: formData.avatar === preset ? '2px solid #0284c7' : '1px solid #cbd5e1'
                        }}
                        title="Pick preset avatar"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '10px', top: '11px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-text"
                    style={{ paddingLeft: '2.2rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '10px', top: '11px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah.connor@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-text"
                    style={{ paddingLeft: '2.2rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '10px', top: '11px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="password"
                    placeholder="Leave blank for default (Welcome@123)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-text"
                    style={{ paddingLeft: '2.2rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="select-dropdown"
                    style={{ fontWeight: 800 }}
                  >
                    <option value="Manager">👔 Manager</option>
                    <option value="Admin">👑 Admin / MD</option>
                    <option value="Employee">👤 Employee</option>
                    <option value="Supervisor">🛡️ Supervisor</option>
                    <option value="EA">📋 EA Unit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="select-dropdown"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assigning Manager</label>
                {formData.role === 'Manager' || formData.role === 'Admin' ? (
                  <div style={{ padding: '0.65rem 0.85rem', background: '#e0f2fe', borderRadius: 'var(--radius-sm)', border: '1px solid #bae6fd', fontSize: '0.78125rem', color: '#0369a1', fontWeight: 700 }}>
                    👑 Executive / Department Manager (Self-Managed • Reports to Board)
                  </div>
                ) : (
                  <div>
                    {existingManagers.length > 0 ? (
                      <select
                        value={formData.managerId}
                        onChange={(e) => {
                          const m = existingManagers.find(mgr => mgr.id === e.target.value);
                          setFormData({
                            ...formData,
                            managerId: e.target.value,
                            managerName: m ? m.name : ''
                          });
                        }}
                        className="select-dropdown"
                      >
                        <option value="">Select Assigning Manager (Optional)...</option>
                        {existingManagers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role} • {m.department})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Reporting Manager Name (Optional)"
                        value={formData.managerName}
                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        className="input-text"
                      />
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={handleClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  <UserPlus style={{ width: '16px', height: '16px' }} />
                  <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
