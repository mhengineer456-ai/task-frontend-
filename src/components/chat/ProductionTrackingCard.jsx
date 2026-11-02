import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Scissors,
  Package,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Activity,
  Layers,
  User,
  Calendar,
  XCircle,
  FileText
} from 'lucide-react';

export default function ProductionTrackingCard({ trackingData, isSelf = false, onImageClick = null }) {
  if (!trackingData || !Array.isArray(trackingData.stages) || trackingData.stages.length === 0) {
    return null;
  }

  const [activeView, setActiveView] = useState('dual'); // 'dual' | 'stepper' | 'table'
  const [selectedStageIdx, setSelectedStageIdx] = useState(null);

  const {
    lotNumber,
    jobOrderNo,
    party,
    brand,
    garment,
    style,
    fabric,
    designImageUrl,
    isCancelled,
    cancelReason,
    overallProgress = 0,
    currentStage = 'In Production',
    latestWipRemark,
    latestWipTimestamp,
    stitchingSupervisor,
    stages = []
  } = trackingData;

  // Filter out Zip Entry and Dori Order per user requirement
  const displayStages = (stages || []).filter(st => {
    const name = `${st.dept || ''} ${st.stageName || ''} ${st.shortName || ''}`.toLowerCase();
    return !name.includes('zip') && !name.includes('dori');
  });

  // FACTORY BUSINESS RULE: IF BARCODE IS PRINTED, PACKING IS ALSO COMPLETED!
  const hasPackingDone = displayStages.some(
    s => (/packing|barcode/i.test(s.dept || '') || /packing|barcode/i.test(s.stageName || '')) &&
         (s.isCompleted || s.status?.includes('✓') || /completed|complete|packed/i.test(s.status || '') || (s.notes && /barcode/i.test(s.notes)))
  );

  const displayProgress = (hasPackingDone && !isCancelled) ? 100 : overallProgress;
  const displayStage = (hasPackingDone && !isCancelled) ? 'Production Completed' : currentStage;
  const isComplete = displayProgress >= 100 && !isCancelled;

  // Icon mapping for departments
  const getDeptIcon = (deptName = '') => {
    const d = deptName.toLowerCase();
    if (d.includes('order')) return <FileText style={{ width: '15px', height: '15px' }} />;
    if (d.includes('cutting')) return <Scissors style={{ width: '15px', height: '15px' }} />;
    if (d.includes('embroidery')) return <Sparkles style={{ width: '15px', height: '15px' }} />;
    if (d.includes('stitching')) return <Activity style={{ width: '15px', height: '15px' }} />;
    if (d.includes('packing') || d.includes('barcode')) return <Package style={{ width: '15px', height: '15px' }} />;
    return <Layers style={{ width: '15px', height: '15px' }} />;
  };

  return (
    <div
      className="tracking-card-root"
      style={{
        margin: '12px 0',
        borderRadius: '16px',
        background: isSelf ? 'rgba(0, 0, 0, 0.22)' : 'var(--bg-card, #ffffff)',
        border: isSelf ? '1.5px solid rgba(255, 255, 255, 0.25)' : '1.5px solid #bae6fd',
        boxShadow: isSelf ? 'none' : '0 4px 20px rgba(2, 132, 199, 0.09)',
        overflow: 'hidden',
        color: isSelf ? '#ffffff' : 'var(--text-primary, #0f172a)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 1. Header Banner */}
      <div
        className="tracking-card-header"
        style={{
          background: isSelf
            ? 'rgba(255, 255, 255, 0.08)'
            : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderBottom: isSelf ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
          {designImageUrl ? (
            <img
              src={designImageUrl}
              alt={`Lot ${lotNumber}`}
              onClick={() => onImageClick && onImageClick(designImageUrl)}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                objectFit: 'cover',
                cursor: 'pointer',
                border: '2px solid #38bdf8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                flexShrink: 0
              }}
              title="Click to view design artwork"
            />
          ) : (
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                flexShrink: 0
              }}
            >
              🧵
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: isSelf ? '#ffffff' : '#0369a1'
                }}
              >
                Lot #{lotNumber}
              </span>
              {jobOrderNo && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isSelf ? 'rgba(255,255,255,0.15)' : '#e0f2fe',
                    color: isSelf ? '#ffffff' : '#0284c7',
                    border: isSelf ? '1px solid rgba(255,255,255,0.2)' : '1px solid #7dd3fc'
                  }}
                >
                  {jobOrderNo}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelf ? 'rgba(255,255,255,0.88)' : '#334155', marginTop: '2px' }}>
              <strong style={{ color: isSelf ? '#ffffff' : '#0f172a' }}>{party}</strong>
              {brand && brand !== 'Standard' ? ` (${brand})` : ''}
              <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>
              <span>{garment}</span>
              {style ? ` - ${style}` : ''}
              {fabric ? ` (${fabric})` : ''}
            </div>
          </div>
        </div>

        {/* Status Pill & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isCancelled ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: '#fee2e2',
                border: '1px solid #f87171',
                color: '#b91c1c',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              <XCircle style={{ width: '14px', height: '14px' }} />
              CANCELLED {cancelReason ? `(${cancelReason})` : ''}
            </div>
          ) : isComplete ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: '#dcfce7',
                border: '1px solid #4ade80',
                color: '#15803d',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              <CheckCircle2 style={{ width: '14px', height: '14px' }} />
              ✓ PRODUCTION COMPLETE
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: '#e0f2fe',
                border: '1px solid #38bdf8',
                color: '#0369a1',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7', animation: 'pulse 1.8s infinite' }} />
              {displayProgress}% IN PRODUCTION
            </div>
          )}

          {/* View Toggle Buttons */}
          <div
            style={{
              display: 'inline-flex',
              background: isSelf ? 'rgba(0,0,0,0.25)' : '#ffffff',
              borderRadius: '8px',
              padding: '2px',
              border: isSelf ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1'
            }}
          >
            {[
              { id: 'dual', label: 'Timeline', desktopLabel: 'Dual View' },
              { id: 'stepper', label: 'Stepper', desktopLabel: 'Stepper' },
              { id: 'table', label: 'Table', desktopLabel: 'Audit Table' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                style={{
                  border: 'none',
                  background: activeView === tab.id
                    ? (isSelf ? '#ffffff' : '#0284c7')
                    : 'transparent',
                  color: activeView === tab.id
                    ? (isSelf ? '#0284c7' : '#ffffff')
                    : (isSelf ? 'rgba(255,255,255,0.7)' : '#64748b'),
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span className="header-label-desktop">{tab.desktopLabel}</span>
                <span className="header-label-mobile-only">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tracking-card-body">
        {/* 2. Overall Progress Bar */}
        {!isCancelled && (
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: isSelf ? 'rgba(255,255,255,0.9)' : '#475569' }}>
                Overall Production Progress: <strong style={{ color: isSelf ? '#ffffff' : '#0f172a' }}>{displayProgress}%</strong>
              </span>
              <span style={{ fontWeight: 600, color: isSelf ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
                Current Stage: <span style={{ color: isSelf ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>{displayStage}</span>
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: isSelf ? 'rgba(255,255,255,0.15)' : '#e2e8f0',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${displayProgress}%`,
                  height: '100%',
                  background: isComplete
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #10b981 100%)',
                  borderRadius: '6px',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>
        )}

        {/* 3. DEDICATED FLOOR ALERT BOX (Highlight Latest WIP Remarks) */}
        {latestWipRemark && (
          <div
            style={{
              margin: '14px 0 20px 0',
              padding: '12px 16px',
              borderRadius: '12px',
              background: isSelf
                ? 'rgba(245, 158, 11, 0.16)'
                : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: isSelf ? '1.5px solid #f59e0b' : '1.5px solid #fbbf24',
              boxShadow: '0 3px 12px rgba(245, 158, 11, 0.12)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1rem',
                  flexShrink: 0
                }}
              >
                🧵
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.2s infinite' }} />
                    Live Stitching Floor Active WIP Remark
                  </span>
                  {stitchingSupervisor && (
                    <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>
                      • Supervisor: <strong>{stitchingSupervisor}</strong>
                    </span>
                  )}
                  {latestWipTimestamp && (
                    <span style={{ fontSize: '0.7rem', color: '#b45309', opacity: 0.85 }}>
                      • Logged: {latestWipTimestamp}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#78350f',
                    marginTop: '4px',
                    lineHeight: '1.4'
                  }}
                >
                  "{latestWipRemark}"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. VISUAL STEPPER VIEW */}
        {(activeView === 'dual' || activeView === 'stepper') && (
          <div className={activeView === 'stepper' ? 'tracking-stepper-active' : 'tracking-desktop-stepper'} style={{ margin: '14px 0 20px 0' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isSelf ? 'rgba(255,255,255,0.7)' : '#64748b',
                marginBottom: '12px'
              }}
            >
              Department Milestone Journey
            </div>

            {/* Stepper Pipeline */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(105px, 1fr))`,
                gap: '8px',
                position: 'relative'
              }}
            >
              {displayStages.map((st, idx) => {
                const isSelected = selectedStageIdx === idx;
                const isPacking = /packing|barcode/i.test(st.dept || '') || /packing|barcode/i.test(st.stageName || '');
                const hasBarcode = Boolean((st.notes && /barcode/i.test(st.notes)) || (st.status && /barcode/i.test(st.status)));
                const isStDone = (isPacking && hasBarcode) || (st.isCompleted !== undefined
                  ? Boolean(st.isCompleted)
                  : Boolean(st.status && (st.status.includes('✓') || /completed|complete|packed|order registered/i.test(st.status))));
                const isStWip = !isStDone && (st.isWip !== undefined
                  ? Boolean(st.isWip)
                  : Boolean(st.status && (/wip|in progress|ongoing/i.test(st.status) || st.latestWipRemarks)));
                const isStPending = (!isStDone && !isStWip);

                let badgeColor = '#64748b';
                let circleBg = '#e2e8f0';
                let circleBorder = '#cbd5e1';
                let circleColor = '#64748b';

                if (isCancelled) {
                  circleBg = '#fee2e2';
                  circleBorder = '#f87171';
                  circleColor = '#dc2626';
                  badgeColor = '#dc2626';
                } else if (isStDone) {
                  circleBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  circleBorder = '#34d399';
                  circleColor = '#ffffff';
                  badgeColor = '#059669';
                } else if (isStWip) {
                  circleBg = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                  circleBorder = '#fbbf24';
                  circleColor = '#ffffff';
                  badgeColor = '#d97706';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedStageIdx(isSelected ? null : idx)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '10px 6px',
                      borderRadius: '12px',
                      background: isSelected
                        ? (isSelf ? 'rgba(255,255,255,0.18)' : '#f0f9ff')
                        : (isSelf ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                      border: isSelected
                        ? (isSelf ? '1.5px solid #38bdf8' : '1.5px solid #0284c7')
                        : (isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Circle Node */}
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: circleBg,
                        border: `2px solid ${circleBorder}`,
                        color: circleColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        boxShadow: isStWip ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none'
                      }}
                    >
                      {isCancelled ? (
                        '✕'
                      ) : isStDone ? (
                        <Check style={{ width: '17px', height: '17px', strokeWidth: 3 }} />
                      ) : isStWip ? (
                        <span style={{ fontSize: '0.9rem' }}>⏳</span>
                      ) : (
                        <Clock style={{ width: '15px', height: '15px' }} />
                      )}
                    </div>

                    {/* Department Name */}
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: isSelf ? '#ffffff' : '#0f172a',
                        lineHeight: '1.2',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}
                      title={st.dept}
                    >
                      {st.shortName || st.dept.replace(/Department/i, '').trim()}
                    </div>

                    {/* Supervisor */}
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: isSelf ? 'rgba(255,255,255,0.7)' : '#64748b',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}
                    >
                      {st.supervisor && st.supervisor !== '-' ? st.supervisor : '-'}
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isStDone ? '#dcfce7' : (isStWip ? '#fef3c7' : '#f1f5f9'),
                        color: badgeColor,
                        border: `1px solid ${isStDone ? '#bbf7d0' : (isStWip ? '#fde68a' : '#e2e8f0')}`,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isStDone ? 'Done' : (isStWip ? 'WIP' : 'Pending')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. STRUCTURED AUDIT TABLE VIEW */}
        {(activeView === 'dual' || activeView === 'table') && (
          <div className={activeView === 'table' ? 'tracking-table-active' : 'tracking-desktop-table'} style={{ marginTop: '14px' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isSelf ? 'rgba(255,255,255,0.7)' : '#64748b',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>Department Production Audit Records</span>
              <span className="tracking-mobile-scroll-hint" style={{ fontSize: '0.65rem', fontWeight: 600, color: '#0284c7', display: 'none' }}>
                👉 Swipe left/right
              </span>
            </div>

            <div
              style={{
                overflowX: 'auto',
                borderRadius: '10px',
                border: isSelf ? '1px solid rgba(255,255,255,0.18)' : '1px solid #cbd5e1',
                background: isSelf ? 'rgba(0,0,0,0.18)' : '#ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.78rem',
                  textAlign: 'left'
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: isSelf ? 'rgba(255,255,255,0.1)' : '#f8fafc',
                      borderBottom: isSelf ? '2px solid rgba(255,255,255,0.2)' : '2px solid #cbd5e1'
                    }}
                  >
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                      Department / Stage
                    </th>
                    <th style={{ padding: '8px 10px', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                      Date
                    </th>
                    <th style={{ padding: '8px 10px', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                      Supervisor
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                      Status
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                      Floor Notes & Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayStages.map((st, sIdx) => {
                    const isPacking = /packing|barcode/i.test(st.dept || '') || /packing|barcode/i.test(st.stageName || '');
                    const hasBarcode = Boolean((st.notes && /barcode/i.test(st.notes)) || (st.status && /barcode/i.test(st.status)));
                    const isDone = (isPacking && hasBarcode) || (st.isCompleted !== undefined
                      ? Boolean(st.isCompleted)
                      : Boolean(st.status && (st.status.includes('✓') || /completed|complete|packed|order registered/i.test(st.status))));
                    const isWip = !isDone && (st.isWip !== undefined
                      ? Boolean(st.isWip)
                      : Boolean(st.status && (/wip|in progress|ongoing/i.test(st.status) || st.latestWipRemarks)));
                    const statusText = (isPacking && hasBarcode && !st.status?.includes('✓'))
                      ? '✓ Packed (Barcode Printed)'
                      : st.status;

                    return (
                      <tr
                        key={sIdx}
                        style={{
                          background: sIdx % 2 === 0
                            ? 'transparent'
                            : (isSelf ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                          borderBottom: isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9'
                        }}
                      >
                        {/* Department */}
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: isSelf ? '#ffffff' : '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: isDone ? '#10b981' : (isWip ? '#f59e0b' : '#64748b') }}>
                              {getDeptIcon(st.dept)}
                            </span>
                            <span>{st.dept}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '8px 10px', color: isSelf ? 'rgba(255,255,255,0.85)' : '#475569', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.74rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isSelf ? 'rgba(255,255,255,0.1)' : '#f1f5f9'
                            }}
                          >
                            {st.date || '-'}
                          </span>
                        </td>

                        {/* Supervisor */}
                        <td style={{ padding: '8px 10px', color: isSelf ? '#ffffff' : '#1e293b', whiteSpace: 'nowrap' }}>
                          {st.supervisor && st.supervisor !== '-' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: isSelf ? 'rgba(255,255,255,0.12)' : '#e0f2fe',
                                color: isSelf ? '#ffffff' : '#0369a1',
                                fontWeight: 700,
                                fontSize: '0.72rem'
                              }}
                            >
                              <User style={{ width: '11px', height: '11px' }} />
                              {st.supervisor}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: isDone ? '#dcfce7' : (isWip ? '#fef3c7' : '#f1f5f9'),
                              color: isDone ? '#15803d' : (isWip ? '#b45309' : '#64748b'),
                              border: `1px solid ${isDone ? '#86efac' : (isWip ? '#fcd34d' : '#e2e8f0')}`
                            }}
                          >
                            {statusText}
                          </span>
                        </td>

                        {/* Notes / WIP Remarks */}
                        <td style={{ padding: '8px 12px', color: isSelf ? 'rgba(255,255,255,0.85)' : '#334155', fontSize: '0.75rem' }}>
                          {st.wipRemark ? (
                            <div style={{ color: '#b45309', fontWeight: 700 }}>
                              🔥 Latest WIP: "{st.wipRemark}" {st.wipTimestamp ? `(${st.wipTimestamp})` : ''}
                            </div>
                          ) : (
                            st.notes || '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. MOBILE PRODUCTION TIMELINE (Vertical Stage Cards for Smartphones) */}
        {activeView === 'dual' && (
          <div className="tracking-mobile-timeline" style={{ marginTop: '14px' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isSelf ? 'rgba(255,255,255,0.7)' : '#64748b',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>Production Stage Timeline</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0284c7' }}>
                {displayStages.filter(s => {
                  const isPacking = /packing|barcode/i.test(s.dept || '') || /packing|barcode/i.test(s.stageName || '');
                  const hasBarcode = Boolean((s.notes && /barcode/i.test(s.notes)) || (s.status && /barcode/i.test(s.status)));
                  return (isPacking && hasBarcode) || s.isCompleted || (s.status && s.status.includes('✓')) || /completed|complete|packed/i.test(s.status || '');
                }).length}/{displayStages.length} Stages Complete
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
              {displayStages.map((st, sIdx) => {
                const isSelected = selectedStageIdx === sIdx;
                const isPacking = /packing|barcode/i.test(st.dept || '') || /packing|barcode/i.test(st.stageName || '');
                const hasBarcode = Boolean((st.notes && /barcode/i.test(st.notes)) || (st.status && /barcode/i.test(st.status)));
                const isDone = (isPacking && hasBarcode) || (st.isCompleted !== undefined
                  ? Boolean(st.isCompleted)
                  : Boolean(st.status && (st.status.includes('✓') || /completed|complete|packed|order registered/i.test(st.status))));
                const isWip = !isDone && (st.isWip !== undefined
                  ? Boolean(st.isWip)
                  : Boolean(st.status && (/wip|in progress|ongoing/i.test(st.status) || st.latestWipRemarks)));
                const isPending = !isDone && !isWip;
                const isLast = sIdx === displayStages.length - 1;

                const statusText = (isPacking && hasBarcode && !st.status?.includes('✓'))
                  ? '✓ Packed'
                  : (isDone ? 'Completed' : (isWip ? 'In Progress' : 'Pending'));

                return (
                  <div
                    key={sIdx}
                    onClick={() => setSelectedStageIdx(isSelected ? null : sIdx)}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      position: 'relative',
                      paddingBottom: isLast ? '0px' : '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Vertical connecting line & node */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
                      {/* Node Circle */}
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isCancelled
                            ? '#fee2e2'
                            : (isDone
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : (isWip ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : (isSelf ? 'rgba(255,255,255,0.1)' : '#f1f5f9'))),
                          border: isCancelled
                            ? '2px solid #ef4444'
                            : (isDone
                              ? '2px solid #34d399'
                              : (isWip ? '2px solid #fbbf24' : (isSelf ? '2px solid rgba(255,255,255,0.2)' : '2px solid #cbd5e1'))),
                          color: (isDone || isWip) && !isCancelled ? '#ffffff' : (isCancelled ? '#dc2626' : (isSelf ? '#94a3b8' : '#64748b')),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          boxShadow: !isCancelled && isDone
                            ? '0 2px 6px rgba(16, 185, 129, 0.35)'
                            : (!isCancelled && isWip ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none'),
                          zIndex: 2,
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        {isCancelled ? '✕' : (isDone ? '✓' : (isWip ? '⏳' : sIdx + 1))}
                      </div>

                      {/* Connecting Line to next node */}
                      {!isLast && (
                        <div
                          style={{
                            width: '2px',
                            flex: 1,
                            minHeight: '22px',
                            background: isCancelled
                              ? '#fca5a5'
                              : (isDone
                                ? '#10b981'
                                : (isWip ? 'linear-gradient(to bottom, #f59e0b, #cbd5e1)' : (isSelf ? 'rgba(255,255,255,0.15)' : '#e2e8f0'))),
                            marginTop: '4px',
                            marginBottom: '2px'
                          }}
                        />
                      )}
                    </div>

                    {/* Stage Card Content */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: isWip
                          ? (isSelf ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb')
                          : (isSelected
                            ? (isSelf ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff')
                            : (isSelf ? 'rgba(255,255,255,0.04)' : '#ffffff')),
                        border: isWip
                          ? (isSelf ? '1.5px solid #f59e0b' : '1.5px solid #fde68a')
                          : (isSelected
                            ? (isSelf ? '1.5px solid #38bdf8' : '1.5px solid #0284c7')
                            : (isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0')),
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: isWip
                          ? '0 2px 8px rgba(245, 158, 11, 0.08)'
                          : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Header: Stage Name + Status Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ color: isDone ? '#10b981' : (isWip ? '#f59e0b' : '#64748b'), flexShrink: 0 }}>
                            {getDeptIcon(st.dept)}
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              color: isSelf ? '#ffffff' : '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {st.dept}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isCancelled
                              ? '#fee2e2'
                              : (isDone ? '#dcfce7' : (isWip ? '#fef3c7' : '#f1f5f9')),
                            color: isCancelled
                              ? '#dc2626'
                              : (isDone ? '#15803d' : (isWip ? '#b45309' : '#64748b')),
                            border: `1px solid ${isCancelled ? '#fca5a5' : (isDone ? '#86efac' : (isWip ? '#fcd34d' : '#e2e8f0'))}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          {statusText}
                        </span>
                      </div>

                      {/* Stage Metadata Chips: Date & Supervisor */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {st.date && st.date !== '-' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              color: isSelf ? 'rgba(255,255,255,0.75)' : '#475569',
                              background: isSelf ? 'rgba(255,255,255,0.08)' : '#f8fafc',
                              border: isSelf ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              fontFamily: 'monospace'
                            }}
                          >
                            <Calendar style={{ width: '10px', height: '10px', opacity: 0.7 }} />
                            {st.date}
                          </span>
                        )}

                        {st.supervisor && st.supervisor !== '-' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: isSelf ? '#7dd3fc' : '#0369a1',
                              background: isSelf ? 'rgba(3, 105, 161, 0.2)' : '#e0f2fe',
                              border: isSelf ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <User style={{ width: '10px', height: '10px', flexShrink: 0 }} />
                            {st.supervisor}
                          </span>
                        )}
                      </div>

                      {/* Notes / WIP Remarks */}
                      {(st.wipRemark || (st.notes && st.notes !== '-')) && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            lineHeight: '1.35',
                            background: st.wipRemark
                              ? (isSelf ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7')
                              : (isSelf ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
                            border: st.wipRemark
                              ? (isSelf ? '1px solid #f59e0b' : '1px solid #fde68a')
                              : (isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9'),
                            color: st.wipRemark
                              ? (isSelf ? '#fef08a' : '#92400e')
                              : (isSelf ? 'rgba(255,255,255,0.85)' : '#334155'),
                            fontWeight: st.wipRemark ? 700 : 500
                          }}
                        >
                          {st.wipRemark ? (
                            <div>
                              🔥 <strong>WIP Update:</strong> "{st.wipRemark}"
                              {st.wipTimestamp && (
                                <span style={{ opacity: 0.8, fontSize: '0.67rem', marginLeft: '4px' }}>
                                  ({st.wipTimestamp})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span style={{ opacity: 0.7, marginRight: '4px' }}>📝</span>
                              {st.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
