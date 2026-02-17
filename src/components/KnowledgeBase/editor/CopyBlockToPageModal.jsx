import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Send, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';

const API_URL = process.env.REACT_APP_API_URL;

const CopyBlockToPageModal = ({ block, excludePageId, onClose }) => {
  const { pageTree } = useKnowledgeBase();
  const [search, setSearch] = useState('');
  const [copying, setCopying] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Flatten tree into list with depth for indentation
  const flatPages = useMemo(() => {
    const result = [];
    const flatten = (nodes, depth = 0) => {
      for (const node of nodes) {
        if (String(node._id) !== String(excludePageId)) {
          result.push({ ...node, depth });
        }
        if (node.children?.length) {
          flatten(node.children, depth + 1);
        }
      }
    };
    flatten(pageTree || []);
    return result;
  }, [pageTree, excludePageId]);

  // Filter by search
  const filteredPages = useMemo(() => {
    if (!search.trim()) return flatPages;
    const q = search.toLowerCase();
    return flatPages.filter(p => p.title.toLowerCase().includes(q));
  }, [flatPages, search]);

  const handleCopy = async (targetPageId) => {
    if (copying) return;
    try {
      setCopying(true);
      setSelectedPageId(targetPageId);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/knowledge-base/pages/${targetPageId}/copy-block`,
        { block },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Block copied to "${res.data.targetPageTitle}"`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to copy block');
    } finally {
      setCopying(false);
      setSelectedPageId(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99998]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-[480px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              Copy Block to Page
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-700">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-neutral-900
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                text-gray-700 dark:text-neutral-300 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Page list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">
              {search ? 'No pages match your search' : 'No other pages available'}
            </div>
          ) : (
            filteredPages.map(page => (
              <button
                key={page._id}
                onClick={() => handleCopy(page._id)}
                disabled={copying}
                className="w-full flex items-center gap-2 px-4 py-2 text-left
                  hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors
                  disabled:opacity-50"
                style={{ paddingLeft: `${16 + page.depth * 20}px` }}
              >
                {page.depth > 0 && (
                  <ChevronRight size={12} className="text-gray-300 dark:text-neutral-600 shrink-0" />
                )}
                <span className="text-base shrink-0">{page.icon || '\uD83D\uDCC4'}</span>
                <span className="text-[13px] text-gray-700 dark:text-neutral-300 truncate">
                  {page.title}
                </span>
                {copying && String(selectedPageId) === String(page._id) && (
                  <Loader2 size={14} className="ml-auto animate-spin text-blue-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CopyBlockToPageModal;
