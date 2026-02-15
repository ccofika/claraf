import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  ArrowDownAZ, ArrowUpDown, X, ListTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockRenderer from '../BlockRenderer';
import InnerBlockEditor from './InnerBlockEditor';

// ── Entry title button for view mode ──
const EntryTitleButton = ({ entry, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex items-center gap-2.5 w-full text-left py-2 px-3 rounded-lg
      text-[14px] transition-all duration-150
      ${isActive
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30 font-medium'
        : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100/60 dark:hover:bg-neutral-800/50'
      }`}
  >
    <ChevronDown
      size={14}
      className={`flex-shrink-0 transition-transform duration-200
        ${isActive ? 'rotate-0 text-blue-500' : '-rotate-90 text-gray-300 dark:text-neutral-600'}`}
    />
    <span className="truncate">{entry.title || 'Untitled Entry'}</span>
  </button>
);

const ExpandableContentListBlock = ({ block, content, isEditing, onUpdate }) => {
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);

  const data = typeof content === 'object' && content !== null
    ? content
    : { entries: [], sortMode: 'manual' };

  const entries = data.entries || [];
  const sortMode = data.sortMode || 'manual';

  // ── Alphabetical grouping ──
  const sortedAndGrouped = useMemo(() => {
    if (sortMode !== 'alphabetical') return null;

    const sorted = [...entries].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    );

    const groups = {};
    sorted.forEach(entry => {
      const firstChar = (entry.title || '').charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(entry);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      })
      .map(letter => ({ letter, entries: groups[letter] }));
  }, [entries, sortMode]);

  // ── Entry CRUD ──
  const addEntry = () => {
    const newEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      blocks: []
    };
    onUpdate?.({ ...data, entries: [...entries, newEntry] });
    setEditingEntryId(newEntry.id);
  };

  const removeEntry = (entryId) => {
    onUpdate?.({ ...data, entries: entries.filter(e => e.id !== entryId) });
    if (editingEntryId === entryId) setEditingEntryId(null);
  };

  const renameEntry = (entryId, newTitle) => {
    onUpdate?.({
      ...data,
      entries: entries.map(e => e.id === entryId ? { ...e, title: newTitle } : e)
    });
  };

  const moveEntry = (entryId, direction) => {
    const idx = entries.findIndex(e => e.id === entryId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= entries.length) return;
    const newEntries = [...entries];
    [newEntries[idx], newEntries[newIdx]] = [newEntries[newIdx], newEntries[idx]];
    onUpdate?.({ ...data, entries: newEntries });
  };

  const toggleSortMode = () => {
    onUpdate?.({ ...data, sortMode: sortMode === 'manual' ? 'alphabetical' : 'manual' });
  };

  const updateEntryBlocks = (entryId, newBlocks) => {
    onUpdate?.({ ...data, entries: entries.map(e => e.id === entryId ? { ...e, blocks: newBlocks } : e) });
  };

  // ── EDIT MODE ──
  if (isEditing) {
    return (
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTree size={16} className="text-blue-500" />
            <span className="text-[13px] font-medium text-gray-700 dark:text-neutral-300">
              Expandable Content List ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSortMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium
                bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400
                transition-colors"
              title={sortMode === 'alphabetical' ? 'Switch to manual order' : 'Switch to alphabetical'}
            >
              {sortMode === 'alphabetical' ? <ArrowDownAZ size={14} /> : <ArrowUpDown size={14} />}
              {sortMode === 'alphabetical' ? 'A-Z' : 'Manual'}
            </button>
            <button
              onClick={addEntry}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium
                bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400
                rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Plus size={13} />
              Add Entry
            </button>
          </div>
        </div>

        {entries.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[13px] text-gray-400 dark:text-neutral-500">
            No entries yet. Click "Add Entry" to get started.
          </div>
        )}

        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800/50">
              {/* Entry title row */}
              <div className="flex items-center gap-2 px-3 py-2">
                {sortMode === 'manual' && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveEntry(entry.id, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300
                        disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => moveEntry(entry.id, 1)}
                      disabled={idx === entries.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300
                        disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={entry.title || ''}
                  onChange={(e) => renameEntry(entry.id, e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 text-[14px] text-gray-900 dark:text-white
                    bg-transparent border-0 border-b border-transparent
                    focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="Entry title..."
                  autoFocus={entry.title === '' && editingEntryId === entry.id}
                />

                <button
                  onClick={() => setEditingEntryId(editingEntryId === entry.id ? null : entry.id)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors
                    ${editingEntryId === entry.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-50 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 hover:text-blue-600'
                    }`}
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${editingEntryId === entry.id ? 'rotate-0' : '-rotate-90'}`}
                  />
                  {(entry.blocks || []).length} block{(entry.blocks || []).length !== 1 ? 's' : ''}
                </button>

                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete entry"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Entry child blocks via InnerBlockEditor */}
              {editingEntryId === entry.id && (
                <div className="mx-3 mb-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800 pt-1">
                  <InnerBlockEditor
                    blocks={entry.blocks || []}
                    onBlocksChange={(newBlocks) => updateEntryBlocks(entry.id, newBlocks)}
                    addButtonLabel="Add block inside entry"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── VIEW MODE ──
  if (entries.length === 0) return null;

  const renderEntryList = (entriesToRender) =>
    entriesToRender.map(entry => (
      <EntryTitleButton
        key={entry.id}
        entry={entry}
        isActive={expandedEntryId === entry.id}
        onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
      />
    ));

  const expandedEntry = expandedEntryId
    ? entries.find(e => e.id === expandedEntryId)
    : null;

  return (
    <div>
      <div className="px-5 py-4 bg-gray-50/60 dark:bg-neutral-900/40 border border-gray-100 dark:border-neutral-800 rounded-xl">
        {sortMode === 'alphabetical' && sortedAndGrouped
          ? sortedAndGrouped.map(group => (
              <div key={group.letter}>
                <h4 className="text-[12px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider
                  mt-3 first:mt-0 mb-0.5 px-3">
                  {group.letter}
                </h4>
                {renderEntryList(group.entries)}
              </div>
            ))
          : renderEntryList(entries)
        }
      </div>

      <AnimatePresence mode="wait">
        {expandedEntry && expandedEntry.blocks && expandedEntry.blocks.length > 0 && (
          <motion.div
            key={expandedEntry.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 pl-5 border-l-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[18px] font-semibold text-gray-800 dark:text-neutral-200">
                  {expandedEntry.title || 'Untitled Entry'}
                </h3>
                <button
                  onClick={() => setExpandedEntryId(null)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-gray-400
                    hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-100
                    dark:hover:bg-neutral-800 rounded-md transition-colors"
                  title="Collapse"
                >
                  <X size={14} />
                  Collapse
                </button>
              </div>
              <div className="space-y-3">
                {expandedEntry.blocks.map(child => (
                  <BlockRenderer key={child.id} block={child} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandableContentListBlock;
