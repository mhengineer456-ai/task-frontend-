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

export default function UserProfileModal({ userId, onClose }) {
  const { users, tasks, leaves, activeUser, updateUserProfile } = useTaskContext();
  const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'tasks' | 'leaves' | 'skills'
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const fileInputRef = useRef(null);

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
      setUploadSuccess('Profile photo updated!');
      setCustomPhotoUrl('');
      setIsSavingPhoto(false);
      setIsPhotoPickerOpen(false);
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
    { id: 'kra-def-1', title: 'Task Execution & Delivery', weight: 50, score: 95, status: 'On Track', description: 'Deliver assigned sprint deliverables on schedule.' },
    { id: 'kra-def-2', title: 'Quality Assurance & Code Review', weight: 50, score: 98, status: 'Exceeding', description: 'Maintain high accuracy and zero critical defects.' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid #bae6fd'
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

        {/* Header Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  border: '4px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#ffffff',
                  color: '#0284c7',
                  border: '2px solid #0284c7',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                }}
                title="Upload or change profile photo"
              >
                <Camera style={{ width: '16px', height: '16px' }} />
              </button>
            )}
          </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                  {user.name}
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#ffffff', color: '#0284c7', padding: '3px 10px', borderRadius: '99px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  {user.employeeId || 'EMP-1001'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', padding: '3px 10px', borderRadius: '99px' }}>
                  {user.role}
                </span>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Camera style={{ width: '12px', height: '12px' }} />
                    <span>Change Profile Photo</span>
                  </button>
                )}
              </div>

              <p style={{ fontSize: '0.875rem', color: '#e0f2fe', margin: '0 0 0.75rem 0', fontWeight: 600 }}>
                {user.department} • Reports to <span style={{ textDecoration: 'underline' }}>{user.managerName || 'Executive Board'}</span>
              </p>

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', color: '#bae6fd' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail style={{ width: '14px', height: '14px' }} />
                  {user.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar style={{ width: '14px', height: '14px' }} />
                  Joined {user.hireDate || '2023-01-15'}
                </span>
              </div>

              {uploadSuccess && (
                <div style={{ marginTop: '0.5rem', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                marginTop: '1.25rem',
                background: '#ffffff',
                color: '#0f172a',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.18)',
                border: '1px solid #bae6fd',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera style={{ width: '16px', height: '16px' }} />
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
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {uploadError}
                </div>
              )}

              {/* Upload from Computer Button */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSavingPhoto}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Upload style={{ width: '16px', height: '16px' }} />
                  <span>{isSavingPhoto ? 'Saving Photo...' : 'Upload Image from Computer'}</span>
                </button>
              </div>

              {/* Paste Image URL */}
              <form onSubmit={handleApplyCustomUrl} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <LinkIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#64748b' }} />
                  <input
                    type="url"
                    placeholder="Or paste image URL (e.g. https://...)"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '100%' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customPhotoUrl.trim() || isSavingPhoto}
                  className="btn btn-secondary"
                  style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Save URL
                </button>
              </form>

              {/* Presets List */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                  Or Choose from Curated Professional Avatars
                </span>
                <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '4px' }}>
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Avatar preset ${idx + 1}`}
                      onClick={() => handleApplyPreset(url)}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: user.avatar === url ? '3px solid #0284c7' : '2px solid #e2e8f0',
                        boxShadow: user.avatar === url ? '0 0 8px rgba(2, 132, 199, 0.4)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Click to apply this avatar"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick KPI Performance Summary Bar */}
        <div className="grid grid-cols-4 lg-grid-cols-2 sm-grid-cols-2" style={{ gap: '0.75rem', padding: '1rem 1.25rem', background: '#f0f7ff', borderBottom: '1px solid #bae6fd' }}>
          <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e0f2fe' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SLA Compliance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>{kpi.slaCompliance}%</div>
          </div>
          <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e0f2fe' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>On-Time Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{kpi.onTimeRate}%</div>
          </div>
          <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e0f2fe' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Avg Resolution</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>{kpi.avgResolutionHours} hrs</div>
          </div>
          <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #e0f2fe' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Performance Rating</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6' }}>{user.performanceReview?.rating || 4.8} ⭐</div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 2.5rem', background: '#ffffff' }}>
          <button
            onClick={() => setActiveTab('kpi')}
            style={{
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: activeTab === 'kpi' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'kpi' ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 style={{ width: '16px', height: '16px' }} />
            <span>KPI & KRA Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: activeTab === 'tasks' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'tasks' ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Briefcase style={{ width: '16px', height: '16px' }} />
            <span>Tasks & Workload ({activeTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            style={{
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: activeTab === 'leaves' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'leaves' ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px' }} />
            <span>Leave Balances & Status</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', flex: 1, background: '#ffffff' }}>
          {activeTab === 'kpi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                  Key Result Areas (KRAs) & Weighted Scores
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {kraList.map(kra => (
                    <div key={kra.id} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{kra.title}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>({kra.weight}% Weight)</span>
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '99px',
                          background: kra.status === 'Exceeding' ? '#dcfce7' : '#e0f2fe',
                          color: kra.status === 'Exceeding' ? '#166534' : '#0369a1'
                        }}>
                          {kra.status} • {kra.score}%
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78125rem', color: '#475569', margin: '0 0 0.75rem 0' }}>{kra.description}</p>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${kra.score}%`, height: '100%', background: kra.score >= 95 ? '#10b981' : '#0284c7', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Feedback */}
              {user.performanceReview?.managerFeedback && (
                <div style={{ background: '#f0f7ff', border: '1px solid #bae6fd', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0284c7', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles style={{ width: '16px', height: '16px' }} />
                    Supervisor Performance Evaluation ({user.performanceReview.evaluationPeriod || 'Q3 2026'})
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#0f172a', fontStyle: 'italic', margin: 0 }}>
                    "{user.performanceReview.managerFeedback}"
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Active Assigned Deliverables ({activeTasks.length})</h4>
              {activeTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No active pending tasks for this employee.</div>
              ) : (
                activeTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0284c7', marginRight: '0.5rem' }}>{t.id}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{t.title}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Due: {t.dueDate?.slice(0, 10)} • Priority: {t.priority}</div>
                    </div>
                    <span className="badge badge-brand">{t.status}</span>
                  </div>
                ))
              )}

              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '1rem', margin: 0 }}>Recently Completed ({completedTasks.length})</h4>
              {completedTasks.slice(0, 3).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#10b981', marginRight: '0.5rem' }}>{t.id}</span>
                    <span style={{ fontSize: '0.85rem', color: '#475569', textDecoration: 'line-through' }}>{t.title}</span>
                  </div>
                  <span className="badge badge-emerald">Approved</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaves' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ background: '#f0f7ff', border: '1px solid #bae6fd', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>Casual Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0c4a6e', margin: '0.25rem 0' }}>{12 - usedCasual} / 12</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Used: {usedCasual} days</div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534' }}>Medical / Sick Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14532d', margin: '0.25rem 0' }}>{10 - usedSick} / 10</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Used: {usedSick} days</div>
                </div>

                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7e22ce' }}>Earned / Paid Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#581c87', margin: '0.25rem 0' }}>{18 - usedEarned} / 18</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Used: {usedEarned} days</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Leave History & Applications</h4>
                {userLeaves.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: '#64748b', fontSize: '0.85rem' }}>No leave applications on file for this user.</div>
                ) : (
                  userLeaves.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{l.leaveType} ({l.totalDays} Days)</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.startDate} to {l.endDate} • Reason: "{l.reason}"</div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '4px 10px',
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
