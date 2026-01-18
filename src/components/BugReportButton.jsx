import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Minus, Send, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BugReportButton = ({ getAuthHeaders }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title for the bug report');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/api/qa/bug-reports`,
        {
          title: formData.title,
          description: formData.description,
          currentPage: window.location.pathname,
          userAgent: navigator.userAgent
        },
        getAuthHeaders()
      );

      setIsSuccess(true);

      // Auto close after success animation
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({ title: '', description: '' });
      }, 1500);

    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setFormData({ title: '', description: '' });
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Bug Report Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center justify-center transition-shadow duration-200"
            title="Report a Bug"
          >
            <Bug className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Minimized state */}
            {isMinimized ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 right-6 z-50"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRestore}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Bug className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Bug Report
                  </span>
                  <X
                    className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                  />
                </motion.button>
              </motion.div>
            ) : (
              /* Full modal */
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[500px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
              >
                {/* Success State */}
                <AnimatePresence>
                  {isSuccess && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex flex-col items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-4"
                      >
                        <CheckCircle className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg font-medium text-gray-900 dark:text-white"
                      >
                        Bug Report Sent!
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-gray-500 dark:text-neutral-400 mt-1"
                      >
                        Thank you for your feedback
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <Bug className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Report a Bug
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Help us improve Clara
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleMinimize}
                      className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-800 transition-colors"
                      title="Minimize"
                    >
                      <Minus className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClose}
                      className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-800 transition-colors"
                      title="Close"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief description of the bug"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 transition-all"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                      Description
                      <span className="text-gray-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Steps to reproduce, expected behavior, etc..."
                      rows={4}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Bug Report
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BugReportButton;
