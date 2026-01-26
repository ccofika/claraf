import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQAManager } from '../../../context/QAManagerContext';

const ReviewNotificationBanner = () => {
  const navigate = useNavigate();
  const {
    isReviewer,
    reviewPendingCount,
    showReviewBanner,
    dismissReviewBanner
  } = useQAManager();

  // Don't show if not a reviewer or no pending tickets or banner dismissed
  if (!isReviewer || reviewPendingCount === 0 || !showReviewBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/50 rounded-lg flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              You have {reviewPendingCount} ticket{reviewPendingCount !== 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Tickets with quality score below 85% need your approval
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/qa-manager/review')}
            className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-lg transition-colors"
          >
            View Queue
          </button>
          <button
            onClick={dismissReviewBanner}
            className="p-1.5 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewNotificationBanner;
