import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';

const ZenMoveAgentSelector = ({ agents = [], selectedAgentId, onSelectAgent }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedAgent = agents.find(a => a._id === selectedAgentId);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlightIndex]) {
      e.preventDefault();
      onSelectAgent(filtered[highlightIndex]._id);
      setOpen(false);
      setSearch('');
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm border rounded-lg transition-all whitespace-nowrap ${
          selectedAgent
            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800'
            : 'text-gray-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">
          {selectedAgent ? selectedAgent.name : 'Select Agent'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-neutral-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search agents..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md outline-none focus:border-cyan-400 dark:focus:border-cyan-600 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Agent list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No agents found</div>
            ) : (
              filtered.map((agent, i) => (
                <button
                  key={agent._id}
                  onClick={() => {
                    onSelectAgent(agent._id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                    i === highlightIndex
                      ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300'
                      : agent._id === selectedAgentId
                        ? 'bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="truncate">{agent.name}</span>
                  {agent._id === selectedAgentId && (
                    <span className="ml-auto text-cyan-500 text-xs">●</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZenMoveAgentSelector;
