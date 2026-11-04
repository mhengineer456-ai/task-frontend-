import React, { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

/**
 * Lightweight, zero-dependency Syntax Tokenizer for Code Blocks
 */
const highlightCodeTokens = (code, language = 'text') => {
  if (!code) return '';
  const lang = (language || 'text').toLowerCase();

  const keywordsByLang = {
    javascript: /\b(const|let|var|function|return|if|else|switch|case|break|for|while|do|import|export|default|from|class|extends|new|this|async|await|try|catch|finally|throw|typeof|instanceof|void|yield)\b/g,
    typescript: /\b(const|let|var|function|return|if|else|switch|case|break|for|while|do|import|export|default|from|class|extends|new|this|async|await|try|catch|finally|throw|typeof|instanceof|interface|type|enum|as|any|number|string|boolean|void)\b/g,
    python: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|in|is|not|and|or|self|None|True|False)\b/g,
    sql: /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|COUNT|SUM|AVG|MAX|MIN|DISTINCT|UNION|ALL|EXISTS|CASE|WHEN|THEN|END)\b/gi,
    json: /\b(true|false|null)\b/g,
    bash: /\b(echo|cd|ls|mkdir|rm|cp|mv|cat|grep|awk|sed|curl|wget|git|npm|node|npx|yarn|sudo|chmod|chown|source|export|if|then|fi|for|do|done)\b/g,
    html: /\b(doctype|html|head|title|body|div|span|p|a|ul|ol|li|table|tr|th|td|form|input|button|script|style|link|meta)\b/gi,
    css: /\b(display|flex|grid|margin|padding|color|background|border|width|height|font|position|top|left|right|bottom|transform|transition|opacity|z-index|overflow)\b/g
  };

  const kwRegex = keywordsByLang[lang] || keywordsByLang.javascript;

  // Split into tokens: strings, comments, numbers, keywords
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b)/g;

  const parts = code.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Comments
    if (/^(\/\/|#|--|\/\*)/.test(part)) {
      return (
        <span key={idx} style={{ color: '#8b949e', fontStyle: 'italic' }}>
          {part}
        </span>
      );
    }
    // Strings
    if (/^["'`]/.test(part)) {
      return (
        <span key={idx} style={{ color: '#a5d6ff' }}>
          {part}
        </span>
      );
    }
    // Numbers
    if (/^\d+(?:\.\d+)?$/.test(part)) {
      return (
        <span key={idx} style={{ color: '#79c0ff' }}>
          {part}
        </span>
      );
    }
    // Keywords in remaining text
    const subParts = part.split(kwRegex);
    return subParts.map((sub, sIdx) => {
      if (kwRegex.test(sub)) {
        return (
          <span key={`${idx}-${sIdx}`} style={{ color: '#ff7b72', fontWeight: 600 }}>
            {sub}
          </span>
        );
      }
      return <span key={`${idx}-${sIdx}`}>{sub}</span>;
    });
  });
};

/**
 * Modern ChatGPT / Claude style Code Block with Traffic Lights & Copy Button
 */
