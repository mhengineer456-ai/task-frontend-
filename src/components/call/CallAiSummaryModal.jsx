import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckSquare,
  Square,
  Copy,
  Check,
  Calendar,
  User,
  Clock,
  X,
  Plus,
  FileText,
  Send,
  AlertCircle,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { callService } from '../../api/callService';

export default function CallAiSummaryModal({
  isOpen,
  onClose,
  callData,
  currentUser,
  onTasksCreated
}) {
  const [notes, setNotes] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [summary, setSummary] = useState('');
  const [keyDecisions, setKeyDecisions] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [postToChat, setPostToChat] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [createdTasksCount, setCreatedTasksCount] = useState(null);

  // Initialize data when modal opens
  useEffect(() => {
    if (!isOpen || !callData) return;

    setNotes(callData.notes || '');
    setSummary(callData.summary || '');
    setTopic(callData.topic || '');
    setStatusMessage(null);
    setCreatedTasksCount(null);

    // If callData already has action_items
    if (callData.action_items && Array.isArray(callData.action_items) && callData.action_items.length > 0) {
      setActionItems(callData.action_items);
      setSelectedItemIds(new Set(callData.action_items.map((_, idx) => `act-${idx + 1}`)));
    } else {
      setActionItems([]);
      setSelectedItemIds(new Set());
    }

    // Try fetching latest summary from backend if empty
    if (!callData.summary && callData.id) {
      callService.getAiSummary(callData.id).then((saved) => {
        if (saved) {
          if (saved.notes) setNotes(saved.notes);
          if (saved.summary) setSummary(saved.summary);
          if (Array.isArray(saved.action_items) && saved.action_items.length > 0) {
            setActionItems(saved.action_items);
            setSelectedItemIds(new Set(saved.action_items.map((it, idx) => it.id || `act-${idx + 1}`)));
          }
        }
      }).catch(() => {});
    }
  }, [isOpen, callData]);

  if (!isOpen || !callData) return null;

  const durationSec = callData.duration_seconds || callData.durationSeconds || 0;
  const callerName = callData.caller_name || callData.callerName || 'Participant';
  const receiverName = callData.receiver_name || callData.receiverName || 'Participant';
  const channelId = callData.channel_id || callData.channelId || null;

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // Generate AI Summary and extract action items
  const handleGenerateSummary = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await callService.generateAiSummary(callData.id, {
        notes,
        topic,
        callerName,
        receiverName,
        durationSeconds: durationSec,
        channelId
      });

      if (res && res.success) {
        setSummary(res.summary || '');
        setKeyDecisions(res.keyDecisions || []);
        const items = res.actionItems || [];
        setActionItems(items);
        setSelectedItemIds(new Set(items.map((it, idx) => it.id || `act-${idx + 1}`)));
        setStatusMessage({ type: 'success', text: 'AI Meeting Summary & Action Items successfully generated!' });
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setStatusMessage({ type: 'error', text: 'Failed to generate summary. Please check your notes and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection of an action item
  const toggleItemSelection = (id) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Update field of an action item
  const updateActionItem = (index, field, value) => {
    setActionItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Add a manual action item
  const handleAddManualItem = () => {
    const newId = `act-${Date.now()}`;
    const newItem = {
      id: newId,
      title: 'New action item',
      description: 'Discussed during call',
      suggested_assignee: receiverName,
      priority: 'medium',
      due_in_days: 2
    };
    setActionItems((prev) => [...prev, newItem]);
    setSelectedItemIds((prev) => new Set([...prev, newId]));
  };

  // Convert selected action items into real Kanban tasks
  const handleCreateTasks = async () => {
    const selectedItems = actionItems.filter((it, idx) => selectedItemIds.has(it.id || `act-${idx + 1}`));
    if (selectedItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one action item to create a task.' });
      return;
    }

    setIsCreatingTasks(true);
    setStatusMessage(null);

    try {
      const res = await callService.createTasksFromActionItems(callData.id, {
        actionItems: selectedItems,
        creatorId: currentUser?.id || 'usr-1',
        creatorName: currentUser?.name || 'User',
        channelId,
        postSummaryToChat: postToChat
      });

      if (res && res.success) {
        setCreatedTasksCount(res.createdCount || selectedItems.length);
        setStatusMessage({
          type: 'success',
          text: `🎉 Successfully created ${res.createdCount} task${res.createdCount > 1 ? 's' : ''} in your workspace!`
        });
        if (typeof onTasksCreated === 'function') {
          onTasksCreated(res.tasks || []);
        }
      }
    } catch (err) {
      console.error('Error creating tasks:', err);
      setStatusMessage({ type: 'error', text: 'Failed to create tasks. Please try again.' });
    } finally {
      setIsCreatingTasks(false);
    }
  };

  // Copy summary to clipboard
  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `📋 Meeting Minutes (${callerName} & ${receiverName})\n\n${summary}\n\nKey Decisions:\n${keyDecisions.map(d => `• ${d}`).join('\n')}\n\nAction Items:\n${actionItems.map(a => `• [ ] ${a.title} (@${a.suggested_assignee || 'Unassigned'})`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="call-summary-modal-backdrop" onClick={onClose}>
      <div
        className="call-summary-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="call-summary-header">
          <div className="call-summary-header-left">
            <div className="call-summary-icon-badge">
              <Sparkles size={20} className="sparkle-pulse" />
            </div>
            <div>
              <h3 className="call-summary-title">PulseBot Meeting Minutes</h3>
              <p className="call-summary-subtitle">
                AI Call Summary & Automated Task Delegation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="call-summary-close-btn"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Call Meta Banner */}
        <div className="call-summary-meta-bar">
          <div className="call-summary-meta-pill">
            <User size={14} />
            <span>{callerName} & {receiverName}</span>
          </div>
          <div className="call-summary-meta-pill">
            <Clock size={14} />
            <span>Duration: {formatDuration(durationSec)}</span>
          </div>
          <div className="call-summary-meta-pill">
            <Calendar size={14} />
            <span>{new Date(callData.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="call-summary-body">
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`call-summary-alert ${statusMessage.type}`}>
              <AlertCircle size={16} />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Meeting Notes / Scratchpad */}
          <div className="call-summary-section">
            <div className="call-summary-section-head">
              <label className="call-summary-label">
                <FileText size={15} />
                <span>Meeting Notes & Discussion Points</span>
              </label>
              <span className="call-summary-hint">Type or paste bullet points below</span>
            </div>
            <textarea
              className="call-summary-textarea"
              rows={4}
              placeholder="e.g. Discussed UI updates for mobile navigation. Sarah will test Android viewport. David to prepare deployment build by Thursday..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="call-summary-quick-tags">
              <span className="quick-tag-label">Quick topics:</span>
              <button
                type="button"
                className="quick-tag-btn"
                onClick={() => setNotes((prev) => (prev ? prev + '\n• Project roadmap and milestone review' : '• Project roadmap and milestone review'))}
              >
                + Roadmap review
              </button>
              <button
                type="button"
                className="quick-tag-btn"
                onClick={() => setNotes((prev) => (prev ? prev + '\n• Bug fixes and regression testing' : '• Bug fixes and regression testing'))}
              >
                + Bug fixes & QA
              </button>
              <button
                type="button"
                className="quick-tag-btn"
                onClick={() => setNotes((prev) => (prev ? prev + '\n• Client deliverables & deadlines' : '• Client deliverables & deadlines'))}
              >
                + Deliverables
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isLoading}
              className="call-summary-generate-btn"
            >
              <Sparkles size={16} className={isLoading ? 'sparkle-spin' : ''} />
              <span>{isLoading ? 'Analyzing with PulseBot...' : summary ? 'Regenerate AI Summary' : 'Generate AI Summary & Tasks'}</span>
            </button>
          </div>

          {/* Section 2: Executive Summary */}
          {summary && (
            <div className="call-summary-section summary-result-box">
              <div className="call-summary-section-head">
                <label className="call-summary-label highlight">
                  <Sparkles size={15} />
                  <span>Executive Summary</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="call-summary-copy-btn"
                  title="Copy full meeting minutes"
                >
                  {copied ? <Check size={14} color="#25D366" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="call-summary-text">{summary}</p>

              {keyDecisions.length > 0 && (
                <div className="call-summary-decisions">
                  <h5 className="call-decisions-title">Key Decisions:</h5>
                  <ul className="call-decisions-list">
                    {keyDecisions.map((dec, i) => (
                      <li key={i}>{dec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Extracted Action Items */}
          {actionItems.length > 0 && (
            <div className="call-summary-section">
              <div className="call-summary-section-head">
                <label className="call-summary-label">
                  <ListTodo size={15} />
                  <span>Action Items & Task Delegation ({actionItems.length})</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddManualItem}
                  className="call-summary-add-item-btn"
                >
                  <Plus size={13} />
                  <span>Add Action</span>
                </button>
              </div>

              <div className="call-action-items-list">
                {actionItems.map((item, idx) => {
                  const itemId = item.id || `act-${idx + 1}`;
                  const isChecked = selectedItemIds.has(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`call-action-card ${isChecked ? 'selected' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItemSelection(itemId)}
                        className="call-action-check-btn"
                        title={isChecked ? 'Deselect task' : 'Select task for creation'}
                      >
                        {isChecked ? (
                          <CheckSquare size={18} color="#25D366" />
                        ) : (
                          <Square size={18} color="#8696a0" />
                        )}
                      </button>

                      <div className="call-action-details">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateActionItem(idx, 'title', e.target.value)}
                          className="call-action-title-input"
                          placeholder="Task title..."
                        />

                        <div className="call-action-meta-row">
                          {/* Assignee */}
                          <div className="call-action-field">
                            <User size={12} />
                            <input
                              type="text"
                              value={item.suggested_assignee || item.assignee_name || ''}
                              onChange={(e) => updateActionItem(idx, 'suggested_assignee', e.target.value)}
                              className="call-action-mini-input"
                              placeholder="Assignee name..."
                            />
                          </div>

                          {/* Priority */}
                          <div className="call-action-field">
                            <select
                              value={item.priority || 'medium'}
                              onChange={(e) => updateActionItem(idx, 'priority', e.target.value)}
                              className={`call-action-priority-select priority-${item.priority || 'medium'}`}
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>

                          {/* Due Date */}
                          <div className="call-action-field">
                            <Calendar size={12} />
                            <span>In {item.due_in_days || 2} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conversion Footer Bar */}
              <div className="call-summary-footer-action">
                <label className="call-chat-share-toggle">
                  <input
                    type="checkbox"
                    checked={postToChat}
                    onChange={(e) => setPostToChat(e.target.checked)}
                  />
                  <span>Share Meeting Minutes & Tasks into Chat Channel</span>
                </label>

                <button
                  type="button"
                  onClick={handleCreateTasks}
                  disabled={isCreatingTasks || selectedItemIds.size === 0}
                  className="call-create-tasks-btn"
                >
                  <ListTodo size={16} />
                  <span>
                    {isCreatingTasks
                      ? 'Creating Tasks...'
                      : createdTasksCount
                      ? `Tasks Created (${createdTasksCount}) ✓`
                      : `Convert Selected to Tasks (${selectedItemIds.size})`}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
