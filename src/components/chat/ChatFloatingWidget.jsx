import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { BASE_URL } from '../../api/apiClient';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  User,
  Users,
  Hash,
  Image as ImageIcon,
  Mic,
  Trash2,
  Smile,
  Paperclip,
  FileText,
  Download,
  CheckCheck,
  Music,
  Plus,
  Info,
  FileSpreadsheet,
  Loader2,
  AtSign,
  Zap
} from 'lucide-react';
import { getTimeAgo } from '../../utils/dateUtils';
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
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😍',
  '🥰', '😘', '😋', '😎', '🤔', '🤫', '🙄', '👍', '👎', '👌',
  '✌️', '🤞', '👏', '🙌', '🙏', '💪', '🔥', '✨', '🎉', '🚀',
  '💯', '❤️', '💙', '💜', '💔', '⭐', '⚡', '💡', '📌', '✅'
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

  const imgMd = msg.text.match(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)/);
  if (imgMd && isValidUrl(imgMd[2])) {
    return {
      url: getDirectImageUrl(imgMd[2]),
      rawUrl: imgMd[2],
      title: imgMd[1] || 'Design Artwork'
    };
  }

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

// Inline Image component for Widget
const ChatInlineImage = ({ src, alt, title, isSelf }) => {
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
        margin: '6px 0',
        display: 'inline-block',
        maxWidth: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        border: isSelf ? '1px solid rgba(255,255,255,0.35)' : '1px solid #cbd5e1',
        background: isSelf ? 'rgba(0,0,0,0.2)' : '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer'
      }}
      onClick={() => window.open(currentSrc, '_blank')}
      title="Click to open full image"
    >
      <div style={{ position: 'relative', minWidth: '180px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem' }}>
            <span>Loading image...</span>
          </div>
        )}
        <img
          src={currentSrc}
          alt={alt || 'Design Artwork'}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (!hasError) setHasError(true);
            else {
              setIsPermanentlyFailed(true);
              setIsLoading(false);
            }
          }}
          style={{
            maxWidth: '280px',
            maxHeight: '220px',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
      <div
        style={{
          padding: '4px 8px',
          background: isSelf ? 'rgba(0,0,0,0.3)' : '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isSelf ? '#ffffff' : '#0f172a' }}>
          🎨 {title || alt || 'Design Artwork'}
        </span>
        <span style={{ fontSize: '0.62rem', color: isSelf ? 'rgba(255,255,255,0.85)' : '#0284c7' }}>
          Open ↗
        </span>
      </div>
    </div>
  );
};

// Multi-Image Gallery component for Widget
const ChatImageGallery = ({ gallery, isSelf }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (!gallery || !Array.isArray(gallery) || gallery.length === 0) return null;

  const categories = ['ALL', ...new Set(gallery.map(g => (g.garment || 'Garment').toUpperCase()))];
  const filtered = gallery.filter(item => selectedCategory === 'ALL' || (item.garment || '').toUpperCase() === selectedCategory);

  return (
    <div
      style={{
        marginTop: '8px',
        marginBottom: '6px',
        borderRadius: '12px',
        background: isSelf ? 'rgba(0, 0, 0, 0.2)' : '#ffffff',
        border: isSelf ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #cbd5e1',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '6px 10px',
          background: isSelf ? 'rgba(255, 255, 255, 0.1)' : '#0284c7',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          fontWeight: 800
        }}
      >
        <span>📸 Photo Gallery ({gallery.length} Designs)</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>{filtered.length} shown</span>
      </div>

      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: '4px', padding: '6px', overflowX: 'auto', background: isSelf ? 'transparent' : '#f8fafc' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              type="button"
              style={{
                border: 'none',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: selectedCategory === cat ? (isSelf ? '#ffffff' : '#0284c7') : '#e2e8f0',
                color: selectedCategory === cat ? (isSelf ? '#0284c7' : '#ffffff') : '#475569'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          maxHeight: '320px',
          overflowY: 'auto',
          padding: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px'
        }}
      >
        {filtered.map((item, idx) => (
          <div
            key={`widget-gal-${item.lotNumber}-${idx}`}
            onClick={() => window.open(getDirectImageUrl(item.url), '_blank')}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ position: 'relative', height: '90px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={getDirectImageUrl(item.url)}
                alt={`Lot ${item.lotNumber}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = `${BASE_URL}/chat/image-proxy?url=${encodeURIComponent(item.url)}`;
                  if (e.target.src !== fallback) {
                    e.target.src = fallback;
                  }
                }}
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
              <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', fontWeight: 800 }}>
                Lot {item.lotNumber}
              </div>
            </div>
            <div style={{ padding: '4px 6px', fontSize: '0.65rem' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.garment}</div>
              <div style={{ color: '#0284c7', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fabric}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper to parse inline tokens: links, images, code badges (bar graphs), and bold text
const formatInlineTokens = (line, isSelf, suppressImages = false) => {
  if (!line) return null;

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
            <ChatInlineImage src={tokenUrl} alt={tokenText} title={tokenText} isSelf={isSelf} />
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

  // Process inline code / progress bar badges: `code`
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

  // Process bold text: **bold**
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
const renderFormattedMessageText = (text, isSelf, suppressImages = false) => {
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

    // Detect Markdown Table
    if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerLine = line;
      i += 2;

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
            margin: '8px 0',
            borderRadius: '8px',
            border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #cbd5e1',
            background: isSelf ? 'rgba(0,0,0,0.16)' : '#ffffff',
            boxShadow: isSelf ? 'none' : '0 1px 4px rgba(0,0,0,0.06)'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
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
                      padding: '7px 10px',
                      fontWeight: 800,
                      color: isSelf ? '#ffffff' : '#0f172a',
                      whiteSpace: 'nowrap',
                      borderRight: isSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9'
                    }}
                  >
                    {formatInlineTokens(h, isSelf, suppressImages)}
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
                        padding: '6px 10px',
                        color: isSelf ? '#f8fafc' : '#1e293b',
                        whiteSpace: 'nowrap',
                        borderRight: isSelf ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f8fafc'
                      }}
                    >
                      {formatInlineTokens(cell, isSelf, suppressImages)}
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
            margin: '8px 0 4px 0',
            color: isSelf ? '#ffffff' : '#0369a1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: isSelf ? 'rgba(255,255,255,0.12)' : '#f0f9ff',
            border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #bae6fd'
          }}
        >
          <span>🔹</span>
          <span>{formatInlineTokens(cleanH4, isSelf, suppressImages)}</span>
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
            fontSize: '14px',
            fontWeight: 800,
            margin: '8px 0 4px 0',
            color: isSelf ? '#ffffff' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {formatInlineTokens(line.replace(/^###\s+/, ''), isSelf, suppressImages)}
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
            fontSize: '15px',
            fontWeight: 800,
            margin: '10px 0 5px 0',
            color: isSelf ? '#ffffff' : '#0f172a'
          }}
        >
          {formatInlineTokens(line.replace(/^##\s+/, ''), isSelf, suppressImages)}
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
            fontSize: '16px',
            fontWeight: 900,
            margin: '12px 0 5px 0',
            color: isSelf ? '#ffffff' : '#0f172a'
          }}
        >
          {formatInlineTokens(line.replace(/^#\s+/, ''), isSelf, suppressImages)}
        </div>
      );
      i++;
      continue;
    }

    // Smart Bullet points & Key-Value lines
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
              gap: '5px',
              margin: '3px 0',
              lineHeight: '1.4',
              fontSize: '0.8rem'
            }}
          >
            <span style={{ fontWeight: 800, color: isSelf ? 'rgba(255,255,255,0.92)' : '#475569', minWidth: '80px' }}>
              {isDate ? '📅 ' : isSupervisor ? '👤 ' : isQuantity ? '📦 ' : isStatus ? '⚡ ' : '• '}
              {rawKey}:
            </span>

            {isStatus ? (
              /complete|packed|registered|✓/i.test(rawVal) ? (
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '10px', padding: '1px 7px', fontWeight: 800, fontSize: '0.74rem' }}>
                  {rawVal}
                </span>
              ) : /wip|progress|ongoing/i.test(rawVal) ? (
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', borderRadius: '10px', padding: '1px 7px', fontWeight: 800, fontSize: '0.74rem' }}>
                  ⏳ {rawVal}
                </span>
              ) : (
                <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '10px', padding: '1px 7px', fontWeight: 800, fontSize: '0.74rem' }}>
                  {rawVal}
                </span>
              )
            ) : isQuantity ? (
              <span style={{ background: isSelf ? 'rgba(255,255,255,0.18)' : '#f1f5f9', color: isSelf ? '#ffffff' : '#0f172a', border: isSelf ? '1px solid rgba(255,255,255,0.3)' : '1px solid #cbd5e1', borderRadius: '5px', padding: '1px 7px', fontWeight: 800, fontSize: '0.76rem' }}>
                {rawVal}
              </span>
            ) : isSupervisor ? (
              <span style={{ background: isSelf ? 'rgba(255,255,255,0.15)' : '#f0f9ff', color: isSelf ? '#ffffff' : '#0369a1', border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #bae6fd', borderRadius: '5px', padding: '1px 7px', fontWeight: 700, fontSize: '0.76rem' }}>
                {rawVal}
              </span>
            ) : (
              <span style={{ color: isSelf ? '#ffffff' : '#1e293b', fontWeight: 600 }}>
                {formatInlineTokens(rawVal, isSelf, suppressImages)}
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
            gap: '5px',
            margin: '2px 0',
            lineHeight: '1.45'
          }}
        >
          <span style={{ color: isSelf ? 'rgba(255,255,255,0.7)' : '#0284c7', fontWeight: 800, minWidth: '8px' }}>•</span>
          <div style={{ flex: 1 }}>
            {formatInlineTokens(cleanLine, isSelf, suppressImages)}
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
          minHeight: line.trim() === '' ? '0.4rem' : 'auto',
          lineHeight: '1.45',
          fontStyle: /^\*.*\*$/.test(line.trim()) ? 'italic' : 'normal',
          opacity: /^\*.*\*$/.test(line.trim()) ? 0.92 : 1
        }}
      >
        {formatInlineTokens(line, isSelf, suppressImages)}
      </div>
    );
    i++;
  }

  return elements;
};

export default function ChatFloatingWidget() {
  const {
    chatChannels = [],
    chatMessages = {},
    activeChannelId,
    setActiveChannelId,
    sendChatMessage,
    startDirectChat,
    activeUser,
    users = [],
    isAiTyping,
    typingUsers = {},
    sendTypingStatus,
    reactToMessage,
    setViewingUserProfile,
    chatPagination = {},
    loadMoreMessages
  } = useTaskContext();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { dataUrl, name, size }
  const [selectedFile, setSelectedFile] = useState(null); // { dataUrl, name, size, type }
  const [widgetTab, setWidgetTab] = useState('chat'); // 'chat' | 'team'
  const [previewImage, setPreviewImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isAiInfoOpen, setIsAiInfoOpen] = useState(false);
  const [isLinkedSheetsOpen, setIsLinkedSheetsOpen] = useState(false);
  const [taggedUser, setTaggedUser] = useState(null);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [requireEaFollowup, setRequireEaFollowup] = useState(false);

  const messagesContainerRef = useRef(null);
  const isPrependingRef = useRef(false);
  const lastMessageIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);
  const tagMenuRef = useRef(null);
  const typingTimerRef = useRef(null);

  const {
    isRecording,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording
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

  const teamMembers = users.filter(u => u.id !== activeUser?.id);

  // Robust resolver for direct chat contact to view their profile like WhatsApp
  const getDirectChatUser = () => {
    if (!activeChannel) return null;

    if (activeChannel.targetUser?.id) {
      const found = users.find(u => String(u.id) === String(activeChannel.targetUser.id));
      if (found) return found;
      return activeChannel.targetUser;
    }

    if (activeChannel.participantIds && Array.isArray(activeChannel.participantIds)) {
      const otherId = activeChannel.participantIds.find(id => String(id) !== String(activeUser?.id));
      if (otherId) {
        const found = users.find(u => String(u.id) === String(otherId));
        if (found) return found;
      }
    }

    if (activeChannel.name) {
      const trimmed = activeChannel.name.trim().toLowerCase();
      const match = users.find(u => u.name && u.name.trim().toLowerCase() === trimmed);
      if (match) return match;
    }

    if (activeChannel.id && typeof activeChannel.id === 'string' && activeChannel.id.startsWith('dm-')) {
      const parts = activeChannel.id.replace('dm-', '').split('-');
      for (const part of parts) {
        if (String(part) !== String(activeUser?.id)) {
          const found = users.find(u => String(u.id) === String(part));
          if (found) return found;
        }
      }
    }

    return null;
  };

  const handleHeaderClick = () => {
    if (activeChannel.type === 'direct') {
      const target = getDirectChatUser();
      if (target && target.id && setViewingUserProfile) {
        setViewingUserProfile(target.id);
      } else {
        const fallback = users.find(u => u.name?.toLowerCase().includes(activeChannel.name?.toLowerCase()));
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

  const handleScroll = async () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight } = messagesContainerRef.current;
    const pagination = chatPagination[activeChannelId] || {};

    if (scrollTop < 50 && pagination.hasMore && !pagination.isLoadingMore && !isPrependingRef.current) {
      isPrependingRef.current = true;
      const prevScrollHeight = scrollHeight;
      const prevScrollTop = scrollTop;

      await loadMoreMessages(activeChannelId);

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

  useEffect(() => {
    if (isOpen && widgetTab === 'chat') {
      if (isPrependingRef.current) return;
      const lastMsg = channelMessages[channelMessages.length - 1];
      const lastId = lastMsg?.id;
      if (lastId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastId;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [channelMessages, isOpen, widgetTab, selectedImage, selectedFile]);

  // Close menus on outside click
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

  const unreadTotal = chatChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

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
      alert('Please select an image file (PNG, JPG, WebP)');
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
      }
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage && !selectedFile) return;

    if (sendTypingStatus && activeUser?.name) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      sendTypingStatus(activeChannelId, activeUser.name, false);
    }

    sendChatMessage(
      activeChannelId,
      inputText,
      null,
      selectedImage ? selectedImage.dataUrl : null,
      null, // audioUrl
      selectedFile ? selectedFile : null, // fileAttachment
      taggedUser ? taggedUser.id : null,
      requireEaFollowup
    );

    setInputText('');
    setTaggedUser(null);
    setRequireEaFollowup(false);
    setSelectedImage(null);
    setSelectedFile(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setShowTagMenu(false);
  };

  const handlePickMember = (member) => {
    startDirectChat(member);
    setWidgetTab('chat');
  };

  return (
    <div className="floating-chat-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Floating Messenger Window Popover */}
      {isOpen && (
        <div
          className="glass-panel floating-chat-popover"
          style={{
            width: 'min(420px, calc(100vw - 24px))',
            maxHeight: 'calc(100vh - 90px)',
            height: '590px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(2, 132, 199, 0.25)',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {/* WhatsApp-Style Header */}
          <div style={{ padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              onClick={handleHeaderClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                transition: 'background 0.15s ease'
              }}
              title={
                activeChannel.type === 'direct'
                  ? `Click to view ${activeChannel.name}'s profile`
                  : (activeChannel.type === 'group' || activeChannel.type === 'public')
                  ? 'Click to view group info'
                  : 'Click to view PulseBot details'
              }
            >
              <div style={{ position: 'relative' }}>
                {activeChannel.avatar ? (
                  <img
                    src={activeChannel.avatar}
                    alt="avatar"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChannel.name)}&background=0284c7&color=fff&size=80`;
                    }}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fff' }}
                  />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                    {activeChannel.type === 'ai' ? '🤖' : '💬'}
                  </div>
                )}
                {activeChannel.type === 'direct' && (
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }} />
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <span>{activeChannel.name}</span>
                  {activeChannel.type === 'direct' && (
                    <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '8px' }}>Direct</span>
                  )}
                  <Info style={{ width: '12px', height: '12px', opacity: 0.8 }} />
                </h4>
                <span style={{ fontSize: '0.68rem', color: '#e0f2fe' }}>
                  {activeChannel.type === 'direct' ? '🟢 Online • tap for profile' : (activeChannel.type === 'group' || activeChannel.type === 'public') ? '👥 Group • tap for info' : '🤖 AI • tap for details'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleHeaderClick}
                style={{
                  color: '#ffffff',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Profile / Info"
              >
                {activeChannel.type === 'direct' ? 'Profile' : 'Info'}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>

          {/* Tab Navigation: Chat Stream vs Team Members Roster */}
          <div style={{ display: 'flex', background: '#f0f9ff', padding: '4px', borderBottom: '1px solid #bae6fd', gap: '4px' }}>
            <button
              onClick={() => setWidgetTab('chat')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 800,
                background: widgetTab === 'chat' ? '#0284c7' : 'transparent',
                color: widgetTab === 'chat' ? '#ffffff' : '#0369a1',
                cursor: 'pointer'
              }}
            >
              💬 WhatsApp Chat
            </button>
            <button
              onClick={() => setWidgetTab('team')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 800,
                background: widgetTab === 'team' ? '#0284c7' : 'transparent',
                color: widgetTab === 'team' ? '#ffffff' : '#0369a1',
                cursor: 'pointer'
              }}
            >
              👥 Team Contacts ({teamMembers.length})
            </button>
          </div>

          {/* Channel selector pills when on Chat tab */}
          {widgetTab === 'chat' && (
            <div style={{ background: '#e0f2fe', padding: '0.45rem', display: 'flex', gap: '0.35rem', overflowX: 'auto', borderBottom: '1px solid #bae6fd', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  background: '#ffffff',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  flexShrink: 0
                }}
                title="Create a new team group"
              >
                <Plus style={{ width: '11px', height: '11px' }} />
                <span>+ Group</span>
              </button>

              {chatChannels.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveChannelId(c.id)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    background: activeChannelId === c.id ? '#0284c7' : 'transparent',
                    color: activeChannelId === c.id ? '#ffffff' : '#0369a1',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {c.type === 'group' ? `👥 ${c.name}` : c.name}
                  {c.unreadCount > 0 && activeChannelId !== c.id && ` (${c.unreadCount})`}
                </button>
              ))}
            </div>
          )}

          {/* VIEW 1: Team Members Roster */}
          {widgetTab === 'team' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-main)' }}>
              {/* Create Group Action Button */}
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                  marginBottom: '4px'
                }}
              >
                <Users style={{ width: '15px', height: '15px' }} />
                <span>+ Create New Group</span>
              </button>

              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '2px' }}>
                Pick a member to chat directly
              </div>

              {teamMembers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No other team members found.
                </div>
              ) : (
                teamMembers.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handlePickMember(member)}
                    className="glass-card glass-card-hover"
                    style={{
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#bae6fd', color: '#0284c7', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span style={{ position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', border: '2px solid #fff' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {member.role} • {member.department || 'Team'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingUserProfile && setViewingUserProfile(member.id);
                        }}
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title={`View ${member.name}'s profile`}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePickMember(member)}
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* VIEW 2: Active Messages Feed */
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'var(--bg-main)',
                backgroundImage: 'radial-gradient(rgba(2, 132, 199, 0.04) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            >
              {/* WhatsApp-style Reverse Pagination Header */}
              {chatPagination[activeChannelId]?.isLoadingMore ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.4rem', color: '#0284c7', fontSize: '0.72rem', fontWeight: 700 }}>
                  <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                  <span>Loading earlier messages...</span>
                </div>
              ) : chatPagination[activeChannelId]?.hasMore ? (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.2rem 0' }}>
                  <button
                    type="button"
                    onClick={handleLoadMoreManual}
                    style={{
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid #bae6fd',
                      borderRadius: '16px',
                      padding: '0.25rem 0.85rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#0369a1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>↑</span>
                    <span>Load older messages</span>
                  </button>
                </div>
              ) : channelMessages.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0.35rem 0', opacity: 0.65 }}>
                  <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Showing last 3 days messages
                  </span>
                  <div style={{ height: '1px', flex: 1, background: 'var(--border-color)' }} />
                </div>
              ) : null}

              {channelMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No messages yet. Send a voice note, photo, or message!
                </div>
              ) : (
                channelMessages.map(msg => {
                  if (msg.messageType === 'system' || msg.senderId === 'system') {
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
                        <div style={{
                          background: 'rgba(2, 132, 199, 0.08)',
                          border: '1px solid #bae6fd',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#0369a1',
                          textAlign: 'center'
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  const isSelf = msg.senderId === activeUser.id;
                  const reactionsObj = msg.reactions || {};
                  const hasReactions = Object.keys(reactionsObj).length > 0;
                  const senderUser = users.find(u => String(u.id) === String(msg.senderId) || (msg.senderName && u.name?.trim().toLowerCase() === msg.senderName.trim().toLowerCase()));
                  const displayAvatar = (senderUser && senderUser.avatar) || msg.senderAvatar || (isSelf ? activeUser?.avatar : null);

                  return (
                    <div
                      key={msg.id}
                      onMouseEnter={() => setHoveredMsgId(msg.id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                      style={{
                        display: 'flex',
                        flexDirection: isSelf ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        gap: '6px',
                        position: 'relative'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {displayAvatar ? (
                          <img
                            src={displayAvatar}
                            alt={msg.senderName}
                            onClick={() => msg.senderId && setViewingUserProfile && setViewingUserProfile(msg.senderId)}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=0284c7&color=fff&size=60`;
                            }}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #bae6fd',
                              cursor: msg.senderId ? 'pointer' : 'default'
                            }}
                            title={msg.senderName}
                          />
                        ) : (
                          <div
                            onClick={() => msg.senderId && setViewingUserProfile && setViewingUserProfile(msg.senderId)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#bae6fd',
                              color: '#0284c7',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: msg.senderId ? 'pointer' : 'default'
                            }}
                          >
                            {msg.senderName ? msg.senderName.slice(0, 2).toUpperCase() : '??'}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          {msg.senderName} • {getTimeAgo(msg.timestamp)}
                        </span>

                      {/* Quick Reaction Hover Bar */}
                      {hoveredMsgId === msg.id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-24px',
                            [isSelf ? 'right' : 'left']: '0',
                            background: '#ffffff',
                            border: '1px solid #bae6fd',
                            borderRadius: '16px',
                            padding: '2px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            zIndex: 10
                          }}
                        >
                          {QUICK_REACTIONS.slice(0, 5).map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => reactToMessage(msg.id, activeChannelId, emoji)}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                padding: '1px 3px',
                                lineHeight: '1'
                              }}
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <div
                        style={{
                          padding: '0.65rem 0.95rem',
                          borderRadius: isSelf ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          background: isSelf ? '#0284c7' : '#ffffff',
                          color: isSelf ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          border: isSelf ? 'none' : '1px solid var(--border-color)',
                          maxWidth: '90%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Audio Voice Note Bubble */}
                        {msg.audioUrl && (
                          <div style={{ marginBottom: (msg.text || msg.imageUrl || msg.fileAttachment) ? '6px' : 0 }}>
                            <AudioPlayerBubble audioUrl={msg.audioUrl} isSelf={isSelf} />
                          </div>
                        )}

                        {/* Attached Image */}
                        {msg.imageUrl && (
                          <div style={{ marginBottom: msg.text ? '6px' : 0 }}>
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              onClick={() => setPreviewImage(msg.imageUrl)}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          </div>
                        )}

                        {/* Document Attachment */}
                        {msg.fileAttachment && (
                          <div
                            style={{
                              marginBottom: msg.text ? '6px' : 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px',
                              borderRadius: '8px',
                              background: isSelf ? 'rgba(255, 255, 255, 0.15)' : '#f0f9ff',
                              border: isSelf ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #bae6fd'
                            }}
                          >
                            <FileText style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {msg.fileAttachment.name}
                              </div>
                              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                {msg.fileAttachment.size} KB
                              </div>
                            </div>
                            <a
                              href={msg.fileAttachment.dataUrl}
                              download={msg.fileAttachment.name}
                              style={{
                                color: isSelf ? '#ffffff' : '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Download style={{ width: '14px', height: '14px' }} />
                            </a>
                          </div>
                        )}

                        {/* Message Text & Production Tracking Card / Delegated Task Card */}
                        {(() => {
                          const delegatedTask = msg.delegatedTask || (typeof msg.fileAttachment === 'object' && msg.fileAttachment?.delegatedTask) || (typeof msg.file_attachment === 'object' && msg.file_attachment?.delegatedTask);
                          const trackingData = extractTrackingData(msg);

                          if (delegatedTask) {
                            return (
                              <div style={{ whiteSpace: 'normal', width: '100%' }}>
                                {msg.text ? (
                                  <div style={{ marginBottom: '8px' }}>
                                    {renderFormattedMessageText(msg.text, isSelf, false)}
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
                                  <div style={{ marginBottom: '6px' }}>
                                    {renderFormattedMessageText(introText, isSelf, true)}
                                  </div>
                                ) : null}

                                <ProductionTrackingCard
                                  trackingData={trackingData}
                                  isSelf={isSelf}
                                />

                                {notesText ? (
                                  <div style={{ marginTop: '6px' }}>
                                    {renderFormattedMessageText(notesText, isSelf, false)}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }

                          return msg.text ? (
                            <div style={{ whiteSpace: 'normal' }}>
                              {renderFormattedMessageText(msg.text, isSelf, false)}
                            </div>
                          ) : null;
                        })()}

                        {/* Multi-Image Gallery Grid in Floating Widget */}
                        {(() => {
                          const gallery = extractImageGallery(msg);
                          if (!gallery || gallery.length === 0) return null;
                          return (
                            <ChatImageGallery
                              gallery={gallery}
                              isSelf={isSelf}
                            />
                          );
                        })()}

                        {/* PDF Download Card in Widget */}
                        {(() => {
                          const pdfInfo = extractPdfInfo(msg);
                          if (!pdfInfo) return null;
                          return (
                            <div
                              style={{
                                marginTop: '6px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                background: isSelf ? 'rgba(255, 255, 255, 0.15)' : '#f0f9ff',
                                border: isSelf ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #7dd3fc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                <FileText style={{ width: '16px', height: '16px', color: isSelf ? '#ffffff' : '#0284c7', flexShrink: 0 }} />
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {pdfInfo.title || `Lot ${pdfInfo.lotNumber} Slip`}
                                </div>
                              </div>
                              <a
                                href={pdfInfo.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={pdfInfo.filename}
                                style={{
                                  background: isSelf ? '#ffffff' : '#0284c7',
                                  color: isSelf ? '#0284c7' : '#ffffff',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  flexShrink: 0
                                }}
                              >
                                <Download style={{ width: '11px', height: '11px' }} />
                                <span>PDF</span>
                              </a>
                            </div>
                          );
                        })()}

                        {/* Design Artwork Card in Widget */}
                        {(() => {
                          const imgInfo = extractImageInfo(msg);
                          if (!imgInfo) return null;
                          if (msg.text && (msg.text.includes(imgInfo.url) || msg.text.includes(imgInfo.rawUrl))) {
                            return null;
                          }
                          return (
                            <div style={{ marginTop: '6px' }}>
                              <ChatInlineImage src={imgInfo.url} alt={imgInfo.title} title={imgInfo.title} isSelf={isSelf} />
                            </div>
                          );
                        })()}

                        {/* Double Checkmark */}
                        {isSelf && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                            <CheckCheck style={{ width: '13px', height: '13px', color: '#bae6fd' }} />
                          </div>
                        )}
                      </div>

                      {/* Reaction Pills */}
                      {hasReactions && (
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
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
                                  gap: '2px',
                                  padding: '1px 5px',
                                  borderRadius: '10px',
                                  background: userHasReacted ? '#e0f2fe' : '#ffffff',
                                  border: userHasReacted ? '1px solid #0284c7' : '1px solid #e2e8f0',
                                  fontSize: '0.68rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <span>{emoji}</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{userList.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* AI Thinking Indicator */}
              {isAiTyping && (activeChannel?.type === 'ai' || activeChannelId === 'chan-ai' || (typeof activeChannelId === 'string' && activeChannelId.startsWith('chan-ai-'))) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 700, marginBottom: '2px' }}>PulseBot AI is thinking...</span>
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '14px 14px 14px 2px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: '1px solid #bae6fd'
                    }}
                  >
                    ⚡ Querying Gemini AI via n8n...
                  </div>
                </div>
              )}

              {/* Real-time Typing Indicator */}
              {currentTypers.length > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, padding: '2px 4px' }}>
                  {currentTypers.join(', ')} is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Input Bar (only on Chat tab) */}
          {widgetTab === 'chat' && (
            <div style={{ position: 'relative', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '10px',
                    marginBottom: '8px',
                    width: '280px',
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                    {POPULAR_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                          padding: '3px'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attach Popover */}
              {showAttachMenu && (
                <div
                  ref={attachMenuRef}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '40px',
                    marginBottom: '8px',
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    minWidth: '150px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#0284c7'
                    }}
                  >
                    <ImageIcon style={{ width: '15px', height: '15px' }} />
                    <span>Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#7c3aed'
                    }}
                  >
                    <FileText style={{ width: '15px', height: '15px' }} />
                    <span>Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#dc2626'
                    }}
                  >
                    <Music style={{ width: '15px', height: '15px' }} />
                    <span>Audio File</span>
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
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

              <form onSubmit={handleSend} style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                {/* Executive Tagged User & EA Follow-up Bar */}
                {taggedUser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      border: requireEaFollowup ? '1px solid #fde68a' : '1px solid #cbd5e1',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      gap: '10px'
                    }}
                  >
                    {/* Assignee Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AtSign style={{ width: '12px', height: '12px', color: '#0284c7' }} />
                        <span>Assignee:</span>
                      </span>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          padding: '2px 8px 2px 4px',
                          borderRadius: '20px',
                          color: '#0f172a'
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#0284c7',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 800
                          }}
                        >
                          {taggedUser.avatar || taggedUser.name?.[0]?.toUpperCase() || '👤'}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{taggedUser.name}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: taggedUser.role === 'EA' ? '#fef3c7' : '#e0f2fe',
                            color: taggedUser.role === 'EA' ? '#b45309' : '#0369a1'
                          }}
                        >
                          {taggedUser.role}
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
                            fontSize: '11px',
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
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '3px 8px',
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
                          width: '26px',
                          height: '15px',
                          borderRadius: '10px',
                          background: requireEaFollowup ? '#f59e0b' : '#cbd5e1',
                          position: 'relative',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '11px',
                            height: '11px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '2px',
                            left: requireEaFollowup ? '13px' : '2px',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Zap style={{ width: '12px', height: '12px', color: requireEaFollowup ? '#d97706' : '#94a3b8' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: requireEaFollowup ? '#b45309' : '#64748b' }}>
                          EA Follow-Up
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Previews */}
                {(selectedImage || selectedFile) && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {selectedImage && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>
                        <img src={selectedImage.dataUrl} alt="thumb" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
                        <span>📸 {selectedImage.name} • 🔍 OCR Lot Scan</span>
                        <button type="button" onClick={() => setSelectedImage(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}>✕</button>
                      </div>
                    )}
                    {selectedFile && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#6d28d9', fontWeight: 700 }}>
                        <FileText style={{ width: '14px', height: '14px' }} />
                        <span>{selectedFile.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}>✕</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Voice Recording Mode or Standard Input */}
                {isRecording ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', flex: 1 }}>
                      Recording... {formattedTime}
                    </span>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 style={{ width: '15px', height: '15px' }} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendVoiceNote}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Send Voice
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {/* Emoji */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        color: '#0284c7',
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title="Insert Emoji"
                    >
                      <Smile style={{ width: '15px', height: '15px' }} />
                    </button>

                    {/* Paperclip */}
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        color: '#0284c7',
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title="Attach File"
                    >
                      <Paperclip style={{ width: '15px', height: '15px' }} />
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
                        padding: '6px 9px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        transition: 'all 0.15s ease',
                        boxShadow: taggedUser ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none'
                      }}
                      title="Tag team member to assign task & transmit in real time"
                    >
                      <AtSign style={{ width: '13px', height: '13px' }} />
                      <span style={{ fontSize: '0.72rem' }}>{taggedUser ? taggedUser.name.split(' ')[0] : 'Tag'}</span>
                    </button>

                    {/* Tag User Executive Command Popover */}
                    {showTagMenu && (
                      <div
                        ref={tagMenuRef}
                        style={{
                          position: 'absolute',
                          bottom: '52px',
                          left: '8px',
                          right: '8px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '14px',
                          padding: '10px',
                          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                          zIndex: 1001,
                          maxHeight: '280px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          animation: 'fadeIn 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AtSign style={{ width: '13px', height: '13px', color: '#0284c7' }} />
                            <span>Assign Task To Team Member</span>
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8' }}>
                            {users.length} profiles
                          </span>
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
                              fontSize: '0.78rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              outline: 'none',
                              background: '#f8fafc',
                              boxSizing: 'border-box'
                            }}
                            autoFocus
                          />
                        </div>

                        <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                    if (!inputText) {
                                      setInputText(`Please prepare `);
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
                                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                                        {u.name}
                                      </div>
                                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                        {u.department || 'Operations'}
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '0.67rem',
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

                    {/* Input */}
                    <input
                      type="text"
                      placeholder={`Message ${activeChannel.name}...`}
                      value={inputText}
                      onChange={handleInputChange}
                      className="input-text"
                      style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem', flex: 1 }}
                    />

                    {/* Mic Button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0284c7',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Record Voice Note"
                    >
                      <Mic style={{ width: '15px', height: '15px' }} />
                    </button>

                    {/* Send */}
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 0.75rem', background: '#25D366', borderColor: '#25D366', color: '#ffffff' }}>
                      <Send style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Trigger Circle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366 0%, #00A884 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45)',
          border: '2px solid #ffffff',
          cursor: 'pointer',
          position: 'relative',
          transition: 'transform 0.2s ease'
        }}
        title="Open TaskPulse Messenger & AI Assistant"
      >
        {isOpen ? <X style={{ width: '24px', height: '24px' }} /> : <MessageSquare style={{ width: '24px', height: '24px' }} />}
        {unreadTotal > 0 && !isOpen && (
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#ffffff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ffffff' }}>
            {unreadTotal}
          </span>
        )}
      </button>

      {/* Lightbox Preview if clicked in widget */}
      {previewImage && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 100000, background: 'rgba(15, 23, 42, 0.85)' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: '-36px', right: 0, background: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#000' }}
            >
              ✕
            </button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '10px' }} />
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
