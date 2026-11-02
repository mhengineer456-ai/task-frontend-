import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  AlertCircle,
  Activity,
  Layers,
  Briefcase
} from 'lucide-react';

export default function AuthPage() {
  const {
    users = [],
    departments = [],
    login,
    registerUser,
    setPanelMode,
    setActiveView
  } = useTaskContext();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign Up State (Direct registration - No OTP)
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering & DevOps',
    role: 'Manager', // default to Manager so user can easily create their manager first!
    managerId: '',
    managerName: ''
  });

  // Submit Login Form
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    setIsLoading(true);
    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);

    if (result.success && result.user) {
      const role = result.user.role;
      if (role === 'Admin' || role === 'MD') {
        setPanelMode('admin');
        setActiveView('dashboard');
      } else if (role === 'EA') {
        setPanelMode('ea');
        setActiveView('eaPanel');
      } else if (role === 'Manager') {
        setPanelMode('manager');
        setActiveView('managerPanel');
      } else {
        setPanelMode('employee');
        setActiveView('employeePanel');
      }
    } else {
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  // Submit Sign Up Form (Direct Account Creation)
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signUpData.name.trim() || !signUpData.email.trim()) {
      setErrorMessage('Please provide your full name and work email.');
      return;
    }

    if (!signUpData.password || signUpData.password.length < 4) {
      setErrorMessage('Please enter a password with at least 4 characters.');
      return;
    }

    setIsLoading(true);

    const isManagerOrAdmin = signUpData.role === 'Manager' || signUpData.role === 'Admin';
    const payload = {
      name: signUpData.name.trim(),
      email: signUpData.email.trim(),
      password: signUpData.password.trim(),
      department: signUpData.department,
      role: signUpData.role,
      managerId: isManagerOrAdmin ? null : (signUpData.managerId || null),
      managerName: isManagerOrAdmin ? 'Executive Board' : (signUpData.managerName || null)
    };

    const result = await registerUser(payload);
    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessMessage('Account created successfully! Redirecting to your workspace...');
      setTimeout(() => {
        const role = result.user.role;
        if (role === 'Admin' || role === 'MD') {
          setPanelMode('admin');
          setActiveView('dashboard');
        } else if (role === 'EA') {
          setPanelMode('ea');
          setActiveView('eaPanel');
        } else if (role === 'Manager') {
          setPanelMode('manager');
          setActiveView('managerPanel');
        } else {
          setPanelMode('employee');
          setActiveView('employeePanel');
        }
      }, 700);
    } else {
      setErrorMessage(result.error || 'Account registration failed. Please try again.');
    }
  };

  const existingManagers = users.filter(u => u.role === 'Manager' || u.role === 'Admin');

  return (
    <div className="app-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#f0f7ff' }}>
      {/* Left Branding Hero Column */}
      <div
        className="auth-hero-column"
        style={{
          flex: 1.1,
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '3rem 4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow Spheres */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', filter: 'blur(50px)' }}></div>

        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', zIndex: 10 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
            <Sparkles style={{ width: '24px', height: '24px', color: '#0284c7' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>TaskPulse Pro</h1>
            <p style={{ fontSize: '0.7rem', color: '#e0f2fe', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enterprise Workstation Suite</p>
          </div>
        </div>

        {/* Hero Central Content */}
        <div style={{ zIndex: 10, maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)', width: 'fit-content' }}>
            👑 Direct Role Onboarding • Clean Database • PulseBot AI
          </span>

          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: '1.25', letterSpacing: '-0.03em' }}>
            Empower Your Organization with Custom Workflows & Task Execution
          </h2>

          <p style={{ fontSize: '1rem', color: '#e0f2fe', lineHeight: '1.6' }}>
            Create your own managers, assign deliverables, and monitor live KPI performance metrics. All data is stored directly in your local MySQL enterprise database.
          </p>

          {/* Feature Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.25)', borderRadius: 'var(--radius-md)' }}>
              <ShieldCheck style={{ width: '22px', height: '22px', color: '#7dd3fc', marginBottom: '6px' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Direct Authentication</h4>
              <p style={{ fontSize: '0.75rem', color: '#e0f2fe' }}>Create your own managers and accounts with email & password.</p>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.25)', borderRadius: 'var(--radius-md)' }}>
              <Activity style={{ width: '22px', height: '22px', color: '#fde047', marginBottom: '6px' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>PulseBot Gemini AI</h4>
              <p style={{ fontSize: '0.75rem', color: '#e0f2fe' }}>Connects directly to your local n8n AI workflow in real time.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ zIndex: 10, fontSize: '0.78125rem', color: '#e0f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>© 2026 TaskPulse Enterprise Solutions.</span>
          <span style={{ fontWeight: 800 }}>Clean Enterprise Setup</span>
        </div>
      </div>

      {/* Right Login / Sign Up Form Column */}
      <div className="auth-form-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
        {/* Mobile Header Brand Header */}
        <div className="mobile-auth-brand" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
            <Sparkles style={{ width: '22px', height: '22px', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>TaskPulse Pro</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Enterprise Workstation Suite</p>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '2.25rem',
            background: '#ffffff',
            boxShadow: '0 20px 40px rgba(2, 132, 199, 0.12)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #bae6fd',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            animation: 'fadeInView 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {/* Mode Tabs (Sign In / Sign Up) */}
          <div style={{ display: 'flex', background: '#e0f2fe', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
            <button
              onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: authMode === 'login' ? '#0284c7' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : '#0369a1',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: authMode === 'signup' ? '#0284c7' : 'transparent',
                color: authMode === 'signup' ? '#ffffff' : '#0369a1',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account / Manager
            </button>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', color: '#065f46', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ==================== LOGIN FORM ==================== */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sign In</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>Access your personalized workstation and dashboard.</p>
              </div>

              {users.length === 0 && (
                <div style={{ padding: '0.85rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', fontSize: '0.78125rem', color: '#0369a1' }}>
                  👋 <strong>Fresh Setup Detected:</strong> No accounts exist yet. Click <strong>"Create Account / Manager"</strong> above to register your first Manager or Admin profile!
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Work Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. manager@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-text"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password *</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input-text"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="remember" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Keep me signed in on this workstation
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{ padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to TaskPulse Pro'}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </form>
          )}

          {/* ==================== SIGN UP FORM ==================== */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Your Account</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Register a Manager, Admin, or Team Member. Direct activation, no OTP required.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paras Goyal"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    className="input-text"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. paras.goyal@company.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    className="input-text"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="input-text"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    value={signUpData.role}
                    onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                    className="select-dropdown"
                    style={{ fontWeight: 800 }}
                  >
                    <option value="Manager">👔 Manager</option>
                    <option value="Admin">👑 Admin / MD</option>
                    <option value="Employee">👤 Employee</option>
                    <option value="Supervisor">🛡️ Supervisor</option>
                    <option value="EA">📋 Executive Assistant (EA)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    value={signUpData.department}
                    onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                    className="select-dropdown"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manager Selection / Self Managed Badge */}
              <div className="form-group">
                <label className="form-label">Reporting Hierarchy</label>
                {signUpData.role === 'Manager' || signUpData.role === 'Admin' ? (
                  <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: 'var(--radius-sm)', border: '1px solid #bae6fd', fontSize: '0.78125rem', color: '#0369a1', fontWeight: 700 }}>
                    👑 Executive / Department Manager (Self-Managed • Reports to Executive Board)
                  </div>
                ) : (
                  <div>
                    {existingManagers.length > 0 ? (
                      <select
                        value={signUpData.managerId}
                        onChange={(e) => {
                          const m = existingManagers.find(mgr => mgr.id === e.target.value);
                          setSignUpData({
                            ...signUpData,
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
                        value={signUpData.managerName}
                        onChange={(e) => setSignUpData({ ...signUpData, managerName: e.target.value })}
                        className="input-text"
                      />
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{ padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <span>{isLoading ? 'Creating Account...' : `Register & Enter as ${signUpData.role}`}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
