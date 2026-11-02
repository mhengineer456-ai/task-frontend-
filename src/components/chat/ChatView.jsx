import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { formatDate, getTimeAgo } from '../../utils/dateUtils';
import { BASE_URL } from '../../api/apiClient';
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  User,
  Bot,
  Hash,
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  Search,
  CheckCircle2,
  Shield,
  Briefcase,
  X,
  Maximize2,
  ExternalLink,
  Mic,
  MicOff,
  Trash2,
  Smile,
  FileText,
  File,
  Download,
  Phone,
  Video,
  MoreVertical,
  Music,
  Plus,
  Info,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
  AtSign,
  Zap,
  ArrowLeft
} from 'lucide-react';
import AudioPlayerBubble from './AudioPlayerBubble';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import CreateGroupModal from './CreateGroupModal';
import GroupInfoModal from './GroupInfoModal';
import AiAssistantInfoModal from './AiAssistantInfoModal';
import LinkedSheetsModal from './LinkedSheetsModal';
import ProductionTrackingCard from './ProductionTrackingCard';
import AiTaskDelegationCard from './AiTaskDelegationCard';
import { extractTrackingData, splitMessageIntroAndNotes } from '../../utils/trackingDataParser';

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🤔', '🤫', '🙄',
  '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '🙏', '💪',
  '🔥', '✨', '🎉', '🚀', '💯', '❤️', '🧡', '💛', '💚', '💙',
  '💜', '🖤', '💔', '⭐', '⚡', '💡', '📌', '📎', '✅', '⚠️'
];

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];

// Helper to extract PDF attachment info from message object or text
const extractPdfInfo = (msg) => {
  if (msg?.pdfAttachment) return msg.pdfAttachment;
  if (msg?.fileAttachment?.downloadUrl) return msg.fileAttachment;
  if (!msg?.text) return null;

  // 1. Check for Party Lots Report PDF link
  const partyMatch = msg.text.match(/\[(.*?)\]\((https?:\/\/[^\s)]+\/api\/chat\/pdf\/party\/([^\s)]+)|.*?\/api\/chat\/pdf\/party\/([^\s)]+))\)/i);
  if (partyMatch) {
    const rawPartySlug = decodeURIComponent(partyMatch[3] || partyMatch[4] || 'SS_Party');
    const cleanPartyTitle = rawPartySlug.replace(/_/g, ' ');
    return {
      type: 'party',
      partyName: cleanPartyTitle,
      downloadUrl: `${BASE_URL}/chat/pdf/party/${encodeURIComponent(rawPartySlug)}`,
      filename: `${rawPartySlug}_Lots_Report.pdf`,
      title: `${cleanPartyTitle} - Complete Lots & Cutting Report`
    };
  }

  // 2. Check for Single Lot Job Order PDF link
  const linkMatch = msg.text.match(/\[(.*?)\]\((https?:\/\/[^\s)]+\/api\/chat\/pdf\/(\d+)|.*?\/api\/chat\/pdf\/(\d+))\)/);
  if (linkMatch) {
    const lotNum = linkMatch[3] || linkMatch[4] || '11028';
    return {
      lotNumber: lotNum,
      jobOrderNo: lotNum === '11029' ? 'JO-2' : 'JO-1',
      downloadUrl: `${BASE_URL}/chat/pdf/${lotNum}`,
      filename: `JobOrder_${lotNum === '11029' ? 'JO-2' : 'JO-1'}_Lot_${lotNum}.pdf`,
      title: `Job Order & Production Slip (${lotNum === '11029' ? 'JO-2' : 'JO-1'} • Lot ${lotNum})`
    };
  }
  return null;
};

// Helper to convert Google Drive links to direct previewable CDN URLs or backend proxy
const getDirectImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  const driveMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `${BASE_URL}/chat/image-proxy?id=${driveMatch[1]}`;
  }
  if (trimmed.includes('googleusercontent.com') && !trimmed.includes('image-proxy')) {
    return `${BASE_URL}/chat/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
};

// Helper to determine if a URL or link is an image
const isImageUrl = (url, linkText = '') => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!/^(https?:\/\/|\/api\/|data:image\/)/i.test(trimmed)) return false;
  if (/drive\.google\.com|googleusercontent\.com|image-proxy/i.test(trimmed)) return true;
  if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(trimmed)) return true;
  if (/\b(artwork|design|photo|image|view artwork|download image|slip image|picture)\b/i.test(linkText)) return true;
  return false;
};

// Helper to extract image information from message
const extractImageInfo = (msg) => {
  const isValidUrl = (u) => Boolean(u && typeof u === 'string' && /^(https?:\/\/|\/api\/|data:image\/)/i.test(u.trim()));

  if (msg?.imageAttachment) {
    const raw = msg.imageAttachment.url || msg.imageAttachment.downloadUrl;
    if (isValidUrl(raw)) {
      return {
        url: getDirectImageUrl(raw),
        rawUrl: raw,
        lotNumber: msg.imageAttachment.lotNumber,
        title: msg.imageAttachment.title || (msg.imageAttachment.lotNumber ? `Design Artwork (Lot ${msg.imageAttachment.lotNumber})` : 'Design Artwork')
      };
    }
  }
  if (msg?.fileAttachment?.imageAttachment) {
    const img = msg.fileAttachment.imageAttachment;
    if (isValidUrl(img?.url)) {
      return {
        url: getDirectImageUrl(img.url),
        rawUrl: img.url,
        lotNumber: img.lotNumber,
        title: img.title || 'Design Artwork'
      };
    }
  }
  if (!msg?.text) return null;

  // Check for markdown image ![alt](url)
  const imgMd = msg.text.match(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)/);
  if (imgMd && isValidUrl(imgMd[2])) {
    return {
      url: getDirectImageUrl(imgMd[2]),
      rawUrl: imgMd[2],
      title: imgMd[1] || 'Design Artwork'
    };
  }

  // Check for [View Artwork](url) or [Artwork](url)
  const artworkLink = msg.text.match(/\[(?:View\s*Artwork|Artwork|Design\s*Image|Image|Photo)\]\((https?:\/\/[^\s)]+)\)/i);
  if (artworkLink && isValidUrl(artworkLink[1])) {
    return {
      url: getDirectImageUrl(artworkLink[1]),
      rawUrl: artworkLink[1],
      title: 'Design Artwork & Style Reference'
    };
  }

  return null;
};

// Helper to extract image gallery from message
const extractImageGallery = (msg) => {
  if (Array.isArray(msg?.imageGallery) && msg.imageGallery.length > 0) {
    return msg.imageGallery;
  }
  if (Array.isArray(msg?.fileAttachment?.imageGallery) && msg.fileAttachment.imageGallery.length > 0) {
    return msg.fileAttachment.imageGallery;
  }
  return null;
};

// Inline Image Viewer component
const ChatInlineImage = ({ src, alt, title, onExpand, isSelf }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermanentlyFailed, setIsPermanentlyFailed] = useState(false);

  // Validate that src is a valid HTTP/API URL
  if (!src || typeof src !== 'string' || !/^(https?:\/\/|\/api\/|data:image\/)/i.test(src.trim()) || isPermanentlyFailed) {
    return null;
  }

  const directSrc = getDirectImageUrl(src);
  const proxySrc = `${BASE_URL}/chat/image-proxy?url=${encodeURIComponent(src)}`;
  const currentSrc = hasError ? proxySrc : directSrc;

  return (
    <div
      style={{
        margin: '0.65rem 0',
        display: 'inline-block',
        maxWidth: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: isSelf ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid #cbd5e1',
        background: isSelf ? 'rgba(0,0,0,0.2)' : '#ffffff',
        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        cursor: 'pointer'
      }}
      onClick={() => onExpand && onExpand(currentSrc, title || alt || 'Design Artwork')}
      title="Click to view full size"
    >
      <div
        style={{
          position: 'relative',
          minWidth: '220px',
          minHeight: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc'
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            <span>Loading image...</span>
          </div>
        )}
        <img
          src={currentSrc}
          alt={alt || 'Design Artwork'}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (!hasError) {
              setHasError(true);
            } else {
              setIsPermanentlyFailed(true);
              setIsLoading(false);
            }
          }}
          style={{
            maxWidth: '380px',
            maxHeight: '320px',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
      <div
        style={{
          padding: '6px 12px',
          background: isSelf ? 'rgba(0,0,0,0.3)' : '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelf ? '#ffffff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🎨</span> {title || alt || 'Design Artwork & Style'}
        </span>
        <span style={{ fontSize: '0.68rem', color: isSelf ? 'rgba(255,255,255,0.85)' : '#0284c7', fontWeight: 600 }}>
          🔍 Click to expand
        </span>
      </div>
    </div>
  );
};

// Multi-Image Gallery component for party / uncut lots photo collections
const ChatImageGallery = ({ gallery, onImageClick, isSelf }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!gallery || !Array.isArray(gallery) || gallery.length === 0) return null;

  // Extract unique garments
  const categories = ['ALL', ...new Set(gallery.map(g => (g.garment || 'Garment').toUpperCase()))];

  const filtered = gallery.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || (item.garment || '').toUpperCase() === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      String(item.lotNumber || '').includes(term) ||
      String(item.jobOrder || '').toLowerCase().includes(term) ||
      String(item.garment || '').toLowerCase().includes(term) ||
      String(item.style || '').toLowerCase().includes(term) ||
      String(item.fabric || '').toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });

  return (
    <div
      style={{
        marginTop: '0.85rem',
        marginBottom: '0.65rem',
        borderRadius: '16px',
        background: isSelf ? 'rgba(0, 0, 0, 0.25)' : '#ffffff',
        border: isSelf ? '1.5px solid rgba(255, 255, 255, 0.35)' : '1.5px solid #cbd5e1',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          padding: '10px 16px',
          background: isSelf ? 'rgba(255, 255, 255, 0.12)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📸</span>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
            Official Design Artwork Gallery ({gallery.length} Designs)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.22)', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
            {filtered.length} of {gallery.length} Lots
          </span>
        </div>
      </div>

      {/* Filter Tabs & Quick Search */}
      <div
        style={{
          padding: '8px 14px',
          background: isSelf ? 'rgba(0, 0, 0, 0.18)' : '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {categories.map(cat => {
            const count = cat === 'ALL' ? gallery.length : gallery.filter(g => (g.garment || '').toUpperCase() === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
                style={{
                  border: 'none',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected
                    ? (isSelf ? '#ffffff' : '#0284c7')
                    : (isSelf ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'),
                  color: isSelected
                    ? (isSelf ? '#0284c7' : '#ffffff')
                    : (isSelf ? '#ffffff' : '#475569')
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Filter by lot/fabric..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            width: '150px',
            outline: 'none',
            background: isSelf ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
            color: '#0f172a'
          }}
        />
      </div>

      {/* Responsive Cards Grid */}
      <div
        style={{
          maxHeight: '520px',
          overflowY: 'auto',
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          gap: '14px',
          background: isSelf ? 'transparent' : '#f1f5f9'
        }}
      >
        {filtered.map((item, idx) => (
          <div
            key={`gallery-card-${item.lotNumber}-${idx}`}
            onClick={() => onImageClick && onImageClick(getDirectImageUrl(item.url), item.title || `Lot ${item.lotNumber}`)}
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 132, 199, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            title="Click to view full size in Lightbox"
          >
            {/* Image Preview Container */}
            <div
              style={{
                position: 'relative',
                height: '140px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src={getDirectImageUrl(item.url)}
                alt={item.title || `Lot ${item.lotNumber}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = `${BASE_URL}/chat/image-proxy?url=${encodeURIComponent(item.url)}`;
                  if (e.target.src !== fallback) {
                    e.target.src = fallback;
                  }
                }}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '6px'
                }}
              >
                Lot {item.lotNumber}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  background: 'rgba(2, 132, 199, 0.92)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}
              >
                {item.jobOrder || ''}
              </div>
            </div>

            {/* Lot Details Bottom Bar */}
            <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.garment || 'Garment'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Style: <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.style || 'Standard'}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Fabric: <span style={{ fontWeight: 700, color: '#0284c7' }}>{item.fabric || 'Standard'}</span>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', fontSize: '0.65rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Qty: {item.qty || '1 Lot'}</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>🔍 Full Size</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper to parse inline tokens: links, images, code badges (bar graphs), and bold text
