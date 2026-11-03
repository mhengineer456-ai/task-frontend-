import React from 'react';
import {
  Plus,
  Lock,
  CircleDot
} from 'lucide-react';
import { useTaskContext } from '../../context/TaskContext';
import StatusListPane from './StatusListPane';
import StatusCreatorModal from './StatusCreatorModal';
import StatusViewerModal from './StatusViewerModal';
import StatusPrivacyModal from './StatusPrivacyModal';

export default function StatusPage({ onBackToChats }) {
  const {
    isStatusCreatorOpen,
    setIsStatusCreatorOpen,
    isStatusPrivacyOpen,
    setIsStatusPrivacyOpen
  } = useTaskContext();

  return (
    <div
      className="whatsapp-status-layout"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-main)'
      }}
    >
      {/* LEFT PANE: WhatsApp Web Status Sidebar */}
      <div
        className="whatsapp-status-sidebar"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-sidebar)',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <StatusListPane onBack={onBackToChats} />
      </div>

      {/* RIGHT PANE: WhatsApp Web Status Desktop Empty Stage / Placeholder */}
      <div
        className="whatsapp-status-stage-pane"
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          padding: '24px',
          textAlign: 'center',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          {/* Status Rings Illustration Icon with WhatsApp Green ring */}
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '3px solid #25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              boxShadow: '0 8px 30px rgba(37, 211, 102, 0.15)'
            }}
          >
            <CircleDot size={44} style={{ color: '#25D366' }} />
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '6px 0 0 0',
              letterSpacing: '-0.02em'
            }}
          >
            Click on a contact to view their status update
          </h3>

          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            Status updates let you share text, photos, and videos that automatically disappear after 24 hours.
          </p>

          <button
            type="button"
            onClick={() => setIsStatusCreatorOpen(true)}
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '24px',
              background: '#25D366',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              transition: 'all 0.18s ease'
            }}
            className="whatsapp-create-status-btn"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create Status</span>
          </button>

          {/* End-to-end encryption / Privacy Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              marginTop: '32px'
            }}
          >
            <Lock size={12} />
            <span>Your status updates are end-to-end encrypted</span>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <StatusCreatorModal
        isOpen={isStatusCreatorOpen}
        onClose={() => setIsStatusCreatorOpen(false)}
      />
      <StatusViewerModal />
      <StatusPrivacyModal
        isOpen={isStatusPrivacyOpen}
        onClose={() => setIsStatusPrivacyOpen(false)}
      />
    </div>
  );
}
