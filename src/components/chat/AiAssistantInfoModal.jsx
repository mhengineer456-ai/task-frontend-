import React from 'react';
import {
  X,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  Workflow,
  Cpu,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

export default function AiAssistantInfoModal({ onClose, activeUser, onOpenLinkedSheets }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '540px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #bae6fd',
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
            color: '#ffffff',
            padding: '1.75rem 2rem',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.2)',
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
            title="Close"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                border: '3px solid rgba(255, 255, 255, 0.8)'
              }}
            >
              🤖
            </div>

            <div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-block',
                  marginBottom: '0.35rem'
                }}
              >
                Intelligent Assistant
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                PulseBot AI
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#e0f2fe', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
                Powered by Google Gemini Pro & Multi-Sheet Real-Time Sync
              </p>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div style={{ padding: '0.85rem 1.75rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>AI Status: Online & Grounded</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
            <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
            <span>8 Linked Sheets (Read-Only)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
            <span>Accessory SQL: Linked (newdata)</span>
          </div>
        </div>

        {/* Linked Google Sheets Card */}
        <div style={{ padding: '1rem 1.75rem 0.4rem 1.75rem' }}>
          <div
            style={{
              background: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #bbf7d0',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileSpreadsheet style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                <strong style={{ fontSize: '0.84rem', color: '#166534' }}>
                  Linked Google Sheets Hub (8 Tabs)
                </strong>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#475569', margin: '3px 0 0 0' }}>
                Index Cutting Authority, Roll Details (20k+ rows), Cancelled Lots, Design Images.
              </p>
            </div>

            {onOpenLinkedSheets && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLinkedSheets();
                }}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                }}
              >
                <span>Manage Hub</span>
                <ArrowRight style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Linked Accessory Software Database Card */}
        <div style={{ padding: '0.4rem 1.75rem 0.5rem 1.75rem' }}>
          <div
            style={{
              background: '#faf5ff',
              borderRadius: '12px',
              border: '1px solid #e9d5ff',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>⚖️</span>
                <strong style={{ fontSize: '0.84rem', color: '#6b21a8' }}>
                  Accessory Software SQL Database (Live)
                </strong>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#475569', margin: '3px 0 0 0' }}>
                Secondary SQL link to <strong>weight_capture</strong> (gross/tare), <strong>materials</strong> inventory, <strong>issue_logs</strong>, and trims (zip & dori).
              </p>
            </div>
            <span
              style={{
                background: '#7c3aed',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              🟢 Live SQL
            </span>
          </div>
        </div>

        {/* Capabilities list */}
        <div style={{ padding: '0.75rem 1.75rem 1.5rem 1.75rem' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Core AI Capabilities
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#f0f9ff', padding: '0.75rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
              <Zap style={{ width: '16px', height: '16px', color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#0369a1', display: 'block' }}>Live Cutting Status & Lot Intelligence</strong>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Verified against Index Sheet (sole authority for Cut vs Pending) with instant karigar & fabric details.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#fdf4ff', padding: '0.75rem', borderRadius: '10px', border: '1px solid #f5d0fe' }}>
              <span style={{ fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}>🧵</span>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#a21caf', display: 'block' }}>Accessory & Weigh-In Ground Truth</strong>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Real-time scale weight (gross/tare/net), weight per piece, issue logs by supervisor, and trim inventory cross-checked by lot number.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#faf5ff', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#7c3aed', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#6b21a8', display: 'block' }}>100% Pure Black & White Printable PDFs</strong>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Generated strictly upon your explicit voice/text command with zero color ink waste.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#fffbeb', padding: '0.75rem', borderRadius: '10px', border: '1px solid #fef3c7' }}>
              <ShieldCheck style={{ width: '16px', height: '16px', color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#92400e', display: 'block' }}>Strict Read-Only Guarantee</strong>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>All linked Google Sheets are fetched via read-only GET requests with zero push or overwrite risk.</span>
              </div>
            </div>
          </div>
        </div>


        {/* Footer */}
        <div style={{ padding: '1rem 1.75rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.82rem' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
