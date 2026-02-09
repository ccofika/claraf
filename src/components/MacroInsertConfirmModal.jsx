import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Hash, Tag, ListChecks, MessageSquare, Check, X, ChevronDown } from 'lucide-react';
import { TicketContentDisplay } from './TicketRichTextEditor';
import { getScorecardConfig, requiresVariantSelection } from '../data/scorecardConfig';

const MacroInsertConfirmModal = ({
  open,
  onOpenChange,
  macro,
  agentPosition,
  currentScorecardVariant = null, // Current variant selected in the ticket
  onConfirm
}) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [feedbackType, setFeedbackType] = useState('good');
  const prevOpenRef = useRef(false);

  // Get scorecard config for the position
  const scorecardConfig = agentPosition ? getScorecardConfig(agentPosition) : null;
  const needsVariantSelection = agentPosition && requiresVariantSelection(agentPosition);
  const availableVariants = scorecardConfig?.variants || [];

  // Get current scorecard data based on feedback type
  const currentScorecardData = feedbackType === 'bad' ? macro?.badScorecardData : macro?.goodScorecardData;

  // Reset selected variant and feedback type ONLY when modal opens (not on every render)
  useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (open && !prevOpenRef.current) {
      // Reset feedback type to good
      setFeedbackType('good');

      // If ticket already has a variant selected, use that
      if (currentScorecardVariant) {
        setSelectedVariant(currentScorecardVariant);
      } else if (macro?.goodScorecardData?.[agentPosition]?.variant) {
        // Otherwise use the variant from the macro
        setSelectedVariant(macro.goodScorecardData[agentPosition].variant);
      } else if (availableVariants.length > 0) {
        // Default to first variant if none selected
        setSelectedVariant(availableVariants[0].key);
      } else {
        setSelectedVariant(null);
      }
    }
    prevOpenRef.current = open;
  }, [open, currentScorecardVariant, macro, agentPosition, availableVariants]);

  if (!macro) return null;

  // Get current feedback based on type
  const currentFeedback = feedbackType === 'bad' ? macro.badFeedback : macro.goodFeedback;

  const hasCategories = macro.categories && macro.categories.length > 0;
  // New structure: scorecardData[position][variant] = { key: value }
  const scorecardDataForPosition = agentPosition && currentScorecardData?.[agentPosition];
  const hasScorecardValues = scorecardDataForPosition && (
    // Check if any variant has values
    Object.keys(scorecardDataForPosition).some(variantKey => {
      const values = scorecardDataForPosition[variantKey];
      return values && typeof values === 'object' && Object.keys(values).length > 0;
    })
  );

  const handleFeedbackOnly = () => {
    onConfirm({ applyCategories: false, applyScorecard: false, feedbackType, scorecardData: currentScorecardData });
    onOpenChange(false);
  };

  const handleInsertAll = () => {
    onConfirm({
      applyCategories: true,
      applyScorecard: true,
      scorecardVariant: selectedVariant, // Pass the selected variant
      feedbackType,
      scorecardData: currentScorecardData
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 max-w-lg p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Insert Macro: {macro.title}
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Info message */}
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            This macro contains additional data. How would you like to insert it?
          </p>

          {/* Good/Bad Toggle */}
          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Macro Version
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType('good')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  feedbackType === 'good'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                ✓ Good
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('bad')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  feedbackType === 'bad'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                ✗ Bad
              </button>
            </div>
          </div>

          {/* Feedback Preview */}
          <div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Feedback Content ({feedbackType === 'good' ? 'Good' : 'Bad'} Version)
            </p>
            <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 max-h-32 overflow-y-auto">
              <TicketContentDisplay
                content={currentFeedback || '(No feedback for this version)'}
                className="text-sm text-gray-700 dark:text-neutral-300"
              />
            </div>
          </div>

          {/* Categories Preview */}
          {hasCategories && (
            <div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Categories ({macro.categories.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {macro.categories.map(cat => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                Will replace current categories
              </p>
            </div>
          )}

          {/* Scorecard Preview */}
          {hasScorecardValues && (
            <div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <ListChecks className="w-3 h-3" />
                Scorecard Values for {agentPosition} ({feedbackType === 'good' ? 'Good' : 'Bad'} Version)
              </p>

              {/* Variant Selection for positions that require it */}
              {needsVariantSelection && availableVariants.length > 0 && (
                <div className="mb-2">
                  <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">
                    {currentScorecardVariant ? 'Scorecard type (from ticket):' : 'Select scorecard type:'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedVariant || ''}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      disabled={!!currentScorecardVariant} // Disable if ticket already has variant
                      className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {availableVariants.map(v => (
                        <option key={v.key} value={v.key}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {currentScorecardVariant && (
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                      Using variant already selected in ticket
                    </p>
                  )}
                </div>
              )}

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-3">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {(() => {
                    // Count values for the selected variant
                    const variantValues = selectedVariant && scorecardDataForPosition[selectedVariant];
                    if (variantValues && typeof variantValues === 'object') {
                      return `${Object.keys(variantValues).length} scorecard fields will be applied`;
                    }
                    // Fallback: count all values across all variants
                    let total = 0;
                    Object.keys(scorecardDataForPosition).forEach(vk => {
                      const vals = scorecardDataForPosition[vk];
                      if (vals && typeof vals === 'object') {
                        total += Object.keys(vals).length;
                      }
                    });
                    return `${total} scorecard fields available`;
                  })()}
                </p>
              </div>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                Will replace current scorecard values
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFeedbackOnly}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              Feedback Only
            </button>
            <button
              onClick={handleInsertAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Insert All
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MacroInsertConfirmModal;
