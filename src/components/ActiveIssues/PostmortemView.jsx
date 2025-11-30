import React, { useState } from 'react';
import axios from 'axios';
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X,
  Loader2,
} from 'lucide-react';

const PostmortemView = ({ issue, canEdit, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    summary: issue.postmortem?.summary || '',
    rootCause: issue.postmortem?.rootCause || '',
    impact: issue.postmortem?.impact || '',
    timeline: issue.postmortem?.timeline || '',
    lessonsLearned: issue.postmortem?.lessonsLearned || '',
    preventiveMeasures: issue.postmortem?.preventiveMeasures || '',
    isPublished: issue.postmortem?.isPublished || false,
  });

  const hasPostmortem = issue.postmortem && (
    issue.postmortem.summary ||
    issue.postmortem.rootCause ||
    issue.postmortem.lessonsLearned
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/issues/${issue._id}/postmortem`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save postmortem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // If not resolved, don't show
  if (issue.status !== 'resolved') return null;

  // If no postmortem and can't edit, show nothing
  if (!hasPostmortem && !canEdit) return null;

  return (
    <div className="border-t border-gray-200 dark:border-neutral-800 mt-4 pt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-neutral-800/50 rounded-md px-2 -mx-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Post-Incident Report
          </span>
          {hasPostmortem ? (
            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
              Available
            </span>
          ) : (
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-xs rounded-full">
              Not written
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-3 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-red-700 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {isEditing ? (
            // Edit Form
            <div className="space-y-4">
              {/* Summary */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Summary
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder="Brief summary of the incident and resolution..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Root Cause */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Root Cause
                </label>
                <textarea
                  value={formData.rootCause}
                  onChange={(e) => handleChange('rootCause', e.target.value)}
                  placeholder="What caused this incident..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Impact */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Impact
                </label>
                <textarea
                  value={formData.impact}
                  onChange={(e) => handleChange('impact', e.target.value)}
                  placeholder="How users were affected..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Lessons Learned */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Lessons Learned
                </label>
                <textarea
                  value={formData.lessonsLearned}
                  onChange={(e) => handleChange('lessonsLearned', e.target.value)}
                  placeholder="What we learned from this incident..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Preventive Measures */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Preventive Measures
                </label>
                <textarea
                  value={formData.preventiveMeasures}
                  onChange={(e) => handleChange('preventiveMeasures', e.target.value)}
                  placeholder="Steps taken to prevent recurrence..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : hasPostmortem ? (
            // View Mode
            <div className="space-y-4">
              {/* Summary */}
              {issue.postmortem.summary && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Summary
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {issue.postmortem.summary}
                  </p>
                </div>
              )}

              {/* Root Cause */}
              {issue.postmortem.rootCause && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Root Cause
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {issue.postmortem.rootCause}
                  </p>
                </div>
              )}

              {/* Impact */}
              {issue.postmortem.impact && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Impact
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {issue.postmortem.impact}
                  </p>
                </div>
              )}

              {/* Lessons Learned */}
              {issue.postmortem.lessonsLearned && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Lessons Learned
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {issue.postmortem.lessonsLearned}
                  </p>
                </div>
              )}

              {/* Preventive Measures */}
              {issue.postmortem.preventiveMeasures && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Preventive Measures
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {issue.postmortem.preventiveMeasures}
                  </p>
                </div>
              )}

              {/* Edit Button */}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Report
                </button>
              )}
            </div>
          ) : (
            // No postmortem - show create button
            canEdit && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-neutral-400 mb-3">
                  No post-incident report has been written yet.
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <FileText className="w-4 h-4" />
                  Write Report
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PostmortemView;
