import React, { useState, useEffect, useMemo } from 'react';
import { List, ChevronRight } from 'lucide-react';

const TableOfContentsBlock = ({ block, content, isEditing, onUpdate }) => {
  const [headings, setHeadings] = useState([]);

  // Content structure: { title: string, maxDepth: number, showNumbers: boolean }
  const tocData = typeof content === 'object' && content !== null
    ? content
    : { title: content || '', maxDepth: 3, showNumbers: false };

  // Extract headings from the page
  useEffect(() => {
    // Find all heading blocks in the page content area
    const extractHeadings = () => {
      const pageContent = document.querySelector('[data-kb-content]');
      if (!pageContent) return [];

      const headingElements = pageContent.querySelectorAll('h1, h2, h3');
      const extracted = [];

      headingElements.forEach((el, index) => {
        const level = parseInt(el.tagName[1]);
        if (level <= (tocData.maxDepth || 3)) {
          // Generate ID if not exists
          if (!el.id) {
            el.id = `heading-${index}-${el.textContent?.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`;
          }
          extracted.push({
            id: el.id,
            text: el.textContent || '',
            level
          });
        }
      });

      return extracted;
    };

    // Initial extraction
    setHeadings(extractHeadings());

    // Re-extract on mutations
    const observer = new MutationObserver(() => {
      setHeadings(extractHeadings());
    });

    const pageContent = document.querySelector('[data-kb-content]');
    if (pageContent) {
      observer.observe(pageContent, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [tocData.maxDepth]);

  // Smooth scroll to heading
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate numbered prefix
  const getNumberPrefix = (headings, index, level) => {
    if (!tocData.showNumbers) return '';

    const counters = [0, 0, 0];
    for (let i = 0; i <= index; i++) {
      const h = headings[i];
      const lvl = h.level - 1;
      counters[lvl]++;
      // Reset lower levels
      for (let j = lvl + 1; j < 3; j++) {
        counters[j] = 0;
      }
    }

    return counters.slice(0, level).filter(c => c > 0).join('.') + '. ';
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={tocData.title || ''}
            onChange={(e) => onUpdate?.({ ...tocData, title: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Table of Contents"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Max Heading Depth
            </label>
            <select
              value={tocData.maxDepth || 3}
              onChange={(e) => onUpdate?.({ ...tocData, maxDepth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>H1 only</option>
              <option value={2}>H1 - H2</option>
              <option value={3}>H1 - H3 (default)</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tocData.showNumbers || false}
                onChange={(e) => onUpdate?.({ ...tocData, showNumbers: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[14px] text-gray-700 dark:text-neutral-300">
                Show numbers
              </span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg">
          <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-3">
            Preview ({headings.length} headings found)
          </p>
          {headings.length === 0 ? (
            <p className="text-[14px] text-gray-400 dark:text-neutral-500 italic">
              No headings found on this page. Add heading blocks to generate a table of contents.
            </p>
          ) : (
            <TOCList
              headings={headings}
              tocData={tocData}
              onItemClick={() => {}}
              getNumberPrefix={getNumberPrefix}
            />
          )}
        </div>
      </div>
    );
  }

  if (headings.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <List size={32} className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">No headings found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 bg-gray-50/60 dark:bg-neutral-900/40 border border-gray-100 dark:border-neutral-800 rounded-xl">
      {tocData.title && (
        <h4 className="text-[14px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
          {tocData.title}
        </h4>
      )}
      <TOCList
        headings={headings}
        tocData={tocData}
        onItemClick={scrollToHeading}
        getNumberPrefix={getNumberPrefix}
      />
    </div>
  );
};

// Separate list component
const TOCList = ({ headings, tocData, onItemClick, getNumberPrefix }) => {
  return (
    <nav className="space-y-1">
      {headings.map((heading, index) => {
        const indent = (heading.level - 1) * 16;
        const prefix = getNumberPrefix(headings, index, heading.level);

        return (
          <button
            key={heading.id}
            onClick={() => onItemClick(heading.id)}
            className="group flex items-center gap-2 w-full text-left py-1 text-[14px] text-gray-500 dark:text-neutral-400
              hover:text-gray-900 dark:hover:text-neutral-200 transition-colors"
            style={{ paddingLeft: indent }}
          >
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-600 flex-shrink-0 group-hover:bg-gray-500 transition-colors" />
            <span className="truncate">
              {prefix}{heading.text}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default TableOfContentsBlock;
