import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

/**
 * Intelligent Contextual Follow-up Chips Generator
 */
export const getContextualFollowups = (text = '', prompt = '') => {
  const combined = `${prompt} ${text}`.toLowerCase();

  if (combined.includes('lot') || combined.includes('cutting') || combined.includes('fabric') || combined.includes('karigar')) {
    return [
      { id: 'f1', label: '📊 Show comparison table', prompt: 'Please provide a comparison table for the cutting and completion status of these lots.' },
      { id: 'f2', label: '🔍 Check pending lots', prompt: 'Which lots are currently pending in the cutting department?' },
      { id: 'f3', label: '📄 Generate summary report', prompt: 'Summarize the key production highlights and milestones for these orders.' }
    ];
  }

  if (combined.includes('code') || combined.includes('function') || combined.includes('api') || combined.includes('sql') || combined.includes('```')) {
    return [
      { id: 'f1', label: '💡 Add error handling', prompt: 'Can you show how to add robust error handling and edge case validation to this code?' },
      { id: 'f2', label: '⚡ Optimize performance', prompt: 'What are the best performance optimizations and time complexity improvements for this?' },
      { id: 'f3', label: '🧪 Write test cases', prompt: 'Can you provide unit test examples verifying this implementation?' }
    ];
  }

  if (combined.includes('vs') || combined.includes('compare') || combined.includes('difference') || combined.includes('table')) {
    return [
      { id: 'f1', label: '🎯 Which option is best?', prompt: 'Based on this comparison, which option do you recommend for our setup and why?' },
      { id: 'f2', label: '⚠️ What are the main risks?', prompt: 'What are the critical risks and potential downsides of each option?' },
      { id: 'f3', label: '🚀 Next implementation steps', prompt: 'What are the concrete next steps to implement the recommended option?' }
    ];
  }

  if (combined.includes('how to') || combined.includes('steps') || combined.includes('tutorial') || combined.includes('guide')) {
    return [
      { id: 'f1', label: '💡 Give a practical example', prompt: 'Can you give a concrete, realistic real-world example of this in action?' },
      { id: 'f2', label: '⚠️ Common mistakes to avoid', prompt: 'What are the most common mistakes or pitfalls people make here and how do we prevent them?' },
      { id: 'f3', label: '📝 Summarize key takeaways', prompt: 'Please give me a quick 3-bullet executive summary of this.' }
    ];
  }

  // General fallback followups
  return [
    { id: 'f1', label: '✨ Explain step-by-step', prompt: 'Could you explain this step-by-step in simpler terms?' },
    { id: 'f2', label: '📊 Show comparison table', prompt: 'Can you organize these key points into a clean comparison table?' },
    { id: 'f3', label: '💡 Give a practical example', prompt: 'Could you provide a practical example demonstrating this?' }
  ];
};

/**
 * ChatGPT / Meta AI Style Message Action Toolbar
 */
export default function AiMessageActions({
  message,
  onRegenerate,
  onCopy,
  onShare,
  onFeedback,
  onFollowup,
  isLastMessage = false,
  isStreaming = false
}) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(message?.feedbackRating || null); // 'like' | 'dislike' | null
  const [shared, setShared] = useState(false);

  if (isStreaming) return null;

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.text);
    } else {
      navigator.clipboard.writeText(message.text || '');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (onShare) {
      onShare(message);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PulseBot AI Response',
          text: message.text
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard.writeText(message.text || '');
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleRating = (newRating) => {
    const next = rating === newRating ? null : newRating;
    setRating(next);
    if (onFeedback) {
      onFeedback(message.id, next);
    }
  };

  const followups = isLastMessage ? getContextualFollowups(message.text, message.prompt) : [];

  return (
    <div className="ai-message-actions-container" style={{ marginTop: '6px' }}>
      {/* Unobtrusive Action Icons Bar */}
      <div
        className="ai-actions-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: 0.85,
          transition: 'opacity 0.2s ease'
        }}
      >
        {/* Copy Response */}
        <button
          type="button"
          onClick={handleCopy}
          className="ai-action-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: copied ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 7px',
            color: copied ? '#16a34a' : 'var(--text-secondary, #64748b)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Copy response to clipboard"
        >
          {copied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Regenerate Response */}
        {onRegenerate && (
          <button
            type="button"
            onClick={() => onRegenerate(message.id)}
            className="ai-action-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 7px',
              color: 'var(--text-secondary, #64748b)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Regenerate this response"
          >
            <RotateCw style={{ width: '13px', height: '13px' }} />
            <span>Regenerate</span>
          </button>
        )}

        {/* Like / Helpful */}
        <button
          type="button"
          onClick={() => handleRating('like')}
          className="ai-action-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: rating === 'like' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 7px',
            color: rating === 'like' ? '#0284c7' : 'var(--text-secondary, #64748b)',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Good response"
        >
          <ThumbsUp style={{ width: '13px', height: '13px', fill: rating === 'like' ? '#0284c7' : 'none' }} />
        </button>

        {/* Dislike / Not helpful */}
        <button
          type="button"
          onClick={() => handleRating('dislike')}
          className="ai-action-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: rating === 'dislike' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 7px',
            color: rating === 'dislike' ? '#ef4444' : 'var(--text-secondary, #64748b)',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Poor response"
        >
          <ThumbsDown style={{ width: '13px', height: '13px', fill: rating === 'dislike' ? '#ef4444' : 'none' }} />
        </button>

        {/* Share Response */}
        <button
          type="button"
          onClick={handleShare}
          className="ai-action-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: shared ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 7px',
            color: shared ? '#0284c7' : 'var(--text-secondary, #64748b)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Share response"
        >
          <Share2 style={{ width: '13px', height: '13px' }} />
          <span>{shared ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Contextual Suggested Follow-up Chips (Meta AI / ChatGPT Style) */}
      {followups.length > 0 && onFollowup && (
        <div
          className="ai-followup-chips"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '8px'
          }}
        >
          {followups.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onFollowup(chip.prompt)}
              className="ai-chip-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--bg-input, rgba(255,255,255,0.7))',
                border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                borderRadius: '16px',
                padding: '4px 11px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text-primary, #1e293b)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(2, 132, 199, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, rgba(0,0,0,0.1))';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
              }}
            >
              <span>{chip.label}</span>
              <ArrowRight style={{ width: '10px', height: '10px', opacity: 0.6 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
