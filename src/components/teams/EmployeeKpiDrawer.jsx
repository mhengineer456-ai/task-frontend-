import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate } from '../../utils/dateUtils';
import {
  X,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit,
  Plus,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Calendar,
  Layers,
  Zap,
  Star,
  Activity,
  BarChart3,
  Check,
  Flame,
  CheckSquare
} from 'lucide-react';

export default function EmployeeKpiDrawer({ employeeId, onClose }) {
  const { users, tasks, activeUser, updateUserKraAndKpi } = useTaskContext();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'kpis' | 'kras' | 'tasks' | 'review'
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState('Q3 2026');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Manager evaluation state
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(4.8);
  const [managerNotes, setManagerNotes] = useState('');
  const [bonusEligible, setBonusEligible] = useState(true);
  const [growthGoals, setGrowthGoals] = useState([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Global Esc key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!employeeId) return null;
  const employee = users.find(u => u.id === employeeId || u.employeeId === employeeId);
  if (!employee) return null;

  // Initialize review fields from employee data
  useEffect(() => {
    if (employee.performanceReview) {
      setReviewRating(employee.performanceReview.rating || 4.8);
      setManagerNotes(employee.performanceReview.managerFeedback || 'Consistently delivers high-quality sprint deliverables with stellar focus.');
      setBonusEligible(employee.performanceReview.bonusEligible !== false);
      setGrowthGoals(employee.performanceReview.growthGoals || [
        'Lead micro-services architecture transition',
        'Mentor junior engineers in automated test coverage',
        'Contribute to quarterly technical design review sessions'
      ]);
    } else {
      setGrowthGoals([
        'Lead micro-services architecture transition',
        'Mentor junior engineers in automated test coverage',
        'Contribute to quarterly technical design review sessions'
      ]);
    }
  }, [employee]);

  // Check access permissions
  const canAccess =
    activeUser?.role === 'Admin' ||
    activeUser?.role === 'Manager' ||
    activeUser?.role === 'MD' ||
    activeUser?.id === employee.managerId ||
    activeUser?.name === employee.managerName;

  if (!canAccess) {
    const accessModal = (
      <div className="kpi-fullscreen-overlay" onClick={onClose}>
        <div
          className="kpi-dashboard-window"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '500px', height: 'auto', padding: '2.5rem', textAlign: 'center', margin: 'auto' }}
        >
          <ShieldAlert style={{ width: '56px', height: '56px', color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Access Restricted</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Detailed KPI, KRA, and Performance Intelligence profiles can only be accessed by authorized Managers and Directors.
          </p>
          <button onClick={onClose} className="btn btn-primary" style={{ marginTop: '1.5rem', alignSelf: 'center' }}>
            Close Dashboard
          </button>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(accessModal, document.body) : accessModal;
  }

  const employeeTasks = tasks.filter(t => t.assigneeId === employee.id);
  const completedTasks = employeeTasks.filter(t => t.status === 'Completed' || t.status === 'Approved');

  // KPI Benchmarks
  const kpi = employee.kpi || {
    onTimeRate: 100,
    avgResolutionHours: 12.4,
    overdueRate: 0,
    qualityScore: 98,
    slaCompliance: 100
  };

  // KRA List
  const kraList = employee.kraList && employee.kraList.length > 0 ? employee.kraList : [
    {
      id: 'kra-1',
      title: 'Production Sprint Delivery & Milestones',
      weight: 40,
      score: 98,
      status: 'Exceeding',
      description: 'Ship committed lot orders and system deliverables with zero sprint rollover.'
    },
    {
      id: 'kra-2',
      title: 'Quality Rigor & Zero Defect Standards',
      weight: 30,
      score: 100,
      status: 'Exceeding',
      description: 'Maintain 98%+ code review first-pass approval and zero regression defects.'
    },
    {
      id: 'kra-3',
      title: 'SLA Adherence & Cross-Team Collaboration',
      weight: 30,
      score: 95,
      status: 'On Track',
      description: 'Resolve high-priority escalations within SLA threshold and conduct daily follow-up logs.'
    }
  ];

  // 6-Month Velocity Data for Area Chart
  const trendHistory = [
    { month: 'May', onTime: 88, sla: 96, tasks: 14 },
    { month: 'Jun', onTime: 92, sla: 97, tasks: 18 },
    { month: 'Jul', onTime: 94, sla: 99, tasks: 22 },
    { month: 'Aug', onTime: 95, sla: 98, tasks: 19 },
    { month: 'Sep', onTime: 97, sla: 100, tasks: 26 },
    { month: 'Oct', onTime: 100, sla: 100, tasks: 29 }
  ];

  // Competency Radar Chart Axes (5 Metrics)
  const competencyRadar = [
    { label: 'Speed & Velocity', value: 94, angle: 0 },
    { label: 'Quality & Rigor', value: 98, angle: 72 },
    { label: 'SLA Adherence', value: 100, angle: 144 },
    { label: 'Problem Solving', value: 91, angle: 216 },
    { label: 'Team Leadership', value: 95, angle: 288 }
  ];

  // Weekly Throughput Bar Chart Data (8 Weeks)
  const weeklyThroughput = [
    { week: 'W1', assigned: 4, completed: 4 },
    { week: 'W2', assigned: 5, completed: 5 },
    { week: 'W3', assigned: 6, completed: 6 },
    { week: 'W4', assigned: 4, completed: 4 },
    { week: 'W5', assigned: 7, completed: 6 },
    { week: 'W6', assigned: 5, completed: 5 },
    { week: 'W7', assigned: 8, completed: 8 },
    { week: 'W8', assigned: 6, completed: 6 }
  ];

  // Save Evaluation
  const handleSaveEvaluation = () => {
    const updatedReview = {
      rating: Number(reviewRating),
      evaluationPeriod: selectedQuarter,
      managerFeedback: managerNotes,
      bonusEligible,
      growthGoals
    };
    if (updateUserKraAndKpi) {
      updateUserKraAndKpi(employee.id, kpi, kraList, updatedReview);
    }
    setSaveSuccess(true);
    setIsEditingReview(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    setGrowthGoals(prev => [...prev, newGoalText.trim()]);
    setNewGoalText('');
  };

  const handleRemoveGoal = (idx) => {
    setGrowthGoals(prev => prev.filter((_, i) => i !== idx));
  };

  const dashboardModal = (
    <div
      className={`kpi-fullscreen-overlay ${isFullscreen ? 'maximized' : ''}`}
      onClick={onClose}
    >
      <div
        className={`kpi-dashboard-window ${isFullscreen ? 'maximized' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================================================
            1. TOP EXECUTIVE HEADER BAR
            ========================================================================== */}
        <div className="kpi-header-strip">
          {/* Employee Avatar & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    border: '2px solid var(--brand-primary)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--brand-primary), #06b6d4)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {(employee.name || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid var(--bg-card)'
                }}
                title="Active Team Contributor"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {employee.name}
                </h2>
                <span className="badge badge-brand" style={{ fontFamily: 'monospace', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                  {employee.employeeId || 'EMP-1091'}
                </span>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800, fontSize: '0.7rem' }}>
                  ⭐ 95.4 / 100 • Top Tier
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                <strong>{employee.role}</strong> • {employee.department} ({employee.team || 'Engineering'}) • Manager: <em>{employee.managerName || activeUser?.name}</em>
              </p>
            </div>
          </div>

          {/* Header Controls: Quarter Filter, Fullscreen Toggle, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Quarter Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Calendar style={{ width: '14px', height: '14px', color: 'var(--brand-primary)' }} />
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
                <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
                <option value="Q3 2026">Q3 2026 (Active)</option>
                <option value="Q4 2026">Q4 2026 (Forecast)</option>
              </select>
            </div>

            {/* Print / Export Report */}
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              title="Print / Save PDF Report"
            >
              <Printer style={{ width: '14px', height: '14px' }} />
              <span className="header-label-desktop">Print Report</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-icon"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                padding: '8px',
                borderRadius: '8px'
              }}
              title={isFullscreen ? 'Restore Windowed View' : 'Expand to Full Screen'}
            >
              {isFullscreen ? (
                <Minimize2 style={{ width: '16px', height: '16px' }} />
              ) : (
                <Maximize2 style={{ width: '16px', height: '16px' }} />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '8px',
                borderRadius: '8px'
              }}
              title="Close Dashboard (Esc)"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* ==========================================================================
            2. NAVIGATION TABS STRIP
            ========================================================================== */}
        <div className="kpi-tabs-strip">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`kpi-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 style={{ width: '15px', height: '15px' }} />
            <span>Executive Analytics & Graphs</span>
          </button>
          <button
            onClick={() => setActiveTab('kpis')}
            className={`kpi-tab-btn ${activeTab === 'kpis' ? 'active' : ''}`}
          >
            <Award style={{ width: '15px', height: '15px' }} />
            <span>KPI Scorecards</span>
          </button>
          <button
            onClick={() => setActiveTab('kras')}
            className={`kpi-tab-btn ${activeTab === 'kras' ? 'active' : ''}`}
          >
            <Target style={{ width: '15px', height: '15px' }} />
            <span>KRA Objectives & Matrix ({kraList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`kpi-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            <TrendingUp style={{ width: '15px', height: '15px' }} />
            <span>Task Velocity & Execution ({employeeTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`kpi-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          >
            <Sparkles style={{ width: '15px', height: '15px' }} />
            <span>Manager 360° Evaluation</span>
          </button>
        </div>

        {/* ==========================================================================
            3. SCROLLABLE DASHBOARD VIEWPORT
            ========================================================================== */}
        <div className="kpi-content-viewport">
          {/* Top 5 Executive Metric Cards (Always visible across all tabs) */}
          <div className="kpi-metrics-grid" style={{ marginBottom: '0.5rem' }}>
            {/* Card 1: On-Time Rate */}
            <div className="kpi-metric-card" style={{ cursor: 'default' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  On-Time Delivery
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10b981', marginTop: '2px', fontFamily: 'monospace' }}>
                  {kpi.onTimeRate}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '2px' }}>
                  ▲ +4.2% MoM • Target: &gt;90%
                </div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <CheckCircle2 style={{ width: '22px', height: '22px' }} />
              </div>
            </div>

            {/* Card 2: Avg Resolution Velocity */}
            <div className="kpi-metric-card" style={{ cursor: 'default' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Resolution Velocity
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--brand-primary)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {kpi.avgResolutionHours} hrs
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  🚀 Top 10% Speed • Target: &lt;16h
                </div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--brand-primary)' }}>
                <Zap style={{ width: '22px', height: '22px' }} />
              </div>
            </div>

            {/* Card 3: SLA Compliance */}
            <div className="kpi-metric-card" style={{ cursor: 'default' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  SLA Compliance
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px', fontFamily: 'monospace' }}>
                  {kpi.slaCompliance}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                  🛡️ Zero SLA Violations
                </div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <ShieldAlert style={{ width: '22px', height: '22px' }} />
              </div>
            </div>

            {/* Card 4: Quality & Review Score */}
            <div className="kpi-metric-card" style={{ cursor: 'default' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Code & QA Pass Rate
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed', marginTop: '2px', fontFamily: 'monospace' }}>
                  {kpi.qualityScore}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, marginTop: '2px' }}>
                  💎 Zero Critical Regressions
                </div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' }}>
                <Award style={{ width: '22px', height: '22px' }} />
              </div>
            </div>

            {/* Card 5: Overall Performance Index */}
            <div className="kpi-metric-card" style={{ cursor: 'default', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(2, 132, 199, 0.05))', borderColor: 'var(--brand-primary)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Overall Performance
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'monospace' }}>
                  95.4 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--brand-primary)', fontWeight: 800, marginTop: '2px' }}>
                  ★ Tier 1 (Bonus Eligible)
                </div>
              </div>
              <div className="kpi-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--brand-primary), #06b6d4)', color: '#ffffff' }}>
                <Flame style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
          </div>

          {/* ==========================================================================
              TAB 1: 📊 EXECUTIVE ANALYTICS & INTERACTIVE GRAPHS
              ========================================================================== */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Row 1: 6-Month On-Time & SLA Curve + 5-Axis Competency Radar Chart */}
              <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1.25rem' }}>
                
                {/* Graph A: 6-Month Velocity Trendline (Area Chart) */}
                <div className="chart-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Activity style={{ width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                        6-Month KPI Delivery Velocity Trend
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        Tracked On-Time Delivery Rate (%) and Total Completed Orders
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                        <span style={{ width: '10px', height: '3px', background: 'var(--brand-primary)', borderRadius: '2px' }} /> On-Time Rate
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontWeight: 700 }}>
                        <span style={{ width: '10px', height: '2px', borderTop: '2px dashed #f59e0b' }} /> Benchmark (90%)
                      </span>
                    </div>
                  </div>

                  {/* Responsive SVG Chart */}
                  <div style={{ width: '100%', height: '260px', position: 'relative' }}>
                    <svg viewBox="0 0 600 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="580" y2="30" className="graph-grid-line" />
                      <line x1="40" y1="80" x2="580" y2="80" className="graph-grid-line" />
                      <line x1="40" y1="130" x2="580" y2="130" className="graph-grid-line" />
                      <line x1="40" y1="180" x2="580" y2="180" className="graph-grid-line" />

                      {/* Y-Axis Labels */}
                      <text x="25" y="34" fill="var(--text-muted)" fontSize="10" textAnchor="end">100%</text>
                      <text x="25" y="84" fill="var(--text-muted)" fontSize="10" textAnchor="end">95%</text>
                      <text x="25" y="134" fill="var(--text-muted)" fontSize="10" textAnchor="end">90%</text>
                      <text x="25" y="184" fill="var(--text-muted)" fontSize="10" textAnchor="end">85%</text>

                      {/* 90% Benchmark Dotted Line */}
                      <line x1="40" y1="130" x2="580" y2="130" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" />

                      {/* Area Fill */}
                      <path
                        d="M 60 150 Q 164 110, 268 90 T 372 80 T 476 60 T 560 30 L 560 190 L 60 190 Z"
                        className="graph-area-path"
                      />

                      {/* Main Smooth Line */}
                      <path
                        d="M 60 150 Q 164 110, 268 90 T 372 80 T 476 60 T 560 30"
                        className="graph-line-path"
                      />

                      {/* Data Points */}
                      {trendHistory.map((item, idx) => {
                        const cx = 60 + idx * 100;
                        const cy = 30 + ((100 - item.onTime) / 15) * 150;
                        const isHovered = hoveredPoint === idx;

                        return (
                          <g key={item.month} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isHovered ? "7" : "4.5"}
                              className="graph-dot"
                            />
                            {/* X-axis label */}
                            <text
                              x={cx}
                              y="215"
                              fill={isHovered ? "var(--brand-primary)" : "var(--text-muted)"}
                              fontSize="11"
                              fontWeight={isHovered ? "800" : "600"}
                              textAnchor="middle"
                            >
                              {item.month}
                            </text>

                            {/* Floating Tooltip */}
                            {isHovered && (
                              <g transform={`translate(${cx - 50}, ${cy - 48})`}>
                                <rect width="100" height="38" rx="6" fill="var(--bg-card)" stroke="var(--brand-primary)" strokeWidth="1" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))" />
                                <text x="50" y="16" fill="var(--text-primary)" fontSize="10" fontWeight="800" textAnchor="middle">
                                  {item.month} 2026: {item.onTime}%
                                </text>
                                <text x="50" y="30" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
                                  {item.tasks} Tasks Done
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Graph B: 5-Axis Professional Competency Radar Chart */}
                <div className="chart-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Target style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                        360° Competency Evaluation Radar
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        Quarterly multi-axis evaluation across speed, rigor, SLA, and collaboration
                      </p>
                    </div>
                    <span className="badge badge-brand">Balanced Top Performer</span>
                  </div>

                  {/* Radar Chart SVG */}
                  <div style={{ width: '100%', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 360 270" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* Concentric Pentagon Grid Rings (20%, 40%, 60%, 80%, 100%) */}
                      {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring, rIdx) => {
                        const radius = 95 * ring;
                        const points = [0, 72, 144, 216, 288].map(deg => {
                          const rad = ((deg - 90) * Math.PI) / 180;
                          return `${180 + radius * Math.cos(rad)},${130 + radius * Math.sin(rad)}`;
                        }).join(' ');

                        return (
                          <polygon
                            key={rIdx}
                            points={points}
                            fill="none"
                            stroke="var(--border-color)"
                            strokeWidth="1"
                            strokeDasharray={rIdx === 4 ? "none" : "2 2"}
                          />
                        );
                      })}

                      {/* 5 Spoke Axis Lines */}
                      {[0, 72, 144, 216, 288].map((deg, sIdx) => {
                        const rad = ((deg - 90) * Math.PI) / 180;
                        const x2 = 180 + 95 * Math.cos(rad);
                        const y2 = 130 + 95 * Math.sin(rad);
                        return (
                          <line
                            key={sIdx}
                            x1="180"
                            y1="130"
                            x2={x2}
                            y2={y2}
                            stroke="var(--border-color)"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Filled Competency Polygon */}
                      {(() => {
                        const points = competencyRadar.map(item => {
                          const radius = (item.value / 100) * 95;
                          const rad = ((item.angle - 90) * Math.PI) / 180;
                          return `${180 + radius * Math.cos(rad)},${130 + radius * Math.sin(rad)}`;
                        }).join(' ');

                        return (
                          <polygon
                            points={points}
                            className="radar-polygon"
                          />
                        );
                      })()}

                      {/* Radar Nodes & Metric Labels */}
                      {competencyRadar.map((item, idx) => {
                        const radius = (item.value / 100) * 95;
                        const rad = ((item.angle - 90) * Math.PI) / 180;
                        const nx = 180 + radius * Math.cos(rad);
                        const ny = 130 + radius * Math.sin(rad);

                        // Label offset
                        const labelRad = ((item.angle - 90) * Math.PI) / 180;
                        const lx = 180 + 120 * Math.cos(labelRad);
                        const ly = 130 + 115 * Math.sin(labelRad);

                        return (
                          <g key={item.label}>
                            <circle cx={nx} cy={ny} r="4" fill="#ffffff" stroke="var(--brand-primary)" strokeWidth="2" />
                            <text
                              x={lx}
                              y={ly}
                              fill="var(--text-secondary)"
                              fontSize="10"
                              fontWeight="700"
                              textAnchor="middle"
                            >
                              {item.label} ({item.value}%)
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Row 2: Weekly Task Throughput (Bar Chart) + KRA Weightage Breakdown */}
              <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1.25rem' }}>
                
                {/* Graph C: Weekly Task Throughput Bar Chart */}
                <div className="chart-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
                        Weekly Task Throughput & Burnup (Last 8 Weeks)
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        Assigned volume vs Delivered units per sprint cycle
                      </p>
                    </div>
                    <span className="badge badge-emerald">100% Completion Ratio</span>
                  </div>

                  {/* Bar Chart Visualization */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingTop: '2rem', paddingBottom: '0.5rem' }}>
                    {weeklyThroughput.map(w => {
                      const heightPct = Math.round((w.completed / 8) * 100);
                      return (
                        <div key={w.week} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                            {w.completed}
                          </span>
                          <div style={{ width: '28px', height: '130px', background: 'var(--bg-input)', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '100%',
                                height: `${heightPct}%`,
                                background: 'linear-gradient(180deg, var(--brand-primary), #06b6d4)',
                                borderRadius: '6px',
                                transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {w.week}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Graph D: KRA Objectives Weightage & Progress Matrix */}
                <div className="chart-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Target style={{ width: '16px', height: '16px', color: 'var(--brand-primary)' }} />
                        KRA Weightage & Achievement Score
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        Quarterly Key Result Areas distributed to 100% total weight
                      </p>
                    </div>
                    <span className="badge badge-brand">Score: 97.6 / 100</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    {kraList.map(kra => (
                      <div key={kra.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                            {kra.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weight: {kra.weight}%</span>
                            <span className={`badge ${kra.score >= 95 ? 'badge-emerald' : 'badge-brand'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              {kra.score} / 100 ({kra.status})
                            </span>
                          </div>
                        </div>

                        {/* Progress Meter */}
                        <div style={{ height: '7px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${kra.score}%`,
                              background: kra.score >= 95
                                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                : 'linear-gradient(90deg, var(--brand-primary), #0284c7)',
                              borderRadius: '999px'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================================================
              TAB 2: 🎯 KEY PERFORMANCE INDICATORS (DETAILED CARDS)
              ========================================================================== */}
          {activeTab === 'kpis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
                  KPI Scorecard Breakdown ({selectedQuarter})
                </h3>
                <span className="badge badge-emerald">Verified Enterprise Metrics</span>
              </div>

              <div className="grid grid-cols-2 lg-grid-cols-1" style={{ gap: '1rem' }}>
                <div className="chart-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    1. On-Time Completion Rate
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>
                    {kpi.onTimeRate}%
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Measures percentage of assigned tasks completed on or before the established deadline. Benchmark is set at &gt;90%.
                  </p>
                  <div className="badge badge-emerald" style={{ alignSelf: 'flex-start' }}>
                    Target Achieved • Top Tier Rating
                  </div>
                </div>

                <div className="chart-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    2. Average Resolution Velocity
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                    {kpi.avgResolutionHours} hrs
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Turnaround time from task assignment to resolution/completion. Benchmark target is &lt;16.0 hours across all priority buckets.
                  </p>
                  <div className="badge badge-brand" style={{ alignSelf: 'flex-start' }}>
                    High Velocity • 3.6 Hours Faster than Target
                  </div>
                </div>

                <div className="chart-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    3. SLA Compliance Score
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                    {kpi.slaCompliance}%
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Measures adherence to internal service level agreements on critical path deliverables. Target benchmark is &gt;98%.
                  </p>
                  <div className="badge badge-cyan" style={{ alignSelf: 'flex-start' }}>
                    Zero Violations • High Reliability
                  </div>
                </div>

                <div className="chart-card">
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    4. QA & Code Review Pass Rate
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7c3aed', fontFamily: 'monospace' }}>
                    {kpi.qualityScore}%
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    First-pass acceptance rate in peer reviews and managerial quality audits. Target benchmark is &gt;95%.
                  </p>
                  <div className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>
                    Zero Defect Quality • Gold Standard
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================================
              TAB 3: 🎯 KRA MATRIX & OBJECTIVES
              ========================================================================== */}
          {activeTab === 'kras' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
                  Key Result Areas (KRAs) & Weights ({selectedQuarter})
                </h3>
                <span className="badge badge-brand">Total Weightage: 100%</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {kraList.map((kra, index) => (
                  <div key={kra.id} className="chart-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ background: 'var(--bg-input)', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                          {index + 1}
                        </span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {kra.title}
                        </h4>
                        <span className="badge badge-brand">Weight: {kra.weight}%</span>
                      </div>

                      <span className={`badge ${kra.score >= 95 ? 'badge-emerald' : 'badge-brand'}`} style={{ fontSize: '0.75rem' }}>
                        {kra.status} ({kra.score} / 100 Score)
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                      {kra.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Progress & Delivery Milestone</span>
                        <span style={{ fontFamily: 'monospace' }}>{kra.score} / 100</span>
                      </div>
                      <div style={{ width: '100%', background: 'var(--bg-input)', borderRadius: '999px', height: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div
                          style={{
                            background: kra.score >= 95 ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'linear-gradient(90deg, var(--brand-primary), #0284c7)',
                            height: '100%',
                            width: `${kra.score}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================================
              TAB 4: 📈 TASK VELOCITY & EXECUTION HISTORY
              ========================================================================== */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  Assigned Task Execution History ({employeeTasks.length} Tasks)
                </h3>
                <span className="badge badge-brand">
                  {completedTasks.length} Completed ({employeeTasks.length > 0 ? Math.round((completedTasks.length / employeeTasks.length) * 100) : 0}%)
                </span>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Title & Category</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Progress</th>
                      <th>Hours (Act/Est)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeTasks.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                          No tasks currently assigned to this team member.
                        </td>
                      </tr>
                    ) : (
                      employeeTasks.map(t => (
                        <tr key={t.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-light)' }}>
                            {t.id}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text-primary)' }}>{t.title}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.category}</div>
                          </td>
                          <td>
                            <span className={`badge ${t.status === 'Completed' || t.status === 'Approved' ? 'badge-emerald' : t.status === 'In Progress' ? 'badge-cyan' : 'badge-brand'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800 }}>
                            {t.priority}
                          </td>
                          <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {formatDate(t.dueDate)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '80px' }}>
                              <div style={{ flex: 1, height: '5px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${t.progress || 0}%`, background: '#10b981' }} />
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{t.progress || 0}%</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {t.actualHours || 0} / {t.estimatedHours || 0}h
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================================================
              TAB 5: 📝 MANAGER 360° EVALUATION & APPRAISAL
              ========================================================================== */}
          {activeTab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                  Manager Evaluation & Quarterly Appraisal ({selectedQuarter})
                </h3>
                {saveSuccess && (
                  <span className="badge badge-emerald" style={{ animation: 'fadeIn 0.2s' }}>
                    <Check style={{ width: '13px', height: '13px' }} /> Evaluation Saved to System!
                  </span>
                )}
              </div>

              {/* Rating Card */}
              <div className="chart-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Performance Score Rating
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                      {reviewRating} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span>
                    </div>
                    {/* Star Rating Display */}
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          onClick={() => isEditingReview && setReviewRating(star)}
                          style={{
                            width: '20px',
                            height: '20px',
                            fill: star <= Math.round(reviewRating) ? '#f59e0b' : 'none',
                            color: star <= Math.round(reviewRating) ? '#f59e0b' : 'var(--text-muted)',
                            cursor: isEditingReview ? 'pointer' : 'default'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                    {reviewRating >= 4.5 ? '🏆 Exceeds Expectations (Top Tier)' : '✅ Meets Target Benchmarks'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>Quarterly Bonus Eligibility:</span>
                    <button
                      type="button"
                      disabled={!isEditingReview}
                      onClick={() => setBonusEligible(!bonusEligible)}
                      className={`badge ${bonusEligible ? 'badge-emerald' : 'badge-rose'}`}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', cursor: isEditingReview ? 'pointer' : 'default' }}
                    >
                      {bonusEligible ? '✓ 100% BONUS ELIGIBLE' : '✗ NOT ELIGIBLE'}
                    </button>
                  </div>

                  {!isEditingReview ? (
                    <button
                      onClick={() => setIsEditingReview(true)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Edit style={{ width: '14px', height: '14px' }} /> Edit Evaluation
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveEvaluation}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', background: '#10b981' }}
                    >
                      <Check style={{ width: '14px', height: '14px' }} /> Save Changes
                    </button>
                  )}
                </div>
              </div>

              {/* Manager Feedback Text */}
              <div className="chart-card">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  Executive Manager Appraisal Notes:
                </span>
                {isEditingReview ? (
                  <textarea
                    rows={4}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    className="search-input"
                    placeholder="Enter comprehensive appraisal notes, strengths, and areas of excellence..."
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.85rem' }}
                  />
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.6', margin: '0.25rem 0' }}>
                    "{managerNotes}"
                  </p>
                )}
              </div>

              {/* Career Growth & Goals */}
              <div className="chart-card">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  Quarterly Growth & Strategic Development Goals:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {growthGoals.map((goal, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'var(--bg-input)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        <CheckCircle2 style={{ width: '15px', height: '15px', color: '#10b981' }} />
                        <span>{goal}</span>
                      </div>
                      {isEditingReview && (
                        <button onClick={() => handleRemoveGoal(idx)} style={{ color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditingReview && (
                  <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Add new growth objective..."
                      value={newGoalText}
                      onChange={(e) => setNewGoalText(e.target.value)}
                      className="search-input"
                      style={{ flex: 1, height: '34px', fontSize: '0.78rem' }}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ height: '34px', fontSize: '0.75rem' }}>
                      <Plus style={{ width: '14px', height: '14px' }} /> Add Goal
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(dashboardModal, document.body)
    : dashboardModal;
}
