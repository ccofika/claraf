import React, { useState, useEffect } from 'react';
import { RefreshCw, Link2, Unlink, AlertTriangle } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';

const SyncedBlock = ({ block, content, isEditing, onUpdate }) => {
  const { pages } = useKnowledgeBase();
  const [sourceContent, setSourceContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Content structure: { sourcePageId: string, sourceBlockId: string }
  const syncData = typeof content === 'object' && content !== null
    ? content
    : { sourcePageId: '', sourceBlockId: '' };

  // Find the source block content
  useEffect(() => {
    if (!syncData.sourcePageId || !syncData.sourceBlockId) return;

    setLoading(true);
    setError(null);

    // Find page in tree
    const findPage = (pageList, id) => {
      if (!pageList) return null;
      for (const p of pageList) {
        if (p._id === id || p._id?.toString() === id?.toString()) return p;
        if (p.children) {
          const found = findPage(p.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const sourcePage = findPage(pages, syncData.sourcePageId);
    if (!sourcePage) {
      setError('Source page not found');
      setLoading(false);
      return;
    }

    const sourceBlock = sourcePage.blocks?.find(b => b.id === syncData.sourceBlockId);
    if (!sourceBlock) {
      setError('Source block not found');
      setLoading(false);
      return;
    }

    setSourceContent(sourceBlock);
    setLoading(false);
  }, [syncData.sourcePageId, syncData.sourceBlockId, pages]);

  if (isEditing) {
    // Get flat list of all pages for selection
    const flatPages = [];
    const flatten = (pageList, depth = 0) => {
      if (!pageList) return;
      for (const p of pageList) {
        flatPages.push({ ...p, depth });
        if (p.children) flatten(p.children, depth + 1);
      }
    };
    flatten(pages);

    // Get blocks from selected page
    const selectedPage = flatPages.find(p =>
      p._id === syncData.sourcePageId || p._id?.toString() === syncData.sourcePageId
    );
    const availableBlocks = selectedPage?.blocks || [];

    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Link2 size={16} className="text-blue-500" />
          <span className="text-[13px] font-medium text-gray-700 dark:text-neutral-300">Synced Block</span>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Source Page
          </label>
          <select
            value={syncData.sourcePageId || ''}
            onChange={(e) => onUpdate?.({ ...syncData, sourcePageId: e.target.value, sourceBlockId: '' })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a page...</option>
            {flatPages.map(p => (
              <option key={p._id} value={p._id}>
                {'  '.repeat(p.depth)}{p.icon || ''} {p.title}
              </option>
            ))}
          </select>
        </div>

        {syncData.sourcePageId && (
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Source Block
            </label>
            <select
              value={syncData.sourceBlockId || ''}
              onChange={(e) => onUpdate?.({ ...syncData, sourceBlockId: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a block...</option>
              {availableBlocks.map(b => (
                <option key={b.id} value={b.id}>
                  [{b.type}] {typeof b.defaultContent === 'string'
                    ? b.defaultContent.substring(0, 60)
                    : b.type}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-[12px] text-gray-400 dark:text-neutral-500">
          Synced blocks mirror content from another block. Changes to the source will be reflected here.
        </p>
      </div>
    );
  }

  if (!syncData.sourcePageId || !syncData.sourceBlockId) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-100 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-700">
        <div className="text-center">
          <Unlink size={24} className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">No synced block configured</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
        <RefreshCw size={20} className="animate-spin text-blue-500 mr-2" />
        <span className="text-[13px] text-blue-500">Loading synced content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
        <span className="text-[13px] text-amber-600 dark:text-amber-400">{error}</span>
      </div>
    );
  }

  if (!sourceContent) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <RefreshCw size={16} className="text-gray-400" />
        <span className="text-[13px] text-gray-500 dark:text-neutral-400">Synced block content unavailable</span>
      </div>
    );
  }

  // Render the synced content with a visual indicator
  return (
    <div className="relative">
      <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-blue-400 dark:bg-blue-500 rounded-full" />
      <div className="pl-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Link2 size={12} className="text-blue-400" />
          <span className="text-[11px] text-blue-400 dark:text-blue-500 font-medium">Synced</span>
        </div>
        <div className="text-[15px] text-gray-800 dark:text-neutral-200 leading-relaxed">
          {typeof sourceContent.defaultContent === 'string'
            ? sourceContent.defaultContent
            : JSON.stringify(sourceContent.defaultContent)}
        </div>
      </div>
    </div>
  );
};

export default SyncedBlock;
