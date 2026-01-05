import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { X, Hash, Save } from 'lucide-react';
import TicketRichTextEditor from './TicketRichTextEditor';
import { useMacros } from '../hooks/useMacros';
import { fadeInUp, staggerContainer, staggerItem, duration, easing } from '../utils/animations';

const SaveAsMacroModal = ({ open, onOpenChange, initialFeedback = '', onSave }) => {
  const { createMacro } = useMacros();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    feedback: ''
  });

  // Reset form when opened with new feedback
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        feedback: initialFeedback || ''
      });
    }
  }, [open, initialFeedback]);

  // Handle save
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.feedback.trim()) {
      toast.error('Feedback content is required');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createMacro(formData);
      if (result.success) {
        toast.success('Macro saved successfully');
        if (onSave) {
          onSave(result.data);
        }
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton overlayClassName="z-[70]" className="bg-white dark:bg-neutral-900 max-w-lg max-h-[80vh] p-0 gap-0 flex flex-col overflow-hidden z-[70]">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Save as Macro
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
        <motion.div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Title */}
          <motion.div variants={staggerItem}>
            <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
              Macro Title
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., ontario-ip-issue"
              className="bg-white dark:bg-neutral-800"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Use a descriptive, searchable name for this macro.
            </p>
          </motion.div>

          {/* Feedback Content */}
          <motion.div variants={staggerItem}>
            <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
              Feedback Content
            </Label>
            <TicketRichTextEditor
              value={formData.feedback}
              onChange={(html) => setFormData({ ...formData, feedback: html })}
              placeholder="Enter the feedback template content..."
              rows={8}
              className="min-h-[150px] max-h-[40vh] overflow-y-auto"
            />
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              You can edit the content before saving.
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Macro'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsMacroModal;
