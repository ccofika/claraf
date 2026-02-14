import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from 'lucide-react';

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const KBTableOfContents = ({ blocks }) => {
  const [activeId, setActiveId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Extract headings from page blocks
  // Block data uses defaultContent (not content) for the text
  const headings = useMemo(() => {
    if (!blocks) return [];
    return blocks
      .filter(b => ['heading_1', 'heading_2', 'heading_3'].includes(b.type) && b.id)
      .map(b => {
        const raw = b.defaultContent || b.content || '';
        return {
          id: `kb-h-${b.id}`,
          text: stripHtml(typeof raw === 'string' ? raw : ''),
          level: parseInt(b.type.split('_')[1])
        };
      })
      .filter(h => h.text.trim());
  }, [blocks]);

  // Track active heading via scroll position
  useEffect(() => {
    if (headings.length === 0) return;

    const scrollContainer = document.querySelector('[data-kb-scroll-container]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      let current = null;

      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // If heading top is above the threshold (container top + 100px), it's "passed"
        if (rect.top <= containerRect.top + 100) {
          current = heading.id;
        }
      }

      // If no heading is above threshold, activate the first one
      if (!current && headings.length > 0) {
        current = headings[0].id;
      }

      setActiveId(current);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [headings]);

  // Close mobile TOC on escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const scrollToHeading = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      setMobileOpen(false);
    }
  }, []);

  if (headings.length === 0) return null;

  const tocList = (
    <nav className="space-y-0.5">
      {headings.map(heading => {
        const indent = (heading.level - 1) * 12;
        const isActive = activeId === heading.id;

        return (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={`flex items-start gap-1.5 w-full text-left py-1 text-[13px] leading-snug transition-colors
              ${isActive
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300'
              }`}
            style={{ paddingLeft: indent }}
          >
            <span
              className={`w-1 h-1 rounded-full mt-[7px] shrink-0 transition-colors
                ${isActive ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-neutral-600'}`}
            />
            <span className="line-clamp-2">{heading.text}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <aside className="hidden xl:block w-52 shrink-0">
        <div className="sticky top-8 pt-32 pr-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-neutral-500 mb-3">
            On this page
          </h4>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            {tocList}
          </div>
        </div>
      </aside>

      {/* Mobile: floating button */}
      <div className="xl:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed bottom-6 right-6 z-30 p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm
            rounded-full shadow-lg border border-gray-200/80 dark:border-neutral-700/80
            hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Table of contents"
        >
          {mobileOpen ? (
            <X size={20} className="text-gray-600 dark:text-neutral-400" />
          ) : (
            <List size={20} className="text-gray-600 dark:text-neutral-400" />
          )}
        </button>
      </div>

      {/* Mobile: popover (portalled to body, AnimatePresence inside portal) */}
      {createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                key="toc-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/20 xl:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                key="toc-popover"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ type: 'tween', duration: 0.15 }}
                className="fixed bottom-20 right-6 z-50 w-72 max-h-[60vh] overflow-y-auto
                  bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                  rounded-xl shadow-2xl p-4 xl:hidden"
              >
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-neutral-500 mb-3">
                  On this page
                </h4>
                {tocList}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default KBTableOfContents;
