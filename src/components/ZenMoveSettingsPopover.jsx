import React, { useState, useRef, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZenMove } from '../context/ZenMoveContext';
import { toast } from 'sonner';

const ZenMoveSettingsPopover = () => {
  const { extractionTarget, updateExtractionTarget } = useZenMove();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(extractionTarget);
  const [saving, setSaving] = useState(false);
  const popoverRef = useRef(null);

  // Sync value when target changes
  useEffect(() => {
    setValue(extractionTarget);
  }, [extractionTarget]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (value === extractionTarget) {
      setOpen(false);
      return;
    }
    setSaving(true);
    const success = await updateExtractionTarget(value);
    setSaving(false);
    if (success) {
      toast.success(`Extraction target updated to ${value}`);
      setOpen(false);
    } else {
      toast.error('Failed to update target');
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-1.5 text-gray-400 dark:text-neutral-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800"
        title="ZenMove Settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 p-3"
          >
            <div className="text-xs font-medium text-gray-600 dark:text-neutral-400 mb-2 uppercase tracking-wide">
              ZenMove Settings
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700 dark:text-neutral-300">
                Weekly extraction target
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={value}
                  onChange={(e) => setValue(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md outline-none focus:border-cyan-400 dark:focus:border-cyan-600 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-2.5 py-1.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? '...' : 'Save'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-neutral-600">
                Target per agent per week (1-50)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZenMoveSettingsPopover;
