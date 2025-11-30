import React, { useState } from 'react';
import axios from 'axios';
import {
  X,
  Mail,
  Bell,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const SubscribeModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('all');
  const [severityFilter, setSeverityFilter] = useState(['critical', 'major', 'minor']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSeverityToggle = (severity) => {
    setSeverityFilter(prev => {
      if (prev.includes(severity)) {
        // Don't allow removing all severities
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== severity);
      }
      return [...prev, severity];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/status-subscriptions`,
        {
          email: email.trim(),
          subscriptionType,
          severityFilter,
        }
      );
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl p-6 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Subscribed Successfully!
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
            You'll receive status updates at <strong>{email}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Subscribe to Updates</h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Get notified about incidents</p>
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
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Subscription Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Notification Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Updates', desc: 'Incidents + Maintenance' },
                { value: 'incidents_only', label: 'Incidents Only', desc: 'Critical updates only' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSubscriptionType(option.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    subscriptionType === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-900/50'
                      : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    subscriptionType === option.value
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {option.label}
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Severity Filter
            </label>
            <div className="flex gap-2">
              {[
                { value: 'critical', label: 'Critical', color: 'red' },
                { value: 'major', label: 'Major', color: 'orange' },
                { value: 'minor', label: 'Minor', color: 'yellow' },
              ].map((sev) => (
                <button
                  key={sev.value}
                  type="button"
                  onClick={() => handleSeverityToggle(sev.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    severityFilter.includes(sev.value)
                      ? sev.color === 'red'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-900/50 text-red-700 dark:text-red-400'
                        : sev.color === 'orange'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-900/50 text-orange-700 dark:text-orange-400'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                      : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  Subscribe
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800">
          <p className="text-xs text-gray-500 dark:text-neutral-400 text-center">
            You can unsubscribe at any time. We respect your privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
