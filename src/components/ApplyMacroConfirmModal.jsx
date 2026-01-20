import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { AlertTriangle, CheckCircle2, Tag, ListChecks } from 'lucide-react';

/**
 * Confirmation modal shown when applying a macro that contains scorecard values or categories
 * Asks user to confirm replacing existing values in the ticket
 */
const ApplyMacroConfirmModal = ({
  open,
  onOpenChange,
  macro,
  agentPosition,
  onConfirm,
  onCancel
}) => {
  if (!macro) return null;

  // Check what data the macro has that will be applied
  const hasCategories = macro.categories && macro.categories.length > 0;
  const scorecardDataForPosition = agentPosition ? macro.scorecardData?.[agentPosition] : null;
  const hasScorecardValues = scorecardDataForPosition &&
    Object.keys(scorecardDataForPosition.values || {}).length > 0;

  // If no scorecard/categories data, don't show the modal
  if (!hasCategories && !hasScorecardValues) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Apply Macro Data?
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            This macro contains additional data that will replace your current values:
          </p>

          <div className="space-y-3">
            {hasCategories && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Tag className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Categories ({macro.categories.length})
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                    {macro.categories.slice(0, 3).join(', ')}
                    {macro.categories.length > 3 && ` +${macro.categories.length - 3} more`}
                  </p>
                </div>
              </div>
            )}

            {hasScorecardValues && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <ListChecks className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    Scorecard Values ({Object.keys(scorecardDataForPosition.values).length} fields)
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-300 mt-0.5">
                    For {agentPosition}
                    {scorecardDataForPosition.variant && ` (${scorecardDataForPosition.variant})`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            This will replace your current {hasCategories && hasScorecardValues ? 'categories and scorecard values' : hasCategories ? 'categories' : 'scorecard values'}.
          </p>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply All
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyMacroConfirmModal;
