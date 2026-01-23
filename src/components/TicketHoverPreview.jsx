import React, { useState, useRef, useEffect, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Tag } from 'lucide-react';
import { QualityScoreBadge } from '../pages/qa-manager/components';

const MAX_NOTES_LENGTH = 200;
const HOVER_DELAY = 400; // ms before showing preview
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 220; // Approximate max height

const TicketHoverPreview = ({ children, ticket }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, width: PREVIEW_WIDTH, mode: 'side' });
  const timeoutRef = useRef(null);

  const handleMouseEnter = (e) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate position
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const MARGIN = 12;
    const EDGE_PADDING = 8;

    // === CHECK IF CARD CAN FIT ON EITHER SIDE OF THE ROW ===
    const spaceOnRight = viewportWidth - rect.right - MARGIN - EDGE_PADDING;
    const spaceOnLeft = rect.left - MARGIN - EDGE_PADDING;
    const canFitOnRight = spaceOnRight >= PREVIEW_WIDTH;
    const canFitOnLeft = spaceOnLeft >= PREVIEW_WIDTH;

    // If card doesn't fit on either side, use bottom dock mode
    if (!canFitOnRight && !canFitOnLeft) {
      setPosition({ x: 0, y: 0, width: viewportWidth, mode: 'bottom' });
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, HOVER_DELAY);
      return;
    }

    // === SIDE MODE - CARD FITS ON ONE SIDE ===
    let x, y;

    // === HORIZONTAL POSITIONING ===
    if (canFitOnRight) {
      // Fits on the right - preferred
      x = rect.right + MARGIN;
    } else {
      // Fits on the left
      x = rect.left - MARGIN - PREVIEW_WIDTH;
    }

    // === VERTICAL POSITIONING ===
    const spaceBelow = viewportHeight - rect.top;
    const spaceAbove = rect.bottom;

    // Check if we can align top of preview with top of row
    if (rect.top >= EDGE_PADDING && rect.top + PREVIEW_HEIGHT + EDGE_PADDING <= viewportHeight) {
      // Align with top of row - ideal case
      y = rect.top;
    } else if (spaceAbove >= PREVIEW_HEIGHT + EDGE_PADDING) {
      // Position above the row (for rows at bottom)
      y = rect.top - PREVIEW_HEIGHT - MARGIN;
    } else if (spaceBelow >= PREVIEW_HEIGHT + EDGE_PADDING) {
      // Position below the row (for rows at very top)
      y = rect.bottom + MARGIN;
    } else {
      // Not enough space above or below - center vertically in viewport
      y = Math.max(EDGE_PADDING, (viewportHeight - PREVIEW_HEIGHT) / 2);
    }

    // Final bounds check - ensure preview stays within viewport
    y = Math.max(EDGE_PADDING, Math.min(y, viewportHeight - PREVIEW_HEIGHT - EDGE_PADDING));

    setPosition({ x, y, width: PREVIEW_WIDTH, mode: 'side' });

    // Set timeout for delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Truncate notes and strip HTML
  const truncateNotes = (notes) => {
    if (!notes) return null;

    // Strip HTML tags
    const strippedText = notes.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    if (!strippedText) return null;

    if (strippedText.length <= MAX_NOTES_LENGTH) {
      return strippedText;
    }

    return strippedText.substring(0, MAX_NOTES_LENGTH) + '...';
  };

  const truncatedNotes = truncateNotes(ticket?.notes);
  const hasScore = ticket?.qualityScorePercent !== undefined && ticket?.qualityScorePercent !== null && ticket?.qualityScorePercent !== '';
  const hasCategories = ticket?.categories && ticket.categories.length > 0;

  // Don't show preview if there's nothing to show
  const hasContent = truncatedNotes || hasScore;

  // Clone the child element and add our event handlers
  const childWithHandlers = cloneElement(children, {
    onMouseEnter: (e) => {
      handleMouseEnter(e);
      // Call original handler if exists
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e) => {
      handleMouseLeave();
      // Call original handler if exists
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
  });

  // If no content to show, just return the child without preview
  if (!hasContent) {
    return children;
  }

  // Bottom dock mode for narrow screens
  const bottomDockContent = (
    <AnimatePresence>
      {isVisible && position.mode === 'bottom' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }}
          className="pointer-events-none"
        >
          <div className="mx-3 mb-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header - horizontal layout for dock */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  #{ticket?.ticketId || ticket?._id?.slice(-6)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Date in header for dock mode */}
                {ticket?.dateEntered && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ticket.dateEntered).toLocaleDateString()}</span>
                  </div>
                )}
                {hasScore && (
                  <QualityScoreBadge score={ticket.qualityScorePercent} />
                )}
              </div>
            </div>

            {/* Content - more compact for dock */}
            <div className="p-3 space-y-2 max-h-32 overflow-y-auto">
              {/* Notes */}
              {truncatedNotes && (
                <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">
                  {truncatedNotes}
                </p>
              )}

              {/* Categories inline */}
              {hasCategories && (
                <div className="flex flex-wrap gap-1">
                  {ticket.categories.slice(0, 4).map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                    >
                      {cat.length > 15 ? cat.substring(0, 15) + '...' : cat}
                    </span>
                  ))}
                  {ticket.categories.length > 4 && (
                    <span className="text-xs text-gray-500 dark:text-neutral-500">
                      +{ticket.categories.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Side card mode for wider screens
  const sideCardContent = (
    <AnimatePresence>
      {isVisible && position.mode === 'side' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: position.width,
            zIndex: 9999,
          }}
          className="pointer-events-none"
        >
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  #{ticket?.ticketId || ticket?._id?.slice(-6)}
                </span>
              </div>
              {hasScore && (
                <QualityScoreBadge score={ticket.qualityScorePercent} />
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Notes */}
              {truncatedNotes && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Notes
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">
                    {truncatedNotes}
                  </p>
                </div>
              )}

              {/* Categories - show first 3 */}
              {hasCategories && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Categories
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ticket.categories.slice(0, 3).map((cat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                      >
                        {cat.length > 20 ? cat.substring(0, 20) + '...' : cat}
                      </span>
                    ))}
                    {ticket.categories.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-neutral-500">
                        +{ticket.categories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Date */}
              {ticket?.dateEntered && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(ticket.dateEntered).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const previewContent = (
    <>
      {sideCardContent}
      {bottomDockContent}
    </>
  );

  return (
    <>
      {childWithHandlers}
      {createPortal(previewContent, document.body)}
    </>
  );
};

export default TicketHoverPreview;
