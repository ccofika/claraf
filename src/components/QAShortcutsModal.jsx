import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Keyboard } from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp, duration, easing } from '../utils/animations';

const QAShortcutsModal = ({ open, onClose }) => {
  const shortcutGroups = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Alt', '1'], description: 'Go to Dashboard' },
        { keys: ['Alt', '2'], description: 'Go to Agents' },
        { keys: ['Alt', '3'], description: 'Go to Tickets' },
        { keys: ['Alt', '4'], description: 'Go to Archive' },
        { keys: ['Alt', 'K'], description: 'Open Command Palette' },
      ]
    },
    {
      title: 'Quick Actions',
      shortcuts: [
        { keys: ['Alt', 'T'], description: 'New Ticket' },
        { keys: ['Alt', 'A'], description: 'New Agent' },
        { keys: ['Alt', 'E'], description: 'Export Selected Tickets' },
        { keys: ['Alt', 'S'], description: 'Toggle AI/Text Search' },
        { keys: ['Alt', 'Z'], description: 'Toggle ZenMove Mode' },
        { keys: ['Alt', 'B'], description: 'Toggle Throwback Panel' },
        { keys: ['Ctrl', 'Enter'], description: 'Save (in dialogs)' },
      ]
    },
    {
      title: 'Ticket List',
      shortcuts: [
        { keys: ['J'], description: 'Next ticket' },
        { keys: ['K'], description: 'Previous ticket' },
        { keys: ['Enter'], description: 'Open selected ticket' },
        { keys: ['G'], description: 'Grade selected ticket' },
        { keys: ['F'], description: 'Add feedback to ticket' },
        { keys: ['A'], description: 'Archive selected ticket' },
      ]
    },
    {
      title: 'General',
      shortcuts: [
        { keys: ['/'], description: 'Focus search' },
        { keys: ['Esc'], description: 'Close dialog / Clear selection' },
        { keys: ['?'], description: 'Show this help' },
        { keys: ['R'], description: 'Refresh data' },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-900 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {shortcutGroups.map((group, groupIdx) => (
            <motion.div
              key={group.title}
              className="space-y-3"
              variants={staggerItem}
              custom={groupIdx}
            >
              <h3 className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIdx * 0.1) + (idx * 0.03), duration: duration.fast, ease: easing.smooth }}
                  >
                    <span className="text-sm text-gray-700 dark:text-neutral-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-gray-700 dark:text-neutral-300 min-w-[24px] text-center">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 dark:text-neutral-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <p className="text-xs text-gray-500 dark:text-neutral-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QAShortcutsModal;
