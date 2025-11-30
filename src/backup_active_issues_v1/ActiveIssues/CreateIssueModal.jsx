import React, { useState } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
} from 'lucide-react';

const CreateIssueModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'minor',
    affectedAreas: [],
  });
  const [newArea, setNewArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const severityOptions = [
    { value: 'critical', label: 'Critical', desc: 'Service down', icon: AlertOctagon, color: 'red' },
    { value: 'major', label: 'Major', desc: 'Major impact', icon: AlertTriangle, color: 'orange' },
    { value: 'minor', label: 'Minor', desc: 'Minor issue', icon: AlertCircle, color: 'yellow' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddArea = () => {
    if (newArea.trim() && !formData.affectedAreas.includes(newArea.trim())) {
      setFormData(prev => ({
        ...prev,
        affectedAreas: [...prev.affectedAreas, newArea.trim()]
      }));
      setNewArea('');
    }
  };

  const handleRemoveArea = (area) => {
    setFormData(prev => ({
      ...prev,
      affectedAreas: prev.affectedAreas.filter(a => a !== area)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCreate(formData);
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(err.response?.data?.message || 'Failed to create issue');
      setIsSubmitting(false);
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      red: isSelected ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-900/50' : '',
      orange: isSelected ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-900/50' : '',
      yellow: isSelected ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-900/50' : '',
    };
    return colors[color] || '';
  };

  const getIconColor = (color) => {
    const colors = {
      red: 'text-red-600 dark:text-red-400',
      orange: 'text-orange-600 dark:text-orange-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
    };
    return colors[color] || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Report New Issue</h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Document a platform issue</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-red-700 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description, steps to reproduce..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {severityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.severity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('severity', option.value)}
                    className={`p-2.5 rounded border text-left transition-all ${
                      isSelected
                        ? getColorClasses(option.color, true)
                        : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className={`w-3.5 h-3.5 ${getIconColor(option.color)}`} />
                      <span className={`text-xs font-medium ${getIconColor(option.color)}`}>{option.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-neutral-400">{option.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Affected Areas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Affected Areas
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
                placeholder="e.g., Login, Dashboard"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
              />
              <button
                type="button"
                onClick={handleAddArea}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.affectedAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.affectedAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs rounded"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(area)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-white border border-gray-200 dark:border-neutral-700 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report Issue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