const formatInlineTokens = (line, isSelf, onImageClick = null, suppressImages = false) => {
  if (!line) return null;

  // 1. Process links and images: [text](url) or ![text](url)
  const tokenRegex = /(!)?\[(.*?)\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    const isImgToken = match[1] === '!';
    const tokenText = match[2];
    const tokenUrl = match[3];

    if (isImgToken || isImageUrl(tokenUrl, tokenText)) {
      if (!suppressImages) {
        parts.push(
          <span key={`img-${match.index}`} style={{ display: 'inline-block', margin: '4px 0', verticalAlign: 'middle' }}>
            <ChatInlineImage
              src={tokenUrl}
              alt={tokenText}
              title={tokenText}
              isSelf={isSelf}
              onExpand={onImageClick}
            />
          </span>
        );
      }
    } else {
      const isPdf = tokenUrl.includes('/pdf/');
      parts.push(
        <a
          key={`link-${match.index}`}
          href={tokenUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isSelf ? '#ffffff' : '#0284c7',
            fontWeight: 800,
            textDecoration: 'underline',
            display: isPdf ? 'inline-flex' : 'inline',
            alignItems: 'center',
            gap: '4px',
            background: isPdf ? (isSelf ? 'rgba(255,255,255,0.2)' : '#e0f2fe') : 'transparent',
            padding: isPdf ? '2px 8px' : '0',
            borderRadius: isPdf ? '6px' : '0'
          }}
        >
          {tokenText}
        </a>
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  // 2. Process inline code / progress bar badges: `code`
  const withCode = parts.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const codeSegments = part.split(/(`[^`]+`)/g);
    return codeSegments.map((seg, cIdx) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        const codeContent = seg.slice(1, -1);
        return (
          <span
            key={`c-${pIdx}-${cIdx}`}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '11px',
              letterSpacing: '1px',
              padding: '2px 6px',
              margin: '0 3px',
              borderRadius: '4px',
              background: isSelf ? 'rgba(0,0,0,0.35)' : '#0f172a',
              color: isSelf ? '#7dd3fc' : '#38bdf8',
              display: 'inline-block',
              verticalAlign: 'baseline',
              fontWeight: 700,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            {codeContent}
          </span>
        );
      }
      return seg;
    });
  });

  // 3. Process bold text: **bold**
  const withBold = withCode.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const boldSegments = part.split(/(\*\*.*?\*\*)/g);
    return boldSegments.map((seg, sIdx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={`b-${pIdx}-${sIdx}`} style={{ fontWeight: 800 }}>{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });
  });

  return withBold;
};

// Formatter to render clean markdown with styled HTML tables, bold, clickable links, headers, and bar graphs
const renderFormattedMessageText = (text, isSelf, onImageClick, suppressImages = false) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const isTableLine = (str) => {
    const t = str.trim();
    return t.startsWith('|') && t.endsWith('|') && t.split('|').length >= 3;
  };

  const isTableSeparator = (str) => {
    const t = str.trim();
    return t.startsWith('|') && t.endsWith('|') && /^\|[-:\s|]+\|$/.test(t);
  };

  while (i < lines.length) {
    const line = lines[i];

    // Detect Markdown Table: Starts with | and followed by separator |---|---|
    if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerLine = line;
      i += 2; // Skip header and separator to reach body rows

      const parseRow = (r) => {
        const trimmed = r.trim();
        const core = trimmed.replace(/^\|/, '').replace(/\|$/, '');
        return core.split('|').map(cell => cell.trim());
      };

      const headers = parseRow(headerLine);
      const rows = [];

      while (i < lines.length && isTableLine(lines[i])) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      elements.push(
        <div
          key={`tbl-${elements.length}`}
          style={{
            overflowX: 'auto',
            margin: '10px 0',
            borderRadius: '10px',
            border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #cbd5e1',
            background: isSelf ? 'rgba(0,0,0,0.16)' : '#ffffff',
            boxShadow: isSelf ? 'none' : '0 1px 4px rgba(0,0,0,0.06)'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12.5px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr
                style={{
                  background: isSelf ? 'rgba(255,255,255,0.14)' : '#f8fafc',
                  borderBottom: isSelf ? '2px solid rgba(255,255,255,0.25)' : '2px solid #cbd5e1'
                }}
              >
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    style={{
                      padding: '8px 12px',
                      fontWeight: 800,
                      color: isSelf ? '#ffffff' : '#0f172a',
                      whiteSpace: 'nowrap',
                      borderRight: isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9'
                    }}
                  >
                    {formatInlineTokens(h, isSelf, onImageClick, suppressImages)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((rowCells, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    background: rIdx % 2 === 0
                      ? 'transparent'
                      : (isSelf ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                    borderBottom: isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9'
                  }}
                >
                  {rowCells.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: '7px 12px',
                        color: isSelf ? '#f8fafc' : '#1e293b',
                        whiteSpace: 'nowrap',
                        borderRight: isSelf ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f8fafc'
                      }}
                    >
                      {formatInlineTokens(cell, isSelf, onImageClick, suppressImages)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Suppress Zip, Dori, and Trims tracking sections per user directive
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('zip procurement') ||
      lowerLine.includes('zip entry') ||
      lowerLine.includes('dori order') ||
      lowerLine.includes('trims & material procurement')
    ) {
      i++;
      // Skip subsequent bullet lines until next section or divider
      while (i < lines.length && !lines[i].startsWith('#') && !/^[-*_]{3,}\s*$/.test(lines[i].trim())) {
        i++;
      }
      continue;
    }

    // Horizontal Rule: ---, ***, ___
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            border: 'none',
            borderTop: isSelf ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
            margin: '10px 0',
            width: '100%'
          }}
        />
      );
      i++;
      continue;
    }

    // Markdown Headers: #### Header (e.g. #### 3. Stitching Department)
    if (line.startsWith('#### ')) {
      const cleanH4 = line.replace(/^####\s+/, '');
      elements.push(
        <div
          key={`h4-${i}`}
          style={{
            fontSize: '13px',
            fontWeight: 800,
            margin: '10px 0 5px 0',
            color: isSelf ? '#ffffff' : '#0369a1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: isSelf ? 'rgba(255,255,255,0.12)' : '#f0f9ff',
            border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #bae6fd',
            boxShadow: isSelf ? 'none' : '0 1px 3px rgba(2, 132, 199, 0.08)'
          }}
        >
          <span>🔹</span>
          <span>{formatInlineTokens(cleanH4, isSelf, onImageClick, suppressImages)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Markdown Headers: ### Header
    if (line.startsWith('### ')) {
      elements.push(
        <div
          key={`h3-${i}`}
          style={{
            fontSize: '14.5px',
            fontWeight: 800,
            margin: '10px 0 4px 0',
            color: isSelf ? '#ffffff' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {formatInlineTokens(line.replace(/^###\s+/, ''), isSelf, onImageClick, suppressImages)}
        </div>
      );
      i++;
      continue;
    }

    // Markdown Headers: ## Header
    if (line.startsWith('## ')) {
      elements.push(
        <div
          key={`h2-${i}`}
          style={{
            fontSize: '15.5px',
            fontWeight: 800,
            margin: '12px 0 6px 0',
            color: isSelf ? '#ffffff' : '#0f172a'
          }}
        >
          {formatInlineTokens(line.replace(/^##\s+/, ''), isSelf, onImageClick, suppressImages)}
        </div>
      );
      i++;
      continue;
    }

    // Markdown Headers: # Header
    if (line.startsWith('# ')) {
      elements.push(
        <div
          key={`h1-${i}`}
          style={{
            fontSize: '16.5px',
            fontWeight: 900,
            margin: '14px 0 6px 0',
            color: isSelf ? '#ffffff' : '#0f172a'
          }}
        >
          {formatInlineTokens(line.replace(/^#\s+/, ''), isSelf, onImageClick, suppressImages)}
        </div>
      );
      i++;
      continue;
    }

    // Smart Bullet Points & Key-Value Status Badges
    if (/^\s*[*•-]\s+/.test(line)) {
      const cleanLine = line.replace(/^\s*[*•-]\s+/, '');
      const kvMatch = cleanLine.match(/^([^:]+):\s*(.+)$/);

      if (kvMatch) {
        const rawKey = kvMatch[1].trim();
        const rawVal = kvMatch[2].trim();
        const lowerKey = rawKey.toLowerCase();
        const isStatus = lowerKey.includes('status');
        const isSupervisor = lowerKey.includes('supervisor');
        const isQuantity = lowerKey.includes('quantity') || lowerKey.includes('qty') || lowerKey.includes('pcs');
        const isDate = lowerKey.includes('date');

        elements.push(
          <div
            key={`li-kv-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              margin: '3px 0',
              lineHeight: '1.4',
              fontSize: '0.84rem'
            }}
          >
            <span style={{ fontWeight: 800, color: isSelf ? 'rgba(255,255,255,0.92)' : '#475569', minWidth: '85px' }}>
              {isDate ? '📅 ' : isSupervisor ? '👤 ' : isQuantity ? '📦 ' : isStatus ? '⚡ ' : '• '}
              {rawKey}:
            </span>

            {isStatus ? (
              /complete|packed|registered|✓/i.test(rawVal) ? (
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '12px', padding: '2px 8px', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  {rawVal}
                </span>
              ) : /wip|progress|ongoing/i.test(rawVal) ? (
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', borderRadius: '12px', padding: '2px 8px', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  ⏳ {rawVal}
                </span>
              ) : (
                <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '12px', padding: '2px 8px', fontWeight: 800, fontSize: '0.78rem' }}>
                  {rawVal}
                </span>
              )
            ) : isQuantity ? (
              <span style={{ background: isSelf ? 'rgba(255,255,255,0.18)' : '#f1f5f9', color: isSelf ? '#ffffff' : '#0f172a', border: isSelf ? '1px solid rgba(255,255,255,0.3)' : '1px solid #cbd5e1', borderRadius: '6px', padding: '1px 8px', fontWeight: 800, fontSize: '0.8rem' }}>
                {rawVal}
              </span>
            ) : isSupervisor ? (
              <span style={{ background: isSelf ? 'rgba(255,255,255,0.15)' : '#f0f9ff', color: isSelf ? '#ffffff' : '#0369a1', border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #bae6fd', borderRadius: '6px', padding: '1px 8px', fontWeight: 700, fontSize: '0.8rem' }}>
                {rawVal}
              </span>
            ) : (
              <span style={{ color: isSelf ? '#ffffff' : '#1e293b', fontWeight: 600 }}>
                {formatInlineTokens(rawVal, isSelf, onImageClick, suppressImages)}
              </span>
            )}
          </div>
        );
        i++;
        continue;
      }

      elements.push(
        <div
          key={`li-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            margin: '3px 0',
            lineHeight: '1.5'
          }}
        >
          <span style={{ color: isSelf ? 'rgba(255,255,255,0.7)' : '#0284c7', fontWeight: 800, minWidth: '10px' }}>•</span>
          <div style={{ flex: 1 }}>
            {formatInlineTokens(cleanLine, isSelf, onImageClick, suppressImages)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph or empty line
    elements.push(
      <div
        key={`line-${i}`}
        style={{
          minHeight: line.trim() === '' ? '0.45rem' : 'auto',
          lineHeight: '1.5',
          fontStyle: /^\*.*\*$/.test(line.trim()) ? 'italic' : 'normal',
          opacity: /^\*.*\*$/.test(line.trim()) ? 0.92 : 1
        }}
      >
        {formatInlineTokens(line, isSelf, onImageClick, suppressImages)}
      </div>
    );
    i++;
  }

  return elements;
};

export default function ChatView() {
  const {
    chatChannels = [],
    chatMessages = {},
    activeChannelId,
    setActiveChannelId,
    sendChatMessage,
    startDirectChat,
    activeUser,
    users = [],
    tasks = [],
    setSelectedTaskId,
    isAiTyping,
    typingUsers = {},
    sendTypingStatus,
    reactToMessage,
    setViewingUserProfile,
    chatPagination = {},
    loadMoreMessages
  } = useTaskContext();

  const [messageInput, setMessageInput] = useState('');
  const [selectedTaskAttach, setSelectedTaskAttach] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { dataUrl, name, size }
  const [selectedFile, setSelectedFile] = useState(null); // { dataUrl, name, size, type }
  const [previewImage, setPreviewImage] = useState(null); // Lightbox dataUrl
  const [filterQuery, setFilterQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState('all'); // 'all' | 'team' | 'channels'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isAiInfoOpen, setIsAiInfoOpen] = useState(false);
  const [isLinkedSheetsOpen, setIsLinkedSheetsOpen] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [taggedUser, setTaggedUser] = useState(null);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [requireEaFollowup, setRequireEaFollowup] = useState(false);
  const [mobileActivePane, setMobileActivePane] = useState('roster');

  const messagesContainerRef = useRef(null);
  const isAutoScrollEnabled = useRef(true);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);
  const tagMenuRef = useRef(null);

  // Voice recording hook
  const {
    isRecording,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording,
    error: voiceError
  } = useVoiceRecorder();

  const activeChannel = chatChannels.find(c => c.id === activeChannelId) || chatChannels[0] || { id: 'chan-ai', name: 'PulseBot AI' };
  const rawChannelMessages = chatMessages[activeChannelId] || [];
  const channelMessages = rawChannelMessages.filter((msg, idx, arr) => {
    const firstById = arr.findIndex(m => m.id === msg.id);
    if (firstById !== idx) return false;

    const earlierTwin = arr.slice(0, idx).find(m =>
      String(m.senderId) === String(msg.senderId) &&
      (m.text || '').trim() === (msg.text || '').trim() &&
      JSON.stringify(m.taskAttachment || null) === JSON.stringify(msg.taskAttachment || null) &&
      JSON.stringify(m.fileAttachment || null) === JSON.stringify(msg.fileAttachment || null) &&
      (m.imageUrl || null) === (msg.imageUrl || null) &&
      (m.audioUrl || null) === (msg.audioUrl || null) &&
      Math.abs(new Date(m.timestamp || 0).getTime() - new Date(msg.timestamp || 0).getTime()) < 10000
    );
    return !earlierTwin;
  });
  const currentTypers = (typingUsers && typingUsers[activeChannelId]) ? typingUsers[activeChannelId].filter(u => u !== activeUser?.name) : [];

  // Robust resolver for direct chat contact to view their profile like WhatsApp
  const getDirectChatUser = (channel = activeChannel) => {
    if (!channel) return null;

    // 1. DM channel id convention: dm-user1-user2 (deterministic & highest priority)
    if (channel.id && typeof channel.id === 'string' && channel.id.startsWith('dm-')) {
      const parts = channel.id.replace('dm-', '').split('-');
      const otherId = parts.find(part => String(part) !== String(activeUser?.id));
      if (otherId) {
        const found = users.find(u => String(u.id) === String(otherId));
        if (found) return found;
      }
    }

    // 2. Member list / participant IDs excluding the logged in user
    if (channel.participantIds && Array.isArray(channel.participantIds)) {
      const otherId = channel.participantIds.find(id => String(id) !== String(activeUser?.id));
      if (otherId) {
        const found = users.find(u => String(u.id) === String(otherId));
        if (found) return found;
      }
    }

    // 3. Direct targetUser payload attached to channel (ensuring it is not the active user)
    if (channel.targetUser?.id && String(channel.targetUser.id) !== String(activeUser?.id)) {
      const found = users.find(u => String(u.id) === String(channel.targetUser.id));
      if (found) return found;
      return channel.targetUser;
    }

    // 4. Exact matching by channel name against user roster (excluding the active user)
    if (channel.name && channel.name.trim().toLowerCase() !== activeUser?.name?.trim().toLowerCase()) {
      const trimmed = channel.name.trim().toLowerCase();
      const match = users.find(u => u.name && u.name.trim().toLowerCase() === trimmed && String(u.id) !== String(activeUser?.id));
      if (match) return match;
    }

    // 5. Partial name substring fallback (excluding the active user)
    if (channel.name && channel.name.trim().toLowerCase() !== activeUser?.name?.trim().toLowerCase()) {
      const matchPartial = users.find(u =>
        String(u.id) !== String(activeUser?.id) &&
        u.name && (
          channel.name.toLowerCase().includes(u.name.toLowerCase()) ||
          u.name.toLowerCase().includes(channel.name.toLowerCase())
        )
      );
      if (matchPartial) return matchPartial;
    }

    return null;
  };

  const isDirectChat = activeChannel.type === 'direct' || (typeof activeChannel.id === 'string' && activeChannel.id.startsWith('dm-'));
  const directContact = isDirectChat ? getDirectChatUser(activeChannel) : null;

  const chatDisplayName = directContact ? directContact.name : activeChannel.name;
  const chatDisplayAvatar = directContact ? directContact.avatar : activeChannel.avatar;
  const chatDisplayRole = directContact
    ? `${directContact.role} • ${directContact.department || 'Team'}`
    : (activeChannel.roleBadge || activeChannel.description || 'Active Channel');

  // WhatsApp-Style click handler for active chat header
  const handleHeaderClick = () => {
    if (isDirectChat) {
      const target = directContact || getDirectChatUser(activeChannel);
      if (target && target.id && setViewingUserProfile) {
        setViewingUserProfile(target.id);
      } else {
        // Fallback: if name matches any user other than active user
        const fallback = users.find(u => String(u.id) !== String(activeUser?.id) && u.name?.toLowerCase().includes(chatDisplayName?.toLowerCase()));
        if (fallback && setViewingUserProfile) {
          setViewingUserProfile(fallback.id);
        }
      }
    } else if (activeChannel.type === 'group' || activeChannel.type === 'public') {
      setIsGroupInfoOpen(true);
    } else if (activeChannel.type === 'ai') {
      setIsAiInfoOpen(true);
    }
  };

  const isPrependingRef = useRef(false);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };

  const handleScroll = async () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 120;
    isAutoScrollEnabled.current = nearBottom;
    setIsAtBottom(nearBottom);

    // WhatsApp-style Reverse Infinite Scroll: Load older messages when scrolling to top (scrollTop < 70)
    const pagination = chatPagination[activeChannelId] || {};
    if (scrollTop < 70 && pagination.hasMore && !pagination.isLoadingMore && !isPrependingRef.current) {
      isPrependingRef.current = true;
      const prevScrollHeight = scrollHeight;
      const prevScrollTop = scrollTop;

      await loadMoreMessages(activeChannelId);

      // Preserve exact scroll position so user doesn't jump
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        }
        setTimeout(() => {
          isPrependingRef.current = false;
        }, 120);
      });
    }
  };

  const handleLoadMoreManual = async () => {
    if (!messagesContainerRef.current) return;
    isPrependingRef.current = true;
    const prevScrollHeight = messagesContainerRef.current.scrollHeight;

    await loadMoreMessages(activeChannelId);

    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        const newScrollHeight = messagesContainerRef.current.scrollHeight;
        messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
      }
      setTimeout(() => {
        isPrependingRef.current = false;
      }, 120);
    });
  };

  // Always jump to bottom when changing channels
  useEffect(() => {
    isAutoScrollEnabled.current = true;
    setIsAtBottom(true);
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 40);
    return () => clearTimeout(timer);
  }, [activeChannelId]);

  // Only auto-scroll on new messages if user was already at the bottom and not prepending older messages
  useEffect(() => {
    if (isPrependingRef.current) return;
    if (isAutoScrollEnabled.current) {
      scrollToBottom('smooth');
    }
  }, [channelMessages.length, selectedImage, selectedFile]);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target)) {
        setShowTagMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);

    if (sendTypingStatus && activeUser?.name) {
      sendTypingStatus(activeChannelId, activeUser.name, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTypingStatus(activeChannelId, activeUser.name, false);
      }, 1500);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, GIF, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        dataUrl: event.target.result,
        name: file.name,
        size: Math.round(file.size / 1024)
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        dataUrl: event.target.result,
        name: file.name,
        size: Math.round(file.size / 1024),
        type: file.type || 'document'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleAudioFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      sendChatMessage(
        activeChannelId,
        '',
        null,
        null,
        event.target.result,
        null
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleSendVoiceNote = async () => {
    try {
      const result = await stopRecording();
      if (result && result.dataUrl) {
        sendChatMessage(activeChannelId, '', null, null, result.dataUrl, null);
        isAutoScrollEnabled.current = true;
        setIsAtBottom(true);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessageInput(prev => prev + emoji);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedTaskAttach && !selectedImage && !selectedFile) return;

    if (sendTypingStatus && activeUser?.name) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      sendTypingStatus(activeChannelId, activeUser.name, false);
    }

    sendChatMessage(
      activeChannelId,
      messageInput,
      selectedTaskAttach || null,
      selectedImage ? selectedImage.dataUrl : null,
      null, // audioUrl
      selectedFile ? selectedFile : null, // fileAttachment
      taggedUser ? taggedUser.id : null,
      requireEaFollowup
    );

    setMessageInput('');
    setSelectedTaskAttach('');
    setTaggedUser(null);
    setRequireEaFollowup(false);
    setSelectedImage(null);
    setSelectedFile(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setShowTagMenu(false);
    isAutoScrollEnabled.current = true;
    setIsAtBottom(true);
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  const handleQuickAiPrompt = (promptText) => {
    sendChatMessage('chan-ai', promptText);
    isAutoScrollEnabled.current = true;
    setIsAtBottom(true);
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  // Filter channels & team members
  const filteredChannels = chatChannels.filter(c =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (c.roleBadge && c.roleBadge.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const teamMembers = users.filter(u => u.id !== activeUser?.id);
  const filteredTeamMembers = teamMembers.filter(u =>
    u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(filterQuery.toLowerCase())) ||
    (u.department && u.department.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div
      className="chat-outer-wrapper"
      style={{
        display: 'flex',
        height: '100%',
        maxHeight: '100%',
        width: '100%',
        maxWidth: '1650px',
        margin: '0 auto',
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div className="chat-main-container">
        {/* Sidebar Channels & Team Members Roster */}
        <div
          className={`glass-panel chat-roster-pane ${mobileActivePane === 'chat' ? 'chat-pane-hidden-mobile' : ''}`}
          style={{
            height: '100%',
            minHeight: 0,
            borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0
          }}
        >
        {/* Header & Search */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-sidebar)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare style={{ width: '20px', height: '20px', color: '#0284c7' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>TaskPulse Messenger</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title="Create a new team group"
              >
                <Users style={{ width: '13px', height: '13px' }} />
                <span>+ Group</span>
              </button>
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', fontWeight: 800 }}>
                Live ⚡
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '12px', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search chats, team, or channels..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Section Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setSidebarTab('all')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: sidebarTab === 'all' ? '#0284c7' : 'transparent',
                color: sidebarTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              onClick={() => setSidebarTab('team')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: sidebarTab === 'team' ? '#0284c7' : 'transparent',
                color: sidebarTab === 'team' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Team ({filteredTeamMembers.length})
            </button>
            <button
              onClick={() => setSidebarTab('channels')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: sidebarTab === 'channels' ? '#0284c7' : 'transparent',
                color: sidebarTab === 'channels' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Channels
            </button>
          </div>
        </div>

        {/* Channels & Team Member List */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '0.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          {/* Section 1: Team Members (1-on-1 Direct Chat) */}
          {(sidebarTab === 'all' || sidebarTab === 'team') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.4rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.5px' }}>
                <span>Team Members (Direct Chat)</span>
                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>🟢 Online</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredTeamMembers.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>
                    No other team members found.
                  </div>
                ) : (
                  filteredTeamMembers.map(member => {
                    const sorted = [activeUser?.id, member.id].sort();
                    const dmChannelId = `dm-${sorted.join('-')}`;
                    const isActive = activeChannelId === dmChannelId;

                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          startDirectChat(member);
                          setMobileActivePane('chat');
                        }}
                        className={`glass-card ${isActive ? 'glass-card-hover' : ''}`}
                        style={{
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          textAlign: 'left',
                          background: isActive ? '#e0f2fe' : 'var(--bg-card)',
                          borderColor: isActive ? '#0284c7' : 'var(--border-color)',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #bae6fd' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#bae6fd', color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #ffffff' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {member.name}
                            </h4>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingUserProfile && setViewingUserProfile(member.id);
                              }}
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: 'rgba(2, 132, 199, 0.12)',
                                color: '#0284c7',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title={`View ${member.name}'s profile`}
                            >
                              Profile
                            </span>
                          </div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.role} • {member.department || 'Team'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Section 2: Channels & AI */}
          {(sidebarTab === 'all' || sidebarTab === 'channels') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.5px' }}>
                  Channels & Groups
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                  title="Create a new team group"
                >
                  <Plus style={{ width: '12px', height: '12px' }} />
                  <span>New Group</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredChannels.filter(c => c.type !== 'direct').map(channel => {
                  const isActive = channel.id === activeChannelId;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setActiveChannelId(channel.id);
                        setMobileActivePane('chat');
                      }}
                      className={`glass-card ${isActive ? 'glass-card-hover' : ''}`}
                      style={{
                        padding: '0.75rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textAlign: 'left',
                        background: isActive ? '#e0f2fe' : 'var(--bg-card)',
                        borderColor: isActive ? 'var(--brand-primary)' : 'var(--border-color)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {channel.type === 'ai' ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff', flexShrink: 0 }}>
                          🤖
                        </div>
                      ) : channel.type === 'group' ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                          <Users style={{ width: '18px', height: '18px' }} />
                        </div>
                      ) : channel.avatar ? (
                        <img src={channel.avatar} alt={channel.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                          <Hash style={{ width: '18px', height: '18px' }} />
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {channel.name}
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {channel.roleBadge || channel.description}
                        </p>
                      </div>

                      {channel.unreadCount > 0 && !isActive && (
                        <span className="badge badge-rose" style={{ flexShrink: 0 }}>{channel.unreadCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div
        className={`chat-conversation-pane ${mobileActivePane === 'roster' ? 'chat-pane-hidden-mobile' : ''}`}
        style={{
          background: 'var(--bg-main)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* WhatsApp-Style Active Chat Header */}
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-sidebar)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
            flexWrap: 'nowrap',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            {/* Mobile Back Button to return to Roster */}
            <button
              type="button"
              onClick={() => setMobileActivePane('roster')}
              className="chat-mobile-back-btn"
              title="Back to contacts list"
              aria-label="Back to contacts list"
            >
              <ArrowLeft style={{ width: '18px', height: '18px' }} />
            </button>

            {/* Clickable Contact Profile Area (WhatsApp Style) */}
            <div
              onClick={handleHeaderClick}
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                padding: '0.3rem 0.5rem',
                borderRadius: '10px',
                background: isHeaderHovered ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                minWidth: 0,
                flex: 1,
                overflow: 'hidden'
              }}
              title={
                isDirectChat
                  ? `Click to view ${chatDisplayName}'s profile`
                  : activeChannel.type === 'group' || activeChannel.type === 'public'
                  ? `Click to view ${chatDisplayName} group info & members`
                  : 'Click to view PulseBot AI details'
              }
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {activeChannel.type === 'ai' ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#fff', boxShadow: '0 2px 8px rgba(2,132,199,0.25)' }}>
                    🤖
                  </div>
                ) : activeChannel.type === 'group' ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
                    <Users style={{ width: '20px', height: '20px' }} />
                  </div>
                ) : chatDisplayAvatar ? (
                  <img
                    src={chatDisplayAvatar}
                    alt={chatDisplayName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatDisplayName)}&background=0284c7&color=fff&size=100`;
                    }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #bae6fd', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                  />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontWeight: 800, fontSize: '0.95rem', border: '2px solid #bae6fd', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                    {isDirectChat ? (chatDisplayName ? chatDisplayName.slice(0, 2).toUpperCase() : 'DM') : <Hash style={{ width: '20px', height: '20px' }} />}
                  </div>
                )}
                {isDirectChat && (
                  <span style={{ position: 'absolute', bottom: '0px', right: '0px', width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', border: '2px solid #ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chatDisplayName}
                  </h3>
                  {isDirectChat && (
                    <span className="header-label-tablet" style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Direct
                    </span>
                  )}
                  {(activeChannel.type === 'group' || activeChannel.type === 'public') && (
                    <span className="header-label-tablet" style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', background: '#d1fae5', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Group
                    </span>
                  )}
                  <Info
                    style={{
                      width: '13px',
                      height: '13px',
                      color: '#0284c7',
                      opacity: isHeaderHovered ? 1 : 0.45,
                      transition: 'opacity 0.15s ease',
                      flexShrink: 0
                    }}
                    title="Click to view contact profile details"
                  />
                </div>
                <p style={{ fontSize: '0.72rem', color: currentTypers.length > 0 ? '#0284c7' : 'var(--text-muted)', fontWeight: currentTypers.length > 0 ? 700 : 500, margin: '1px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTypers.length > 0
                    ? `${currentTypers.join(', ')} is typing...`
                    : (isDirectChat ? `${chatDisplayRole} • online` : (activeChannel.type === 'group' || activeChannel.type === 'public') ? (activeChannel.description || `${activeChannel.participantIds?.length || 0} members`) : (activeChannel.roleBadge || activeChannel.description || 'Active Channel'))}
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools: Explicit Profile/Group Info Button & Persona Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0, flexWrap: 'nowrap' }}>
            {isDirectChat ? (
              <button
                type="button"
                onClick={handleHeaderClick}
                className="btn btn-secondary chat-action-btn"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f0f9ff',
                  borderColor: '#bae6fd',
                  color: '#0284c7'
                }}
                title={`Open ${chatDisplayName}'s full profile, tasks, and KPIs`}
              >
                <User style={{ width: '13px', height: '13px' }} />
                <span className="header-label-tablet">Profile</span>
              </button>
            ) : (activeChannel.type === 'group' || activeChannel.type === 'public') ? (
              <button
                type="button"
                onClick={handleHeaderClick}
                className="btn btn-secondary chat-action-btn"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  color: '#059669'
                }}
                title="View group participants, roles, and details"
              >
                <Users style={{ width: '13px', height: '13px' }} />
                <span className="header-label-tablet">Group Info</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setIsLinkedSheetsOpen(true)}
                  className="btn btn-secondary chat-action-btn"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#f0fdf4',
                    borderColor: '#bbf7d0',
                    color: '#15803d'
                  }}
                  title="View all 8 linked Google Sheets, sync fresh data, or connect new sheets (100% Read-Only)"
                >
                  <FileSpreadsheet style={{ width: '13px', height: '13px', color: '#16a34a' }} />
                  <span className="header-label-tablet">Sheets</span>
                  <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '10px', fontWeight: 800 }}>8</span>
                </button>

                <button
                  type="button"
                  onClick={handleHeaderClick}
                  className="btn btn-secondary chat-action-btn"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#e0f2fe',
                    borderColor: '#bae6fd',
                    color: '#0369a1'
                  }}
                  title="View PulseBot AI capabilities and webhook status"
                >
                  <Sparkles style={{ width: '13px', height: '13px', color: '#0284c7' }} />
                  <span className="header-label-tablet">AI Details</span>
                </button>
              </div>
            )}

            <div className="glass-card header-label-desktop" style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Persona: {activeUser.name} ({activeUser.role})
            </div>
          </div>
        </div>

        {/* AI Quick Prompts Bar (when chatting with PulseBot AI) */}
        {activeChannel.type === 'ai' && (
          <div
            className="chat-prompts-bar"
            style={{
              background: '#f0f7ff',
              borderBottom: '1px solid #bae6fd',
              padding: '0.45rem 0.85rem',
              display: 'flex',
              gap: '0.45rem',
              overflowX: 'auto',
              flexShrink: 0,
              alignItems: 'center',
              scrollPadding: '0.5rem',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', alignSelf: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>Smart Prompts:</span>
            <button
              onClick={() => setIsLinkedSheetsOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              📊 Linked Sheets Hub (8)
            </button>
            <button onClick={() => handleQuickAiPrompt('How many lots of SS and how many are cut or pending?')} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
              ✂️ SS 331 Lots & Cutting Status
            </button>
            <button onClick={() => handleQuickAiPrompt('Sync sheets')} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
              🔄 Sync Google Sheets
            </button>
            <button onClick={() => handleQuickAiPrompt('What tasks are currently overdue?')} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
              ⚠️ Overdue Tasks
            </button>
            <button onClick={() => handleQuickAiPrompt('Show all tasks pending supervisor approval')} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
              📋 Pending Approvals
            </button>
          </div>
        )}

        {/* Messages Feed Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="chat-messages-feed"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            background: 'var(--bg-main)',
            backgroundImage: 'radial-gradient(rgba(2, 132, 199, 0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            scrollBehavior: 'smooth'
          }}
        >
          {/* WhatsApp-style Reverse Pagination Header */}
          {chatPagination[activeChannelId]?.isLoadingMore ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.6rem', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700 }}>
              <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
              <span>Loading earlier messages...</span>
            </div>
          ) : chatPagination[activeChannelId]?.hasMore ? (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.4rem 0' }}>
              <button
                type="button"
                onClick={handleLoadMoreManual}
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 1.1rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '20px',
                  background: 'rgba(2, 132, 199, 0.08)',
                  borderColor: '#bae6fd',
                  color: '#0369a1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>↑</span>
                <span>Load older messages</span>
              </button>
            </div>
          ) : channelMessages.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0.5rem 0', opacity: 0.7 }}>
              <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Showing last 3 days messages
              </span>
              <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }} />
            </div>
          ) : null}

          {channelMessages.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No messages yet in this conversation. Send a voice note, message, or file to start!
            </div>
          ) : (
            channelMessages.map(msg => {
              if (msg.messageType === 'system' || msg.senderId === 'system') {
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '0.4rem 0' }}>
                    <div style={{
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid #bae6fd',
                      borderRadius: '16px',
                      padding: '4px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#0369a1',
                      textAlign: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              }

              const isSelf = msg.senderId === activeUser.id;
              const isAi = msg.isAi;
              const reactionsObj = msg.reactions || {};
              const hasReactions = Object.keys(reactionsObj).length > 0;

              return (
                <div
                  key={msg.id}
                  className="chat-msg-row"
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                  style={{
                    display: 'flex',
                    gap: '0.65rem',
                    flexDirection: isSelf ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    position: 'relative',
                    width: '100%'
                  }}
                >
                  {isAi ? (
                    <div className="chat-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', color: '#fff', flexShrink: 0, marginTop: '2px' }}>
                      🤖
                    </div>
                  ) : (() => {
                    const senderUser = users.find(u => String(u.id) === String(msg.senderId) || (msg.senderName && u.name?.trim().toLowerCase() === msg.senderName.trim().toLowerCase()));
                    const displayAvatar = (senderUser && senderUser.avatar) || msg.senderAvatar || (isSelf ? activeUser?.avatar : null);
                    return displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={msg.senderName}
                        className="chat-avatar"
                        onClick={() => msg.senderId && setViewingUserProfile && setViewingUserProfile(msg.senderId)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=0284c7&color=fff&size=80`;
                        }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: msg.senderId ? 'pointer' : 'default', border: '1.5px solid #bae6fd', boxShadow: '0 2px 5px rgba(0,0,0,0.08)', marginTop: '2px' }}
                        title={msg.senderId ? `View ${msg.senderName}'s profile` : ''}
                      />
                    ) : (
                      <div
                        onClick={() => msg.senderId && setViewingUserProfile && setViewingUserProfile(msg.senderId)}
                        className="chat-avatar"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', flexShrink: 0, cursor: msg.senderId ? 'pointer' : 'default', border: '1.5px solid #7dd3fc', marginTop: '2px' }}
                        title={msg.senderId ? `View ${msg.senderName}'s profile` : ''}
                      >
                        {msg.senderName ? msg.senderName.slice(0, 2).toUpperCase() : '??'}
                      </div>
                    );
                  })()}

                  {(() => {
                    const trackingData = extractTrackingData(msg);
                    const hasTracking = Boolean(trackingData);
                    return (
                      <div
                        className={`chat-msg-body ${hasTracking ? 'has-tracking' : ''}`}
                        style={{
                          maxWidth: hasTracking ? '95%' : '82%',
                          width: hasTracking ? '95%' : 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSelf ? 'flex-end' : 'flex-start',
                          position: 'relative'
                        }}
                      >
                        {/* Header info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3px' }}>
                      <span
                        onClick={() => !isAi && msg.senderId && setViewingUserProfile && setViewingUserProfile(msg.senderId)}
                        style={{ fontSize: '0.78125rem', fontWeight: 800, color: 'var(--text-primary)', cursor: (!isAi && msg.senderId) ? 'pointer' : 'default' }}
                        title={(!isAi && msg.senderId) ? `View ${msg.senderName}'s profile` : ''}
                      >
                        {msg.senderName}
                      </span>
                      <span className="badge badge-brand" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>{msg.senderRole}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{getTimeAgo(msg.timestamp)}</span>
                    </div>

                    {/* WhatsApp Quick Reaction Hover Bar */}
                    {hoveredMsgId === msg.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-28px',
                          [isSelf ? 'right' : 'left']: '0',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '20px',
                          padding: '2px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          zIndex: 10,
                          animation: 'fadeIn 0.15s ease'
                        }}
                      >
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => reactToMessage(msg.id, activeChannelId, emoji)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              transition: 'transform 0.1s ease',
                              lineHeight: '1'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* WhatsApp Message Bubble */}
                    <div
                      className="chat-msg-bubble"
                      style={{
                        padding: '0.8rem 1.1rem',
                        borderRadius: isSelf ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isSelf ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : isAi ? '#ffffff' : 'var(--bg-card)',
                        color: isSelf ? '#ffffff' : 'var(--text-primary)',
                        border: isSelf ? 'none' : '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        position: 'relative',
                        width: hasTracking ? '100%' : 'auto',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* 1. Attached Audio Voice Note */}
                      {msg.audioUrl && (
                        <div style={{ marginBottom: (msg.text || msg.imageUrl || msg.fileAttachment) ? '0.65rem' : '0' }}>
                          <AudioPlayerBubble audioUrl={msg.audioUrl} isSelf={isSelf} />
                        </div>
                      )}

                      {/* 2. Attached Image */}
                      {msg.imageUrl && (
                        <div style={{ marginBottom: msg.text ? '0.65rem' : '0' }}>
                          <img
                            src={msg.imageUrl}
                            alt="Chat attachment"
                            onClick={() => setPreviewImage(msg.imageUrl)}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '320px',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              objectFit: 'cover',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              display: 'block'
                            }}
                            title="Click to view full image"
                          />
                        </div>
                      )}

                      {/* 3. Document Attachment */}
                      {msg.fileAttachment && (
                        <div
                          style={{
                            marginBottom: msg.text ? '0.65rem' : '0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '12px',
                            background: isSelf ? 'rgba(255, 255, 255, 0.18)' : '#f0f9ff',
                            border: isSelf ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #bae6fd',
                            maxWidth: '320px'
                          }}
                        >
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: isSelf ? '#ffffff' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                            <FileText style={{ width: '20px', height: '20px' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelf ? '#ffffff' : 'var(--text-primary)' }}>
                              {msg.fileAttachment.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: isSelf ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)' }}>
                              {msg.fileAttachment.size} KB • Document
                            </div>
                          </div>
                          <a
                            href={msg.fileAttachment.dataUrl}
                            download={msg.fileAttachment.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isSelf ? '#ffffff' : '#0284c7',
                              color: isSelf ? '#0284c7' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              textDecoration: 'none'
                            }}
                            title="Download Document"
                          >
                            <Download style={{ width: '15px', height: '15px' }} />
                          </a>
                        </div>
                      )}

                      {/* 4. Message Text & Production Tracking Card / Delegated Task Card */}
                      {(() => {
                        const delegatedTask = msg.delegatedTask || (typeof msg.fileAttachment === 'object' && msg.fileAttachment?.delegatedTask) || (typeof msg.file_attachment === 'object' && msg.file_attachment?.delegatedTask);

                        if (delegatedTask) {
                          return (
                            <div style={{ whiteSpace: 'normal', width: '100%' }}>
                              {msg.text ? (
                                <div style={{ marginBottom: '8px' }}>
                                  {renderFormattedMessageText(
                                    msg.text,
                                    isSelf,
                                    (url) => setPreviewImage(url),
                                    false
                                  )}
                                </div>
                              ) : null}
                              <AiTaskDelegationCard delegatedTask={delegatedTask} isSelf={isSelf} />
                            </div>
                          );
                        }

                        if (trackingData) {
                          const { introText, notesText } = splitMessageIntroAndNotes(msg.text, trackingData);
                          return (
                            <div style={{ whiteSpace: 'normal', width: '100%' }}>
                              {introText ? (
                                <div style={{ marginBottom: '8px' }}>
                                  {renderFormattedMessageText(
                                    introText,
                                    isSelf,
                                    (url) => setPreviewImage(url),
                                    true
                                  )}
                                </div>
                              ) : null}

                              <ProductionTrackingCard
                                trackingData={trackingData}
                                isSelf={isSelf}
                                onImageClick={(url) => setPreviewImage(url)}
                              />

                              {notesText ? (
                                <div style={{ marginTop: '8px' }}>
                                  {renderFormattedMessageText(
                                    notesText,
                                    isSelf,
                                    (url) => setPreviewImage(url),
                                    false
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        return msg.text ? (
                          <div style={{ whiteSpace: 'normal' }}>
                            {renderFormattedMessageText(
                              msg.text,
                              isSelf,
                              (url) => setPreviewImage(url),
                              false
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* 4a. Multi-Image Gallery Grid */}
                      {(() => {
                        const gallery = extractImageGallery(msg);
                        if (!gallery || gallery.length === 0) return null;
                        return (
                          <ChatImageGallery
                            gallery={gallery}
                            isSelf={isSelf}
                            onImageClick={(url, title) => setPreviewImage(url)}
                          />
                        );
                      })()}

                      {/* 4b. PDF Attachment Card */}
                      {(() => {
                        const pdfInfo = extractPdfInfo(msg);
                        if (!pdfInfo) return null;
                        return (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.85rem 1rem',
                              borderRadius: '12px',
                              background: isSelf ? 'rgba(255, 255, 255, 0.15)' : '#f8fafc',
                              border: isSelf ? '1px solid rgba(255, 255, 255, 0.3)' : '1.5px solid #38bdf8',
                              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.85rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '180px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '8px',
                                  background: isSelf ? '#ffffff' : '#fee2e2',
                                  color: '#dc2626',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                  fontSize: '0.6rem',
                                  flexShrink: 0,
                                  border: isSelf ? 'none' : '1px solid #fca5a5'
                                }}
                              >
                                <FileText style={{ width: '16px', height: '16px' }} />
                                <span>PDF</span>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelf ? '#ffffff' : '#0f172a' }}>
                                  {pdfInfo.title || `Job Order Slip (Lot ${pdfInfo.lotNumber})`}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: isSelf ? 'rgba(255, 255, 255, 0.85)' : '#64748b' }}>
                                  {pdfInfo.filename || 'JobOrder.pdf'} • Ready for Download
                                </div>
                              </div>
                            </div>

                            <a
                              href={pdfInfo.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={pdfInfo.filename}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isSelf ? '#ffffff' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                color: isSelf ? '#0284c7' : '#ffffff',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
                                cursor: 'pointer'
                              }}
                            >
                              <Download style={{ width: '14px', height: '14px' }} />
                              <span>Download PDF</span>
                            </a>
                          </div>
                        );
                      })()}

                      {/* 4c. Design Artwork / Style Image Card */}
                      {(() => {
                        const imgInfo = extractImageInfo(msg);
                        if (!imgInfo) return null;
                        if (msg.text && (msg.text.includes(imgInfo.url) || msg.text.includes(imgInfo.rawUrl))) {
                          return null;
                        }
                        return (
                          <div style={{ marginTop: '0.75rem' }}>
                            <ChatInlineImage
                              src={imgInfo.url}
                              alt={imgInfo.title}
                              title={imgInfo.title}
                              isSelf={isSelf}
                              onExpand={(url) => setPreviewImage(url)}
                            />
                          </div>
                        );
                      })()}

                      {/* 5. Task Attachment Pill */}
                      {msg.taskAttachment && (
                        <div
                          onClick={() => setSelectedTaskId(msg.taskAttachment)}
                          style={{
                            marginTop: '0.65rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: isSelf ? 'rgba(255, 255, 255, 0.2)' : '#f0f9ff',
                            border: isSelf ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #bae6fd',
                            color: isSelf ? '#ffffff' : '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Paperclip style={{ width: '13px', height: '13px' }} />
                          <span>Referenced Task: {msg.taskAttachment}</span>
                        </div>
                      )}

                      {/* WhatsApp Double Checkmark & Status on bottom right */}
                      {isSelf && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <CheckCheck style={{ width: '15px', height: '15px', color: '#bae6fd' }} title="Read by recipient" />
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Reaction Badges attached to bubble */}
                    {hasReactions && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {Object.entries(reactionsObj).map(([emoji, userList]) => {
                          if (!Array.isArray(userList) || userList.length === 0) return null;
                          const userHasReacted = userList.includes(activeUser.name);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => reactToMessage(msg.id, activeChannelId, emoji)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: userHasReacted ? '#e0f2fe' : 'var(--bg-card)',
                                border: userHasReacted ? '1px solid #0284c7' : '1px solid var(--border-color)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                              }}
                              title={`Reacted by: ${userList.join(', ')}`}
                            >
                              <span>{emoji}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: userHasReacted ? '#0284c7' : 'var(--text-secondary)' }}>
                                {userList.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
                </div>
              );
            })
          )}

          {/* AI Thinking Indicator */}
          {isAiTyping && activeChannelId === 'chan-ai' && (
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff' }}>
                🤖
              </div>
              <div
                className="glass-card"
                style={{
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: '#0284c7',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  border: '1px solid #bae6fd',
                  background: '#f0f9ff'
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></span>
                <span>PulseBot AI is querying n8n Gemini Agent & Google Sheets...</span>
              </div>
            </div>
          )}

          {/* Real-time Typing Indicator */}
          {currentTypers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.8rem', background: '#e0f2fe', borderRadius: '12px', width: 'fit-content', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1s infinite 0.1s' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1s infinite 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'bounce 1s infinite 0.3s' }}></span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>
                {currentTypers.join(', ')} {currentTypers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Jump-to-Bottom Button */}
        {!isAtBottom && channelMessages.length > 2 && (
          <button
            type="button"
            className="chat-scroll-bottom-btn"
            onClick={() => {
              isAutoScrollEnabled.current = true;
              setIsAtBottom(true);
              scrollToBottom('smooth');
            }}
            style={{
              position: 'absolute',
              background: '#0284c7',
              color: '#ffffff',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              cursor: 'pointer',
              zIndex: 40,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            title="Jump to latest messages"
          >
            <ChevronDown style={{ width: '18px', height: '18px' }} />
          </button>
        )}

        {/* WhatsApp-Style Input Controls */}
        <div style={{ position: 'relative', borderTop: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', flexShrink: 0 }}>
          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '20px',
                marginBottom: '10px',
                width: '320px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                zIndex: 1000
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7' }}>WhatsApp Emojis</span>
                <button type="button" onClick={() => setShowEmojiPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {POPULAR_EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paperclip Attach Menu Popover */}
          {showAttachMenu && (
            <div
              ref={attachMenuRef}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '60px',
                marginBottom: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '180px'
              }}
            >
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <ImageIcon style={{ width: '16px', height: '16px' }} />
                </div>
                <span>Photos & Images</span>
              </button>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                  <FileText style={{ width: '16px', height: '16px' }} />
                </div>
                <span>Document (PDF/Doc)</span>
              </button>

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Music style={{ width: '16px', height: '16px' }} />
                </div>
                <span>Audio File (MP3/WAV)</span>
              </button>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
            ref={docInputRef}
            onChange={handleDocumentSelect}
            style={{ display: 'none' }}
          />
          <input
            type="file"
            accept="audio/*"
            ref={audioInputRef}
            onChange={handleAudioFileSelect}
            style={{ display: 'none' }}
          />

          <form onSubmit={handleSend} className="chat-input-form" style={{ padding: '0.85rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative' }}>
            {/* Executive Tagged User & EA Follow-up Bar */}
            {taggedUser && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  border: requireEaFollowup ? '1px solid #fde68a' : '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
                  gap: '12px'
                }}
              >
                {/* Assignee Information */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AtSign style={{ width: '13px', height: '13px', color: '#0284c7' }} />
                    <span>Assignee:</span>
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      padding: '3px 10px 3px 5px',
                      borderRadius: '20px',
                      color: '#0f172a'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#0284c7',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800
                      }}
                    >
                      {taggedUser.avatar || taggedUser.name?.[0]?.toUpperCase() || '👤'}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.8125rem' }}>{taggedUser.name}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: taggedUser.role === 'EA' ? '#fef3c7' : '#e0f2fe',
                        color: taggedUser.role === 'EA' ? '#b45309' : '#0369a1'
                      }}
                    >
                      {taggedUser.role} • {taggedUser.department || 'Operations'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTaggedUser(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: '12px',
                        lineHeight: 1,
                        fontWeight: 800
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      title="Remove Assignee"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Executive Toggle Switch for EA Follow-Up */}
                <div
                  onClick={() => setRequireEaFollowup(!requireEaFollowup)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: requireEaFollowup ? '#fffbeb' : '#f8fafc',
                    border: requireEaFollowup ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  title="Enable Executive Assistant (EA) for systematic progress monitoring & escalation"
                >
                  {/* Toggle Track & Thumb */}
                  <div
                    style={{
                      width: '28px',
                      height: '16px',
                      borderRadius: '10px',
                      background: requireEaFollowup ? '#f59e0b' : '#cbd5e1',
                      position: 'relative',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: requireEaFollowup ? '14px' : '2px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap style={{ width: '13px', height: '13px', color: requireEaFollowup ? '#d97706' : '#94a3b8' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: requireEaFollowup ? '#b45309' : '#64748b' }}>
                      EA Follow-Up
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Selected Attachments Preview Banner */}
            {(selectedImage || selectedFile || selectedTaskAttach) && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedImage && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', fontSize: '0.75rem', fontWeight: 800 }}>
                    <img src={selectedImage.dataUrl} alt="preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                    <span>📸 Image: {selectedImage.name} • 🔍 OCR Lot Scanner Active</span>
                    <button type="button" onClick={() => setSelectedImage(null)} style={{ background: 'none', border: 'none', marginLeft: '4px', cursor: 'pointer', color: '#ef4444', fontWeight: 800 }}>✕</button>
                  </div>
                )}

                {selectedFile && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '0.75rem', fontWeight: 800 }}>
                    <FileText style={{ width: '16px', height: '16px' }} />
                    <span>Doc: {selectedFile.name} ({selectedFile.size} KB)</span>
                    <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', marginLeft: '4px', cursor: 'pointer', color: '#ef4444', fontWeight: 800 }}>✕</button>
                  </div>
                )}

                {selectedTaskAttach && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', background: '#e0f2fe', color: '#0284c7', fontSize: '0.75rem', fontWeight: 800 }}>
                    <Paperclip style={{ width: '14px', height: '14px' }} />
                    <span>Attaching: {selectedTaskAttach}</span>
                    <button type="button" onClick={() => setSelectedTaskAttach('')} style={{ background: 'none', border: 'none', marginLeft: '4px', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                  </div>
                )}
              </div>
            )}

            {/* Main Bar: Voice Recording Active Mode OR Normal Text Mode */}
            {isRecording ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px'
                }}
              >
                {/* Blinking red mic dot and timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#dc2626' }}>
                    Recording Voice Note... {formattedTime}
                  </span>
                </div>

                {/* Cancel / Trash Button */}
                <button
                  type="button"
                  onClick={cancelRecording}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    color: '#dc2626',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Discard Recording"
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </button>

                {/* Send Audio Button */}
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className="btn btn-primary"
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: '#10b981',
                    borderColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Send Voice Note"
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                  <span>Send Audio</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                {/* Emoji Picker Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="btn-icon"
                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7' }}
                  title="Insert WhatsApp Emoji"
                >
                  <Smile style={{ width: '18px', height: '18px' }} />
                </button>

                {/* WhatsApp Paperclip Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="btn-icon"
                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7' }}
                  title="Attach Photo, Document, or Audio"
                >
                  <Paperclip style={{ width: '18px', height: '18px' }} />
                </button>

                {/* Tag User / Assign Task Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowTagMenu(!showTagMenu);
                    setShowEmojiPicker(false);
                    setShowAttachMenu(false);
                  }}
                  style={{
                    background: taggedUser ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
                    border: taggedUser ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    color: taggedUser ? '#ffffff' : '#334155',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    transition: 'all 0.15s ease',
                    boxShadow: taggedUser ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                    flexShrink: 0
                  }}
                  title="Tag team member to assign task & transmit in real time"
                >
                  <AtSign style={{ width: '15px', height: '15px' }} />
                  <span className="header-label-tablet">{taggedUser ? `Assigned: ${taggedUser.name.split(' ')[0]}` : 'Tag Person'}</span>
                </button>

                {/* Tag User Executive Command Popover */}
                {showTagMenu && (
                  <div
                    ref={tagMenuRef}
                    style={{
                      position: 'absolute',
                      bottom: '68px',
                      left: '80px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '12px',
                      boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                      zIndex: 1001,
                      width: '340px',
                      maxHeight: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      animation: 'fadeIn 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <AtSign style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                        <span>Assign Task To Team Member</span>
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>{users.length} profiles</span>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Type name, role, or department..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.8rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none',
                          background: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                        autoFocus
                      />
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: '190px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {users
                        .filter(u => {
                          const q = tagSearch.toLowerCase();
                          return (u.name || '').toLowerCase().includes(q) ||
                                 (u.role || '').toLowerCase().includes(q) ||
                                 (u.department || '').toLowerCase().includes(q);
                        })
                        .map(u => {
                          const r = (u.role || '').toLowerCase();
                          const isEa = r.includes('ea');
                          const isManager = r.includes('manager');
                          const isAdmin = r.includes('admin');
                          const roleColor = isEa ? { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }
                            : isManager ? { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
                            : isAdmin ? { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' }
                            : { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };

                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setTaggedUser(u);
                                setShowTagMenu(false);
                                setTagSearch('');
                                if (!messageInput) {
                                  setMessageInput('Please prepare ');
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: taggedUser?.id === u.id ? '1px solid #0284c7' : '1px solid transparent',
                                background: taggedUser?.id === u.id ? '#f0f9ff' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (taggedUser?.id !== u.id) e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                if (taggedUser?.id !== u.id) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    boxShadow: '0 1px 4px rgba(2, 132, 199, 0.25)',
                                    flexShrink: 0
                                  }}
                                >
                                  {u.avatar || u.name?.[0]?.toUpperCase() || '👤'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                                    {u.name}
                                  </div>
                                  <div style={{ fontSize: '0.69rem', color: '#64748b' }}>
                                    {u.department || 'Operations'}
                                  </div>
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  background: roleColor.bg,
                                  color: roleColor.text,
                                  border: `1px solid ${roleColor.border}`
                                }}
                              >
                                {u.role}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Attach Task Reference Dropdown (hidden on mobile to give space to input text) */}
                <select
                  value={selectedTaskAttach}
                  onChange={(e) => setSelectedTaskAttach(e.target.value)}
                  className="select-dropdown header-label-desktop"
                  style={{ width: 'auto', maxWidth: '210px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', flexShrink: 0 }}
                >
                  <option value="">Attach Task Reference...</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.id} - {t.title.slice(0, 22)}...</option>)}
                </select>

                {/* Message Input Textbox */}
                <input
                  type="text"
                  placeholder={`Message ${chatDisplayName}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  className="input-text"
                  style={{ flex: 1, minWidth: 0, padding: '0.65rem 1rem', fontSize: '0.875rem' }}
                />

                {/* Voice Note Record Microphone Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  className="chat-voice-btn"
                  style={{
                    background: '#e0f2fe',
                    border: '1px solid #bae6fd',
                    color: '#0284c7',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    flexShrink: 0
                  }}
                  title="Record WhatsApp Voice Note"
                >
                  <Mic style={{ width: '17px', height: '17px' }} />
                  <span className="header-label-tablet">Audio</span>
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  className="btn btn-primary chat-send-btn"
                  style={{ padding: '0.65rem 1.15rem', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                  <span className="header-label-tablet">Send</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 100000, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a'
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>

            <img
              src={previewImage}
              alt="Fullscreen Preview"
              referrerPolicy="no-referrer"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}

      {/* WhatsApp Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      {/* WhatsApp Group Info Modal */}
      {isGroupInfoOpen && (
        <GroupInfoModal
          channel={activeChannel}
          onClose={() => setIsGroupInfoOpen(false)}
          users={users}
          activeUser={activeUser}
          setViewingUserProfile={setViewingUserProfile}
          startDirectChat={startDirectChat}
        />
      )}

      {/* PulseBot AI Info Modal */}
      {isAiInfoOpen && (
        <AiAssistantInfoModal
          onClose={() => setIsAiInfoOpen(false)}
          activeUser={activeUser}
          onOpenLinkedSheets={() => setIsLinkedSheetsOpen(true)}
        />
      )}

      {/* Linked Google Sheets Modal (Strictly Read-Only) */}
      {isLinkedSheetsOpen && (
        <LinkedSheetsModal
          onClose={() => setIsLinkedSheetsOpen(false)}
        />
      )}
    </div>
  );
}
