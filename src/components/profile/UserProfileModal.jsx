import React, { useState, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  X,
  Mail,
  Building2,
  UserCheck,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Calendar,
  Briefcase,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileText,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  Image as ImageIcon,
  ArrowLeft
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

export default function UserProfileModal({ userId, onClose }) {
  const { users, tasks, leaves, activeUser, updateUserProfile, isMobileView } = useTaskContext();
  const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'tasks' | 'leaves'
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const isMobile = isMobileView || (typeof window !== 'undefined' && window.innerWidth <= 768);

  const user = users.find(u => String(u.id) === String(userId) || (userId && u.name?.trim().toLowerCase() === String(userId).trim().toLowerCase())) || users.find(u => u.id === userId) || users[0];
  if (!user) return null;

  const isSelf = activeUser && String(activeUser.id) === String(user.id);
  const canEdit = isSelf || activeUser?.role === 'Admin' || activeUser?.role === 'Manager';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    setUploadError('');
    setIsSavingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
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

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          if (updateUserProfile) {
            await updateUserProfile(user.id, { avatar: compressedDataUrl });
          }

          setUploadSuccess('Profile photo updated successfully!');
          setIsSavingPhoto(false);
          setIsPhotoPickerOpen(false);
          setTimeout(() => setUploadSuccess(''), 3000);
        } catch (err) {
          console.error('Error compressing/saving image:', err);
          setUploadError('Failed to save image. Please try again.');
          setIsSavingPhoto(false);
        }
      };
      img.onerror = () => {
        setUploadError('Unable to read selected image.');
        setIsSavingPhoto(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = async (presetUrl) => {
    setIsSavingPhoto(true);
    setUploadError('');
    try {
      if (updateUserProfile) {
        await updateUserProfile(user.id, { avatar: presetUrl });
      }
      setUploadSuccess('Profile photo updated!');
      setIsSavingPhoto(false);
      setIsPhotoPickerOpen(false);
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err) {
      setUploadError('Failed to update avatar.');
      setIsSavingPhoto(false);
    }
  };

  const handleApplyCustomUrl = async (e) => {
    e.preventDefault();
    if (!customPhotoUrl.trim()) return;

    setIsSavingPhoto(true);
    setUploadError('');
    try {
      if (updateUserProfile) {
        await updateUserProfile(user.id, { avatar: customPhotoUrl.trim() });
      }
      setUploadSuccess('Photo updated from URL!');
      setIsSavingPhoto(false);
      setIsPhotoPickerOpen(false);
      setCustomPhotoUrl('');
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err) {
      setUploadError('Failed to save photo URL.');
      setIsSavingPhoto(false);
    }
  };

  const userTasks = tasks.filter(t => t.assigneeId === user.id);
  const activeTasks = userTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved');
  const completedTasks = userTasks.filter(t => t.status === 'Completed' || t.status === 'Approved');

  const userLeaves = (leaves || []).filter(l => l.userId === user.id);
  const approvedLeaves = userLeaves.filter(l => l.status === 'Approved');
  const pendingLeaves = userLeaves.filter(l => l.status === 'Pending');

  // Leave Balances calculation (Standard allowance: Casual 12, Sick 10, Earned 18)
  const usedCasual = approvedLeaves.filter(l => l.leaveType === 'Casual Leave').reduce((acc, l) => acc + (l.totalDays || 1), 0);
  const usedSick = approvedLeaves.filter(l => l.leaveType === 'Medical / Sick Leave').reduce((acc, l) => acc + (l.totalDays || 1), 0);
  const usedEarned = approvedLeaves.filter(l => l.leaveType === 'Earned / Paid Leave').reduce((acc, l) => acc + (l.totalDays || 1), 0);

  const kpi = user.kpi || { onTimeRate: 92, avgResolutionHours: 14, overdueRate: 2, qualityScore: 95, slaCompliance: 98 };
  const kraList = user.kraList || [
    { id: 'kra-def-1', title: 'Task Execution & Delivery', weight: 50, score: 95, status: 'On Track', description: 'Deliver assigned deliverables and tasks on schedule.' },
    { id: 'kra-def-2', title: 'Quality Assurance & Accuracy', weight: 50, score: 98, status: 'Exceeding', description: 'Maintain high standard of work with zero critical defects.' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          background: '#ffffff',
          borderRadius: isMobile ? '0' : '20px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '840px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100dvh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isMobile ? 'none' : '0 25px 60px rgba(0, 0, 0, 0.25)',
          border: isMobile ? 'none' : '1px solid #bae6fd',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Top Navigation Bar with Back & Close Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 12px',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Back to previous screen"
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>Back</span>
          </button>

          <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e0f2fe' }}>
            Employee Dossier
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close Profile"
          >
            <X style={{ width: '17px', height: '17px' }} />
          </button>
        </div>

        {/* Header Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #1e3a8a 100%)',
            color: '#ffffff',
            padding: isMobile ? '16px 16px 18px' : '20px 24px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start',
              textAlign: isMobile ? 'center' : 'left',
              gap: isMobile ? '12px' : '20px'
            }}
          >
            {/* Avatar with Camera badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff&size=150`;
                  }}
                  style={{
                    width: isMobile ? '76px' : '88px',
                    height: isMobile ? '76px' : '88px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3.5px solid rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: isMobile ? '76px' : '88px',
                    height: isMobile ? '76px' : '88px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: isMobile ? '1.8rem' : '2.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3.5px solid rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
                  }}
                >
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Online Dot */}
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2.5px solid #0284c7',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
                title="Online"
              />

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: '#ffffff',
                    color: '#0284c7',
                    border: '2px solid #0284c7',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.25)'
                  }}
                  title="Upload or change profile photo"
                >
                  <Camera style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '6px'
                }}
              >
                <h2
                  style={{
                    fontSize: isMobile ? '1.35rem' : '1.65rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    margin: 0
                  }}
                >
                  {user.name}
                </h2>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: '#ffffff',
                    color: '#0284c7',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {user.employeeId || 'EMP-1001'}
                </span>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: user.role === 'EA' ? '#fef3c7' : user.role === 'Manager' ? '#dcfce7' : 'rgba(255, 255, 255, 0.25)',
                    color: user.role === 'EA' ? '#b45309' : user.role === 'Manager' ? '#166534' : '#ffffff',
                    padding: '2px 9px',
                    borderRadius: '99px'
                  }}
                >
                  {user.role}
                </span>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Camera style={{ width: '11px', height: '11px' }} />
                    <span>Change Photo</span>
                  </button>
                )}
              </div>

              {/* Department & Reports To */}
              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#e0f2fe',
                  margin: '0 0 6px 0',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}
              >
                <span>{user.department || 'Operations'}</span>
                <span>•</span>
                <span>Reports to <strong style={{ color: '#ffffff' }}>{user.managerName || 'Executive Board'}</strong></span>
              </p>

              {/* Email & Joined Date */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '0.78rem',
                  color: '#bae6fd'
                }}
              >
                <a
                  href={`mailto:${user.email}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#bae6fd',
                    textDecoration: 'none'
                  }}
                >
                  <Mail style={{ width: '13px', height: '13px' }} />
                  <span>{user.email}</span>
                </a>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar style={{ width: '13px', height: '13px' }} />
                  <span>Joined {user.hireDate || 'Jan 2023'}</span>
                </span>
              </div>

              {uploadSuccess && (
                <div style={{ marginTop: '8px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check style={{ width: '14px', height: '14px' }} />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo Picker Drawer */}
          {isPhotoPickerOpen && (
            <div
              style={{
                marginTop: '1rem',
                background: '#ffffff',
                color: '#0f172a',
                padding: '1rem',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
                border: '1px solid #bae6fd',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, margin: 0, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera style={{ width: '15px', height: '15px' }} />
                  <span>Select or Upload Profile Photo</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsPhotoPickerOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              {uploadError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {uploadError}
                </div>
              )}

              {/* Upload from device button */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSavingPhoto}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Upload style={{ width: '14px', height: '14px' }} />
                  <span>{isSavingPhoto ? 'Saving...' : 'Upload Image from Device'}</span>
                </button>
              </div>

              {/* Preset Avatars */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Or Choose from Presets:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                  {PRESET_AVATARS.map((avatarUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(avatarUrl)}
                      style={{
                        padding: 0,
                        border: user.avatar === avatarUrl ? '2.5px solid #0284c7' : '1px solid #cbd5e1',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        aspectRatio: '1',
                        background: 'none'
                      }}
                    >
                      <img src={avatarUrl} alt="preset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL form */}
              <form onSubmit={handleApplyCustomUrl} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="url"
                  placeholder="Paste direct image URL (https://...)"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isSavingPhoto || !customPhotoUrl.trim()}
                  style={{
                    padding: '6px 12px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#0f172a'
                  }}
                >
                  Apply
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Quick KPI Performance Summary Bar (Crisp 2x2 on Mobile, 4x1 on Desktop) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '8px',
            padding: isMobile ? '10px 14px' : '14px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>SLA Compliance</span>
              <CheckCircle2 style={{ width: '13px', height: '13px', color: '#0284c7' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284c7', margin: '2px 0 0' }}>{kpi.slaCompliance}%</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>On-Time Rate</span>
              <TrendingUp style={{ width: '13px', height: '13px', color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981', margin: '2px 0 0' }}>{kpi.onTimeRate}%</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Avg Resolution</span>
              <Clock style={{ width: '13px', height: '13px', color: '#2563eb' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2563eb', margin: '2px 0 0' }}>{kpi.avgResolutionHours} hrs</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Rating</span>
              <Award style={{ width: '13px', height: '13px', color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b', margin: '2px 0 0' }}>{user.performanceReview?.rating || 4.8} ⭐</div>
          </div>
        </div>

        {/* Navigation Tabs Pill Bar (Horizontal Scrollable with zero clipping) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 14px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: activeTab === 'kpi' ? '1px solid #0284c7' : '1px solid #e2e8f0',
              background: activeTab === 'kpi' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
              color: activeTab === 'kpi' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: activeTab === 'kpi' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 style={{ width: '14px', height: '14px' }} />
            <span>KPI & KRA Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: activeTab === 'tasks' ? '1px solid #0284c7' : '1px solid #e2e8f0',
              background: activeTab === 'tasks' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
              color: activeTab === 'tasks' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: activeTab === 'tasks' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Briefcase style={{ width: '14px', height: '14px' }} />
            <span>Tasks & Workload ({activeTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: activeTab === 'leaves' ? '1px solid #0284c7' : '1px solid #e2e8f0',
              background: activeTab === 'leaves' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
              color: activeTab === 'leaves' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: activeTab === 'leaves' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar style={{ width: '14px', height: '14px' }} />
            <span>Leave Balances & Status</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div
          style={{
            padding: isMobile ? '14px' : '20px 24px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            background: '#ffffff',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: isMobile ? 'calc(36px + env(safe-area-inset-bottom, 20px))' : '24px'
          }}
        >
          {activeTab === 'kpi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award style={{ width: '17px', height: '17px', color: '#0284c7' }} />
                  <span>Key Result Areas (KRAs) & Weighted Scores</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {kraList.map(kra => (
                    <div key={kra.id} style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '4px' }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{kra.title}</span>
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>({kra.weight}% Weight)</span>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '99px',
                          background: kra.status === 'Exceeding' ? '#dcfce7' : '#e0f2fe',
                          color: kra.status === 'Exceeding' ? '#166534' : '#0369a1'
                        }}>
                          {kra.status} • {kra.score}%
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0 0 0.65rem 0', lineHeight: 1.4 }}>{kra.description}</p>
                      <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${kra.score}%`, height: '100%', background: kra.score >= 95 ? '#10b981' : '#0284c7', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Feedback */}
              {user.performanceReview?.managerFeedback && (
                <div style={{ background: '#f0f7ff', border: '1px solid #bae6fd', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles style={{ width: '15px', height: '15px' }} />
                    <span>Supervisor Performance Evaluation ({user.performanceReview.evaluationPeriod || 'Q3 2026'})</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#0f172a', fontStyle: 'italic', margin: 0, lineHeight: 1.45 }}>
                    "{user.performanceReview.managerFeedback}"
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Active Assigned Deliverables ({activeTasks.length})</h4>
              {activeTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.82rem', background: '#f8fafc', borderRadius: '12px' }}>
                  No active pending tasks for this employee.
                </div>
              ) : (
                activeTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', marginRight: '0.4rem' }}>{t.id}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{t.title}</span>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Due: {t.dueDate?.slice(0, 10)} • Priority: {t.priority}</div>
                    </div>
                    <span className="badge badge-brand" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{t.status}</span>
                  </div>
                ))
              )}

              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem', margin: 0 }}>Recently Completed ({completedTasks.length})</h4>
              {completedTasks.slice(0, 3).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', marginRight: '0.4rem' }}>{t.id}</span>
                    <span style={{ fontSize: '0.8rem', color: '#475569', textDecoration: 'line-through' }}>{t.title}</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>Approved</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaves' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ background: '#f0f7ff', border: '1px solid #bae6fd', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7' }}>Casual Leave</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0c4a6e', margin: '2px 0' }}>{12 - usedCasual} / 12</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Used: {usedCasual} days</div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>Medical / Sick Leave</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#14532d', margin: '2px 0' }}>{10 - usedSick} / 10</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Used: {usedSick} days</div>
                </div>

                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7e22ce' }}>Earned / Paid Leave</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#581c87', margin: '2px 0' }}>{18 - usedEarned} / 18</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Used: {usedEarned} days</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem' }}>Leave History & Applications</h4>
                {userLeaves.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '0.8rem' }}>No leave applications on file for this user.</div>
                ) : (
                  userLeaves.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{l.leaveType} ({l.totalDays} Days)</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{l.startDate} to {l.endDate} • Reason: "{l.reason}"</div>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '99px',
                        background: l.status === 'Approved' ? '#dcfce7' : l.status === 'Rejected' ? '#fee2e2' : '#e0f2fe',
                        color: l.status === 'Approved' ? '#166534' : l.status === 'Rejected' ? '#991b1b' : '#0369a1'
                      }}>
                        {l.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
