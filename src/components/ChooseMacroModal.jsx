import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { X, Search, FileText, Hash, Check } from 'lucide-react';
import { TicketContentDisplay } from './TicketRichTextEditor';
import { useMacros } from '../hooks/useMacros';

const ChooseMacroModal = ({ open, onOpenChange, onSelectMacro }) => {
  const { macros, loading, fetchMacros, searchMacros } = useMacros();
  const [selectedMacro, setSelectedMacro] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch macros on open
  useEffect(() => {
    if (open) {
      fetchMacros();
      setSelectedMacro(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [open, fetchMacros]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchMacros(searchTerm);
      setSearchResults(results);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, searchMacros]);

  // Get display list
  const displayMacros = searchTerm.trim() ? searchResults : macros;

  // Handle select
  const handleSelect = () => {
    if (selectedMacro && onSelectMacro) {
      onSelectMacro(selectedMacro);
      onOpenChange(false);
    }
  };

  // Handle double click to select immediately
  const handleDoubleClick = (macro) => {
    if (onSelectMacro) {
      onSelectMacro(macro);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-[70vw] !h-[50vh] !max-h-[50vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Choose Macro
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Main Content - 30/70 Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR - Macro List (30%) */}
          <div className="w-[30%] flex flex-col border-r border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search macros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white dark:bg-neutral-900 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Macro List */}
            <div className="flex-1 overflow-y-auto">
              {loading || isSearching ? (
                <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                  Loading...
                </div>
              ) : displayMacros.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                  {searchTerm ? 'No macros found' : 'No macros yet'}
                </div>
              ) : (
                displayMacros.map((macro) => (
                  <button
                    key={macro._id}
                    onClick={() => setSelectedMacro(macro)}
                    onDoubleClick={() => handleDoubleClick(macro)}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                      selectedMacro?._id === macro._id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {macro.title}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDE - Preview (70%) */}
          <div className="w-[70%] flex flex-col overflow-hidden">
            {!selectedMacro ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                <div className="text-center">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a macro to preview</p>
                  <p className="text-xs mt-1 opacity-75">Double-click to insert directly</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Title */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                      Title
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedMacro.title}
                    </p>
                  </div>

                  {/* Feedback Preview */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                      Content
                    </p>
                    <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 p-3">
                      <TicketContentDisplay
                        content={selectedMacro.feedback}
                        className="text-sm text-gray-700 dark:text-neutral-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSelect}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Insert Macro
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChooseMacroModal;
