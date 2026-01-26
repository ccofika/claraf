import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, MessageSquare, User, Calendar, FileText, Save } from 'lucide-react';
import { QualityScoreBadge, Button } from './index';
import { getScorecardConfig, getScorecardValues } from '../../../data/scorecardConfig';

const ReviewTicketDialog = ({
  open,
  onClose,
  ticket,
  mode = 'view', // 'view' or 'edit'
  onApprove,
  onDeny,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    qualityScorePercent: '',
    notes: '',
    feedback: '',
    categories: [],
    scorecardVariant: null,
    scorecardValues: {},
    additionalNote: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form data when ticket changes
  useEffect(() => {
    if (ticket) {
      setFormData({
        qualityScorePercent: ticket.qualityScorePercent || '',
        notes: ticket.notes || '',
        feedback: ticket.feedback || '',
        categories: ticket.categories || [],
        scorecardVariant: ticket.scorecardVariant || null,
        scorecardValues: ticket.scorecardValues || {},
        additionalNote: ticket.additionalNote || ''
      });
      setHasChanges(false);
    }
  }, [ticket]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle approve
  const handleApprove = async () => {
    setSaving(true);
    try {
      await onApprove(ticket._id, hasChanges ? formData : null);
    } finally {
      setSaving(false);
    }
  };

  // Handle deny
  const handleDeny = async () => {
    setSaving(true);
    try {
      await onDeny(ticket._id, hasChanges ? formData : null);
    } finally {
      setSaving(false);
    }
  };

  // Handle save (update without approve/deny)
  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await onUpdate(ticket._id, formData);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !ticket) return null;

  const agentPosition = ticket.agent?.position || 'Medior';
  const scorecardConfig = getScorecardConfig(agentPosition, formData.scorecardVariant);
  const scorecardValueOptions = getScorecardValues();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Review Ticket: {ticket.ticketId}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {mode === 'edit' ? 'Edit and approve or deny this ticket' : 'View ticket details'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Additional Note - Always at top */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <label className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Additional Note (Reviewer Only)
                  </label>
                </div>
                {mode === 'edit' ? (
                  <textarea
                    value={formData.additionalNote}
                    onChange={(e) => handleChange('additionalNote', e.target.value)}
                    placeholder="Add a note for the grader..."
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-neutral-300">
                    {ticket.additionalNote || 'No additional note'}
                  </p>
                )}
              </div>

              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-3">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">Agent</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {ticket.agent?.name || 'Unknown'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-3">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">Grader</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {ticket.createdBy?.name || ticket.createdBy?.email || 'Unknown'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-3">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">Original Score</span>
                  <p className="mt-1">
                    <QualityScoreBadge score={ticket.originalReviewScore} />
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-3">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">Current Score</span>
                  <p className="mt-1">
                    <QualityScoreBadge score={formData.qualityScorePercent} />
                  </p>
                </div>
              </div>

              {/* Quality Score */}
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Quality Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.qualityScorePercent}
                    onChange={(e) => handleChange('qualityScorePercent', parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Notes
                </label>
                {mode === 'edit' ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-neutral-950 rounded-lg p-3"
                    dangerouslySetInnerHTML={{ __html: ticket.notes || '<em>No notes</em>' }}
                  />
                )}
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Feedback
                </label>
                {mode === 'edit' ? (
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => handleChange('feedback', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-neutral-950 rounded-lg p-3"
                    dangerouslySetInnerHTML={{ __html: ticket.feedback || '<em>No feedback</em>' }}
                  />
                )}
              </div>

              {/* Scorecard */}
              {scorecardConfig && scorecardConfig.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Scorecard ({agentPosition})
                  </label>
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 space-y-3">
                    {scorecardConfig.map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-neutral-300">{item.label}</span>
                        {mode === 'edit' ? (
                          <select
                            value={formData.scorecardValues[item.key] ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              handleChange('scorecardValues', {
                                ...formData.scorecardValues,
                                [item.key]: value
                              });
                            }}
                            className="px-2 py-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-sm"
                          >
                            <option value="">-</option>
                            {scorecardValueOptions.map((opt, idx) => (
                              <option key={idx} value={idx}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formData.scorecardValues[item.key] !== undefined && formData.scorecardValues[item.key] !== null
                              ? scorecardValueOptions[formData.scorecardValues[item.key]]
                              : '-'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review History */}
              {ticket.reviewHistory && ticket.reviewHistory.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Review History
                  </label>
                  <div className="space-y-2">
                    {ticket.reviewHistory.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm bg-gray-50 dark:bg-neutral-950 rounded-lg p-3"
                      >
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.action === 'approved'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : entry.action === 'denied'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {entry.action}
                        </span>
                        <span className="text-gray-600 dark:text-neutral-400">
                          Score: {entry.scoreAtAction}%
                        </span>
                        <span className="text-gray-500 dark:text-neutral-500">
                          {new Date(entry.date).toLocaleString()}
                        </span>
                        {entry.reviewedBy && (
                          <span className="text-gray-500 dark:text-neutral-500">
                            by {entry.reviewedBy.name || entry.reviewedBy.email}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                {hasChanges && (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                {mode === 'edit' && hasChanges && (
                  <Button variant="glass" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1.5" />
                    Save
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={handleDeny}
                  disabled={saving}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Deny
                </Button>
                <Button
                  variant="success"
                  onClick={handleApprove}
                  disabled={saving}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewTicketDialog;
