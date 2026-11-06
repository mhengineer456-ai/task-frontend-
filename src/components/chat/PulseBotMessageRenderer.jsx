import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Copy,
  Check,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2
} from 'lucide-react';

/**
 * PulseBotMessageRenderer
 * 
 * Takes raw PulseBot AI output and renders an executive-grade, beautifully structured,
 * and completely un-congested layout:
 * 1. Resolves broken markdown bold tags (e.g. `**Total: ** 123` -> `Total: 123`).
 * 2. Identifies Executive KPI breakdown summaries and renders them as sleek metric cards with a progress bar.
 * 3. Identifies multi-lot pipe-separated lines (e.g. `1. Lot 61271: JO-1514 | ...`) and renders them
 *    as a high-contrast Responsive Data Table or thumb-friendly Lot Cards with search & filter.
 * 4. Provides interactive follow-up suggestion chips.
 * 5. Perfectly optimized for both Mobile and Web viewports.
 */

export default function PulseBotMessageRenderer({
  text,
  isSelf = false,
  onImageClick = null,
  onSendFollowup = null,
  onDelete = null
}) {
  const [copiedLotId, setCopiedLotId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [lotSearch, setLotSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Clean and normalize broken markdown bold syntax before parsing
  const normalizedText = useMemo(() => {
    if (!text || typeof text !== 'string') return '';
    return text
      // Fix **Key: ** Val -> **Key**: Val
      .replace(/\*\*([^*:\n]+?):\s*\*\*/g, '**$1:**')
      // Fix **Key : ** -> **Key:**
      .replace(/\*\*([^*:\n]+?)\s*:\s*\*\*/g, '**$1:**')
      // Normalize lot header bullets
      .replace(/^(\d+)\.\s+\*\*Lot\s+(\d+)\*\*/gm, '$1. Lot $2');
  }, [text]);

  // 2. Parse text into structured sections:
  // - introText
  // - kpiBreakdown: { total, cutComplete, cancelled, pending, rawItems }
  // - middleText
  // - lotsList: [ { index, lot, jo, item, fabric, qty, emb, rawNote } ]
  // - outroText
  const parsedData = useMemo(() => {
    if (!normalizedText) return { intro: '', kpis: null, lots: [], outro: '' };

    const lines = normalizedText.split('\n');
    const introLines = [];
    const kpiItems = [];
    const lotItems = [];
    const outroLines = [];
    let state = 'intro'; // 'intro' -> 'kpi' -> 'mid' -> 'lots' -> 'outro'

    // Regex for lot line e.g.:
    // "1. Lot 61271: JO-1514 | LOWER (REGULAR) | Fabric: MH FLEECE | Qty: 12 SETS | Emb: NA"
    // or "1. Lot 61307: * (Pending allocation details logged)*"
    const lotLineRegex = /^\s*(\d+)\.\s+(?:Lot\s*[:#-]?\s*(\w+)|(\w+))\s*[:|-]\s*(.+)$/i;

    // Regex for KPI summary bullets e.g.:
    // "• **Total Master Orders:** 331 Lots" or "• **Cut Complete: ** 290 Lots" or "* Cut Complete: 290 Lots"
    const kpiBulletRegex = /^\s*[*•-]\s*[*]*\s*(Total[^:*]+|Cut[^:*]+|Cancelled[^:*]+|Cutting[^:*]+|Pending[^:*]+|WIP[^:*]+)[*]*\s*:\s*[*]*\s*(.+)$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for KPI summary line
      const kpiMatch = trimmed.match(kpiBulletRegex);
      if (kpiMatch) {
        state = 'kpi';
        const label = kpiMatch[1].replace(/[*_#]/g, '').trim();
        let valueWithSub = kpiMatch[2].replace(/[*_#]/g, '').trim();
        valueWithSub = valueWithSub.replace(/^[:* ]+|[:* ]+$/g, '').trim();

        // Extract count number + subtext in parentheses e.g. "290 Lots (Factory floor par...)"
        const parenMatch = valueWithSub.match(/^([^(]+)(?:\(([^)]+)\))?/);
        const count = parenMatch ? parenMatch[1].trim() : valueWithSub;
        const sub = parenMatch && parenMatch[2] ? parenMatch[2].trim() : '';

        kpiItems.push({ label, count, sub, raw: trimmed });
        continue;
      }

      // Check for Lot Specification Line
      const lotMatch = trimmed.match(lotLineRegex);
      if (lotMatch) {
        state = 'lots';
        const idx = lotMatch[1];
        const lotNum = lotMatch[2] || lotMatch[3];
        const rest = lotMatch[4];

        // Parse pipe-separated segments: "JO-1514 | LOWER (REGULAR) | Fabric: MH FLEECE | Qty: 12 SETS | Emb: NA"
        const pipes = rest.split('|').map(s => s.trim()).filter(Boolean);

        let jo = '';
        let item = '';
        let fabric = '';
        let qty = '';
        let emb = '';
        let note = '';

        if (pipes.length >= 2) {
          // Typically: [0] JO-1514, [1] Style/Garment, [2] Fabric, [3] Qty, [4] Emb
          pipes.forEach(p => {
            if (/^JO[-_\s]*\d+/i.test(p)) {
              jo = p;
            } else if (/^fabric\s*:/i.test(p)) {
              fabric = p.replace(/^fabric\s*:\s*/i, '').trim();
            } else if (/^(?:qty|quantity)\s*:/i.test(p)) {
              qty = p.replace(/^(?:qty|quantity)\s*:\s*/i, '').trim();
            } else if (/^(?:emb|embroidery)\s*:/i.test(p)) {
              emb = p.replace(/^(?:emb|embroidery)\s*:\s*/i, '').trim();
            } else if (!item) {
              item = p;
            } else {
              note = (note ? note + ' • ' : '') + p;
            }
          });
        } else {
          item = rest;
        }

        lotItems.push({
          index: idx,
          lot: lotNum,
          jo: jo || 'JO-Pending',
          item: item || 'Garment Lot',
          fabric: fabric || 'Standard Fabric',
          qty: qty || 'Standard Batch',
          emb: emb || 'NA',
          note
        });
        continue;
      }

      // If we are currently in 'kpi' and hit normal text, transition to 'mid'
      if (state === 'kpi' && trimmed) {
        state = 'mid';
      }

      // If we are in 'lots' and hit closing questions/text, transition to 'outro'
      if (state === 'lots' && trimmed && !lotMatch) {
        state = 'outro';
      }

      if (state === 'intro') {
        introLines.push(line);
      } else if (state === 'mid') {
        introLines.push(line);
      } else if (state === 'outro') {
        outroLines.push(line);
      }
    }

    return {
      intro: introLines.join('\n').trim(),
      kpis: kpiItems.length >= 2 ? kpiItems : null,
      lots: lotItems,
      outro: outroLines.join('\n').trim()
    };
  }, [normalizedText]);

  // Filtered lots for search bar
  const filteredLots = useMemo(() => {
    if (!parsedData.lots || parsedData.lots.length === 0) return [];
    const q = lotSearch.toLowerCase().trim();
    if (!q) return parsedData.lots;
    return parsedData.lots.filter(l =>
      l.lot.toLowerCase().includes(q) ||
      l.jo.toLowerCase().includes(q) ||
      l.item.toLowerCase().includes(q) ||
      l.fabric.toLowerCase().includes(q) ||
      l.emb.toLowerCase().includes(q)
    );
  }, [parsedData.lots, lotSearch]);

  const handleCopyLot = (lotObj) => {
    const textToCopy = `Lot ${lotObj.lot}: ${lotObj.jo} | ${lotObj.item} | Fabric: ${lotObj.fabric} | Qty: ${lotObj.qty} | Emb: ${lotObj.emb}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLotId(lotObj.lot);
    setTimeout(() => setCopiedLotId(null), 1800);
  };

  const handleCopyAllLots = () => {
    if (!parsedData.lots || parsedData.lots.length === 0) return;
    const allText = parsedData.lots.map(l =>
      `Lot ${l.lot}: ${l.jo} | ${l.item} | Fabric: ${l.fabric} | Qty: ${l.qty} | Emb: ${l.emb}`
    ).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Helper to format regular inline text with clean bolding
  const formatParagraph = (rawStr) => {
    if (!rawStr) return null;
    const paragraphs = rawStr.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      return (
        <div key={pIdx} className="pulsebot-paragraph">
          {lines.map((l, lIdx) => {
            const trimmed = l.trim();
            if (!trimmed) return <div key={lIdx} style={{ height: '6px' }} />;

            // Clean up broken bold tags before splitting
            const cleanL = trimmed
              .replace(/\*\*([^*:\n]+):\s*\*\*/g, '**$1:**')
              .replace(/\*\*([^*:\n]+)\s+\*\*/g, '**$1**');

            // Process inline bold **text**
            const parts = cleanL.split(/(\*\*.*?\*\*)/g);
            return (
              <div key={lIdx} style={{ lineHeight: '1.65', margin: '2px 0' }}>
                {parts.map((p, partIdx) => {
                  if (p.startsWith('**') && p.endsWith('**') && p.length >= 4) {
                    return (
                      <strong key={partIdx} className="pulsebot-strong">
                        {p.slice(2, -2)}
                      </strong>
                    );
                  }
                  // Clean any orphan asterisks so raw stars never display
                  return <span key={partIdx}>{p.replace(/\*\*/g, '')}</span>;
                })}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="pulsebot-response-container">
      {/* 1. Conversational Intro Section */}
      {parsedData.intro && (
        <div className="pulsebot-intro-text">
          {formatParagraph(parsedData.intro)}
        </div>
      )}

      {/* 2. Executive KPI Breakdown Cards */}
      {parsedData.kpis && parsedData.kpis.length > 0 && (
        <div className="pulsebot-kpi-card">
          <div className="pulsebot-kpi-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulsebot-kpi-sparkle-box">
                <Sparkles style={{ width: '15px', height: '15px', color: '#6366f1' }} />
              </div>
              <span className="pulsebot-kpi-title">Executive Production Breakdown</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulsebot-verified-tag">✓ Verified Factory Floor</span>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="btn-lot-action"
                  style={{ width: '24px', height: '24px', color: '#ef4444' }}
                  title="Delete this AI message"
                >
                  <Trash2 style={{ width: '12px', height: '12px' }} />
                </button>
              )}
            </div>
          </div>

          <div className="pulsebot-kpi-grid">
            {parsedData.kpis.map((item, idx) => {
              const lowerLabel = item.label.toLowerCase();
              let cardStyle = 'kpi-card-blue';
              let icon = '📦';

              if (lowerLabel.includes('cut complete') || lowerLabel.includes('complete')) {
                cardStyle = 'kpi-card-green';
                icon = '✂️';
              } else if (lowerLabel.includes('cancel')) {
                cardStyle = 'kpi-card-rose';
                icon = '🚫';
              } else if (lowerLabel.includes('pending') || lowerLabel.includes('uncut')) {
                cardStyle = 'kpi-card-amber';
                icon = '⏳';
              }

              return (
                <div key={idx} className={`pulsebot-kpi-item ${cardStyle}`}>
                  <div className="kpi-item-top">
                    <span className="kpi-item-icon">{icon}</span>
                    <span className="kpi-item-label">{item.label}</span>
                  </div>
                  <div className="kpi-item-value">{item.count}</div>
                  {item.sub && (
                    <div className="kpi-item-sub">{item.sub}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Structured Lots Table & Specification Cards */}
      {parsedData.lots && parsedData.lots.length > 0 && (
        <div className="pulsebot-lots-wrapper">
          {/* Section Header with Controls */}
          <div className="pulsebot-lots-header">
            <div className="pulsebot-lots-title-box">
              <div className="pulsebot-lots-icon-box">
                <Scissors style={{ width: '16px', height: '16px', color: '#0284c7' }} />
              </div>
              <div>
                <h4 className="pulsebot-lots-heading">
                  Uncut / Pending Lots Pipeline
                </h4>
                <p className="pulsebot-lots-subheading">
                  {parsedData.lots.length} Lots queued for cutting floor allocation
                </p>
              </div>
            </div>

            <div className="pulsebot-lots-actions">
              {/* Live Filter Input */}
              <div className="pulsebot-lots-search-box">
                <Search style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter lots..."
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                  className="pulsebot-lots-search-input"
                />
              </div>

              {/* View Toggle: Table vs Cards */}
              <div className="pulsebot-view-toggle">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  title="Table View"
                >
                  <TableIcon style={{ width: '13px', height: '13px' }} />
                  <span className="toggle-label-desktop">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  title="Cards View"
                >
                  <LayoutGrid style={{ width: '13px', height: '13px' }} />
                  <span className="toggle-label-desktop">Cards</span>
                </button>
              </div>

              {/* Copy All */}
              <button
                type="button"
                onClick={handleCopyAllLots}
                className="pulsebot-copy-all-btn"
                title="Copy all lots specifications"
              >
                {copiedAll ? <Check style={{ width: '13px', height: '13px', color: '#10b981' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                <span>{copiedAll ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW (High-Density Clean Web Layout) */}
          {viewMode === 'table' ? (
            <div className="pulsebot-table-container">
              <table className="pulsebot-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '110px' }}>Lot Number</th>
                    <th style={{ width: '100px' }}>Job Order</th>
                    <th>Garment Style / Item</th>
                    <th style={{ width: '130px' }}>Fabric Spec</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Quantity</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Embroidery</th>
                    <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLots.length > 0 ? (
                    filteredLots.map((item, idx) => (
                      <tr key={item.lot || idx} className="pulsebot-table-row">
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                          {item.index || idx + 1}
                        </td>
                        <td>
                          <span className="badge-lot-pill">
                            Lot {item.lot}
                          </span>
                        </td>
                        <td>
                          <span className="badge-jo-pill">
                            {item.jo}
                          </span>
                        </td>
                        <td className="item-title-cell">
                          {item.item}
                          {item.note && <span className="item-note-pill"> • {item.note}</span>}
                        </td>
                        <td>
                          <span className="badge-fabric-pill">
                            🧵 {item.fabric}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge-qty-pill">
                            {item.qty}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={item.emb.toLowerCase() === 'na' ? 'badge-emb-na' : 'badge-emb-active'}>
                            {item.emb.toLowerCase() === 'na' ? 'No Emb' : `🪡 ${item.emb}`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyLot(item)}
                            className="btn-lot-action"
                            title="Copy Lot Specs"
                          >
                            {copiedLotId === item.lot ? (
                              <Check style={{ width: '13px', height: '13px', color: '#10b981' }} />
                            ) : (
                              <Copy style={{ width: '13px', height: '13px' }} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                        No lots found matching &ldquo;{lotSearch}&rdquo;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARDS VIEW (Thumb-Friendly, Ultra-Clean Mobile & Grid Layout) */
            <div className="pulsebot-cards-grid">
              {filteredLots.length > 0 ? (
                filteredLots.map((item, idx) => (
                  <div key={item.lot || idx} className="pulsebot-lot-card">
                    <div className="lot-card-top-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="lot-number-tag">#{item.index || idx + 1}</span>
                        <span className="badge-lot-pill">Lot {item.lot}</span>
                        <span className="badge-jo-pill">{item.jo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLot(item)}
                        className="btn-lot-action"
                        title="Copy Lot Specs"
                      >
                        {copiedLotId === item.lot ? (
                          <Check style={{ width: '13px', height: '13px', color: '#10b981' }} />
                        ) : (
                          <Copy style={{ width: '13px', height: '13px' }} />
                        )}
                      </button>
                    </div>

                    <div className="lot-card-item-title">{item.item}</div>

                    <div className="lot-card-specs-row">
                      <span className="spec-tag">
                        🧵 {item.fabric}
                      </span>
                      <span className="spec-tag qty">
                        📦 {item.qty}
                      </span>
                      <span className={item.emb.toLowerCase() === 'na' ? 'spec-tag emb-na' : 'spec-tag emb-active'}>
                        {item.emb.toLowerCase() === 'na' ? 'Emb: NA' : `🪡 ${item.emb}`}
                      </span>
                    </div>

                    {item.note && (
                      <div className="lot-card-note">{item.note}</div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', width: '100%' }}>
                  No lots found matching &ldquo;{lotSearch}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Conversational Outro / Questions */}
      {parsedData.outro && (
        <div className="pulsebot-outro-text">
          {formatParagraph(parsedData.outro)}
        </div>
      )}

      {/* 5. Smart Follow-up Action Chips */}
      {parsedData.lots && parsedData.lots.length > 0 && onSendFollowup && (
        <div className="pulsebot-followup-chips">
          <button
            type="button"
            onClick={() => onSendFollowup('Sir, in 13 uncut lots me se sirf BHM embroidery wale lots filter karke dikhao')}
            className="followup-chip-btn"
          >
            🪡 Filter BHM Embroidery Lots
          </button>
          <button
            type="button"
            onClick={() => onSendFollowup('MH FLEECE fabric ka current factory stock aur cutting balance check karo')}
            className="followup-chip-btn"
          >
            🧵 Check MH FLEECE Fabric Stock
          </button>
          <button
            type="button"
            onClick={() => onSendFollowup('Download PDF for these 13 uncut lots')}
            className="followup-chip-btn"
          >
            📄 Export this Lot List to PDF
          </button>
        </div>
      )}
    </div>
  );
}