export const RichCodeBlock = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'text').replace(/^language-/, '').trim() || 'code';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => highlightCodeTokens(code, cleanLang), [code, cleanLang]);

  return (
    <div
      style={{
        margin: '12px 0',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#0d1117',
        border: '1px solid #30363d',
        boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 14px',
          background: '#161b22',
          borderBottom: '1px solid #30363d'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginLeft: '4px'
            }}
          >
            {cleanLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: copied ? 'rgba(46, 160, 67, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: copied ? '1px solid #3fb950' : '1px solid rgba(255, 255, 255, 0.12)',
            color: copied ? '#3fb950' : '#c9d1d9',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Copy code to clipboard"
        >
          {copied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>

      {/* Code Body */}
      <pre
        style={{
          margin: 0,
          padding: '12px 16px',
          overflowX: 'auto',
          fontSize: '12.5px',
          lineHeight: '1.6',
          color: '#e6edf3',
          fontFamily: 'inherit'
        }}
      >
        <code>{highlighted}</code>
      </pre>
    </div>
  );
};

/**
 * Inline Math Expression Formatter: $E = mc^2$ or $$formula$$
 */
const renderMathToken = (expression, isBlock = false) => {
  return (
    <span
      style={{
        fontFamily: '"KaTeX_Main", "Times New Roman", Times, serif',
        fontStyle: 'italic',
        background: isBlock ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
        padding: isBlock ? '8px 14px' : '1px 5px',
        borderRadius: '6px',
        display: isBlock ? 'block' : 'inline',
        margin: isBlock ? '8px 0' : '0 2px',
        border: '1px solid rgba(0,0,0,0.08)',
        fontSize: isBlock ? '1.05em' : '0.98em',
        letterSpacing: '0.3px',
        overflowX: isBlock ? 'auto' : 'visible'
      }}
    >
      {expression}
    </span>
  );
};

/**
 * Safe Link & Inline Token Parser
 * Handles: bold, italic, strikethrough, inline code, inline math, and safe links
 */
const parseInlineTokens = (text, isSelf, onImageClick) => {
  if (!text) return null;

  // 1. Links & Images: [text](url) or ![text](url)
  const linkRegex = /(!)?\[(.*?)\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const isImg = match[1] === '!';
    const linkText = match[2];
    const linkUrl = match[3];

    if (isImg) {
      parts.push(
        <img
          key={`img-${match.index}`}
          src={linkUrl}
          alt={linkText}
          onClick={() => onImageClick && onImageClick(linkUrl)}
          style={{
            maxWidth: '100%',
            maxHeight: '260px',
            borderRadius: '8px',
            margin: '6px 0',
            cursor: onImageClick ? 'pointer' : 'default',
            display: 'block'
          }}
        />
      );
    } else {
      const isPdf = linkUrl.includes('/pdf/');
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isSelf ? '#ffffff' : '#0284c7',
            fontWeight: 700,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            display: isPdf ? 'inline-flex' : 'inline',
            alignItems: 'center',
            gap: '4px',
            background: isPdf ? (isSelf ? 'rgba(255,255,255,0.2)' : '#e0f2fe') : 'transparent',
            padding: isPdf ? '2px 8px' : '0',
            borderRadius: isPdf ? '6px' : '0'
          }}
        >
          <span>{linkText}</span>
          {!isPdf && <ExternalLink style={{ width: '11px', height: '11px', display: 'inline', opacity: 0.7 }} />}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // 2. Inline Code: `code`
  const withCode = parts.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const segments = part.split(/(`[^`]+`)/g);
    return segments.map((seg, sIdx) => {
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
        return (
          <code
            key={`c-${pIdx}-${sIdx}`}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '11.5px',
              padding: '2px 6px',
              margin: '0 3px',
              borderRadius: '5px',
              background: isSelf ? 'rgba(0,0,0,0.35)' : 'rgba(15, 23, 42, 0.08)',
              color: isSelf ? '#7dd3fc' : '#0369a1',
              fontWeight: 600,
              border: isSelf ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(15, 23, 42, 0.12)'
            }}
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      return seg;
    });
  });

  // 3. Inline Math: $formula$
  const withMath = withCode.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const mathSegments = part.split(/(\$[^\$]+?\$)/g);
    return mathSegments.map((seg, sIdx) => {
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        return <React.Fragment key={`m-${pIdx}-${sIdx}`}>{renderMathToken(seg.slice(1, -1))}</React.Fragment>;
      }
      return seg;
    });
  });

  // 4. Bold Text: **bold**
  const withBold = withMath.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const boldSegments = part.split(/(\*\*.*?\*\*)/g);
    return boldSegments.map((seg, sIdx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={`b-${pIdx}-${sIdx}`} style={{ fontWeight: 800 }}>
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return seg;
    });
  });

  // 5. Italic Text: *italic* or _italic_
  const withItalic = withBold.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const italicSegments = part.split(/(\*[^*\n]+\*|_[^_\n]+_)/g);
    return italicSegments.map((seg, sIdx) => {
      if ((seg.startsWith('*') && seg.endsWith('*')) || (seg.startsWith('_') && seg.endsWith('_'))) {
        return (
          <em key={`i-${pIdx}-${sIdx}`} style={{ fontStyle: 'italic' }}>
            {seg.slice(1, -1)}
          </em>
        );
      }
      return seg;
    });
  });

  // 6. Strikethrough: ~~text~~
  const withStrike = withItalic.flatMap((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const strikeSegments = part.split(/(~~.*?~~)/g);
    return strikeSegments.map((seg, sIdx) => {
      if (seg.startsWith('~~') && seg.endsWith('~~')) {
        return (
          <del key={`s-${pIdx}-${sIdx}`} style={{ textDecoration: 'line-through', opacity: 0.75 }}>
            {seg.slice(2, -2)}
          </del>
        );
      }
      return seg;
    });
  });

  return withStrike;
};

/**
 * Professional AI Message Renderer (ChatGPT / Meta AI Standard)
 */
export default function AiMessageRenderer({
  text = '',
  isSelf = false,
  isStreaming = false,
  onImageClick = null,
  streamingCursor = true
}) {
  if (!text) {
    if (isStreaming) {
      return (
        <span className="ai-streaming-cursor" style={{ color: '#0284c7', fontWeight: 800, animation: 'pulse 1s infinite' }}>
          ▋
        </span>
      );
    }
    return null;
  }

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

    // Fenced Code Block: ```language ... ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'code';
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      elements.push(
        <RichCodeBlock key={`code-${elements.length}-${i}`} code={codeLines.join('\n')} language={lang} />
      );
      continue;
    }

    // Display Math: $$ ... $$
    if (line.trim().startsWith('$$')) {
      i++;
      const mathLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('$$')) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing $$
      elements.push(
        <div key={`math-${elements.length}-${i}`}>{renderMathToken(mathLines.join('\n'), true)}</div>
      );
      continue;
    }

    // Markdown Table: | Col 1 | Col 2 |
    if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerLine = line;
      const separatorLine = lines[i + 1];
      i += 2;

      const parseRow = (r) => {
        const trimmed = r.trim();
        const core = trimmed.replace(/^\|/, '').replace(/\|$/, '');
        return core.split('|').map((cell) => cell.trim());
      };

      // Extract alignment from separator line
      const alignTokens = parseRow(separatorLine);
      const alignments = alignTokens.map((tok) => {
        const left = tok.startsWith(':');
        const right = tok.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        return 'left';
      });

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
            margin: '12px 0',
            borderRadius: '10px',
            border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2e8f0',
            background: isSelf ? 'rgba(0,0,0,0.18)' : '#ffffff',
            boxShadow: isSelf ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'
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
                  background: isSelf ? 'rgba(255,255,255,0.12)' : '#f8fafc',
                  borderBottom: isSelf ? '2px solid rgba(255,255,255,0.2)' : '2px solid #cbd5e1'
                }}
              >
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    style={{
                      padding: '9px 14px',
                      fontWeight: 800,
                      color: isSelf ? '#ffffff' : '#0f172a',
                      whiteSpace: 'nowrap',
                      textAlign: alignments[hIdx] || 'left',
                      borderRight: isSelf ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9'
                    }}
                  >
                    {parseInlineTokens(h, isSelf, onImageClick)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((rowCells, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    background: rIdx % 2 === 0 ? 'transparent' : isSelf ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderBottom: isSelf ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9'
                  }}
                >
                  {rowCells.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: '8px 14px',
                        color: isSelf ? '#f8fafc' : '#1e293b',
                        whiteSpace: 'nowrap',
                        textAlign: alignments[cIdx] || 'left',
                        borderRight: isSelf ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f8fafc'
                      }}
                    >
                      {parseInlineTokens(cell, isSelf, onImageClick)}
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

    // Blockquote: > Quote text
    if (line.trim().startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '');
      elements.push(
        <div
          key={`quote-${elements.length}-${i}`}
          style={{
            margin: '8px 0',
            padding: '8px 14px',
            borderLeft: isSelf ? '3px solid #7dd3fc' : '3px solid #0284c7',
            background: isSelf ? 'rgba(255,255,255,0.08)' : '#f0f9ff',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.86rem',
            lineHeight: '1.5',
            color: isSelf ? '#f0f9ff' : '#0369a1',
            fontStyle: 'normal'
          }}
        >
          {parseInlineTokens(quoteText, isSelf, onImageClick)}
        </div>
      );
      i++;
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
            margin: '12px 0',
            width: '100%'
          }}
        />
      );
      i++;
      continue;
    }

    // Headings: #### H4
    if (line.startsWith('#### ')) {
      elements.push(
        <div
          key={`h4-${i}`}
          style={{
            fontSize: '13px',
            fontWeight: 800,
            margin: '10px 0 4px 0',
            color: isSelf ? '#ffffff' : '#0369a1',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: isSelf ? 'rgba(255,255,255,0.12)' : '#f0f9ff',
            border: isSelf ? '1px solid rgba(255,255,255,0.2)' : '1px solid #bae6fd'
          }}
        >
          <span>🔹</span>
          <span>{parseInlineTokens(line.replace(/^####\s+/, ''), isSelf, onImageClick)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Headings: ### H3
    if (line.startsWith('### ')) {
      elements.push(
        <div
          key={`h3-${i}`}
          style={{
            fontSize: '14.5px',
            fontWeight: 800,
            margin: '12px 0 4px 0',
            color: isSelf ? '#ffffff' : 'var(--text-primary, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {parseInlineTokens(line.replace(/^###\s+/, ''), isSelf, onImageClick)}
        </div>
      );
      i++;
      continue;
    }

    // Headings: ## H2
    if (line.startsWith('## ')) {
      elements.push(
        <div
          key={`h2-${i}`}
          style={{
            fontSize: '15.5px',
            fontWeight: 800,
            margin: '14px 0 6px 0',
            color: isSelf ? '#ffffff' : 'var(--text-primary, #0f172a)'
          }}
        >
          {parseInlineTokens(line.replace(/^##\s+/, ''), isSelf, onImageClick)}
        </div>
      );
      i++;
      continue;
    }

    // Headings: # H1
    if (line.startsWith('# ')) {
      elements.push(
        <div
          key={`h1-${i}`}
          style={{
            fontSize: '17px',
            fontWeight: 900,
            margin: '16px 0 8px 0',
            color: isSelf ? '#ffffff' : 'var(--text-primary, #0f172a)'
          }}
        >
          {parseInlineTokens(line.replace(/^#\s+/, ''), isSelf, onImageClick)}
        </div>
      );
      i++;
      continue;
    }

    // Numbered Sequential Steps: 1. Step title
    if (/^\s*\d+\.\s+/.test(line)) {
      const matchNum = line.match(/^\s*(\d+)\.\s+(.*)$/);
      const stepNum = matchNum ? matchNum[1] : '1';
      const stepContent = matchNum ? matchNum[2] : line;

      elements.push(
        <div
          key={`step-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0',
            lineHeight: '1.5'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              borderRadius: '50%',
              background: isSelf ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
              color: isSelf ? '#ffffff' : '#0284c7',
              fontSize: '11px',
              fontWeight: 800,
              marginTop: '2px',
              flexShrink: 0
            }}
          >
            {stepNum}
          </span>
          <div style={{ flex: 1 }}>{parseInlineTokens(stepContent, isSelf, onImageClick)}</div>
        </div>
      );
      i++;
      continue;
    }

    // Bullet Points & Key-Value Status Badges: * or - or •
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
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  {rawVal}
                </span>
              ) : /wip|progress|ongoing/i.test(rawVal) ? (
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fcd34d',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  ⏳ {rawVal}
                </span>
              ) : (
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontWeight: 800,
                    fontSize: '0.78rem'
                  }}
                >
                  {rawVal}
                </span>
              )
            ) : isQuantity ? (
              <span
                style={{
                  background: isSelf ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                  color: isSelf ? '#ffffff' : '#0f172a',
                  border: isSelf ? '1px solid rgba(255,255,255,0.3)' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '1px 8px',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}
              >
                {rawVal}
              </span>
            ) : isSupervisor ? (
              <span
                style={{
                  background: isSelf ? 'rgba(255,255,255,0.15)' : '#f0f9ff',
                  color: isSelf ? '#ffffff' : '#0369a1',
                  border: isSelf ? '1px solid rgba(255,255,255,0.25)' : '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '1px 8px',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                {rawVal}
              </span>
            ) : (
              <span style={{ color: isSelf ? '#ffffff' : '#1e293b', fontWeight: 600 }}>
                {parseInlineTokens(rawVal, isSelf, onImageClick)}
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
            gap: '8px',
            margin: '3px 0',
            lineHeight: '1.5'
          }}
        >
          <span style={{ color: isSelf ? 'rgba(255,255,255,0.7)' : '#0284c7', fontWeight: 800, minWidth: '10px' }}>•</span>
          <div style={{ flex: 1 }}>{parseInlineTokens(cleanLine, isSelf, onImageClick)}</div>
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph or empty line
    elements.push(
      <div
        key={`p-${i}`}
        style={{
          minHeight: line.trim() === '' ? '0.45rem' : 'auto',
          lineHeight: '1.55',
          fontStyle: /^\*.*\*$/.test(line.trim()) ? 'italic' : 'normal',
          opacity: /^\*.*\*$/.test(line.trim()) ? 0.92 : 1
        }}
      >
        {parseInlineTokens(line, isSelf, onImageClick)}
      </div>
    );
    i++;
  }

  return (
    <div className="ai-message-body" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
      {elements}
      {isStreaming && streamingCursor && (
        <span
          className="ai-streaming-cursor"
          style={{
            display: 'inline-block',
            color: '#0284c7',
            fontWeight: 800,
            marginLeft: '2px',
            animation: 'pulse 1s infinite'
          }}
        >
          ▋
        </span>
      )}
    </div>
  );
}
