import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { X, Search, FileText, Hash, Check, Tag, ListChecks, MessageSquare, ChevronDown, Globe, Users, UserCircle } from 'lucide-react';
import { TicketContentDisplay } from './TicketRichTextEditor';
import { useMacros } from '../hooks/useMacros';
import { useAuth } from '../context/AuthContext';
import { staggerContainer, staggerItem, fadeInUp, fadeInRight, duration, easing } from '../utils/animations';
import { getScorecardConfig, requiresVariantSelection } from '../data/scorecardConfig';

// Admin roles that can view all macros
const MACRO_ADMIN_ROLES = ['admin', 'qa-admin'];

const ChooseMacroModal = ({
  open,
  onOpenChange,
  onSelectMacro,
  agentPosition = null,
  currentScorecardVariant = null // Current variant selected in the ticket
}) => {
  const { user } = useAuth();
  const {
    macros,
    loading,
    fetchMacros,
    searchMacros,
    fetchQAGradersWithCounts,
    fetchMacrosByCreator,
    searchMacrosByCreator
  } = useMacros();
  const [selectedMacro, setSelectedMacro] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('good'); // 'good' or 'bad'

  // Check if current user is admin (admin or qa-admin role)
  const isAdmin = MACRO_ADMIN_ROLES.includes(user?.role);

  // Admin state for viewing other users' macros
  const [adminGraders, setAdminGraders] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showCreatorDropdown, setShowCreatorDropdown] = useState(false);
  const creatorDropdownRef = useRef(null);

  // Get scorecard config for the position
  const scorecardConfig = agentPosition ? getScorecardConfig(agentPosition) : null;
  const needsVariantSelection = agentPosition && requiresVariantSelection(agentPosition);
  const availableVariants = scorecardConfig?.variants || [];

  // Check if macro has extra data (defined early for use in useEffect)
  // New structure: goodScorecardData/badScorecardData[position][variant] = { key: value }
  const currentScorecardData = selectedFeedbackType === 'good'
    ? selectedMacro?.goodScorecardData
    : selectedMacro?.badScorecardData;
  const scorecardDataForPosition = agentPosition && currentScorecardData?.[agentPosition];
  const hasScorecardValues = scorecardDataForPosition && (
    // Check if any variant has values
    Object.keys(scorecardDataForPosition).some(variantKey => {
      const values = scorecardDataForPosition[variantKey];
      return values && typeof values === 'object' && Object.keys(values).length > 0;
    })
  );

  // Fetch macros on open
  useEffect(() => {
    if (open) {
      fetchMacros();
      setSelectedMacro(null);
      setSearchTerm('');
      setSearchResults([]);
      setSelectedVariant(null);
      setSelectedFeedbackType('good');
      // Reset admin state
      setSelectedCreator(null);
      setShowCreatorDropdown(false);
      // Fetch admin graders if user is admin
      if (isAdmin) {
        fetchQAGradersWithCounts().then(graders => setAdminGraders(graders || []));
      }
    }
  }, [open, fetchMacros, isAdmin, fetchQAGradersWithCounts]);

  // Fetch macros when creator selection changes (admin only)
  useEffect(() => {
    if (isAdmin && selectedCreator) {
      fetchMacrosByCreator(selectedCreator._id);
      setSelectedMacro(null);
      setSearchResults([]);
      setSearchTerm('');
    } else if (isAdmin && selectedCreator === null && open) {
      fetchMacros();
    }
  }, [selectedCreator, isAdmin, fetchMacrosByCreator, fetchMacros, open]);

  // Close creator dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (creatorDropdownRef.current && !creatorDropdownRef.current.contains(event.target)) {
        setShowCreatorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected variant when macro or currentScorecardVariant changes
  useEffect(() => {
    if (selectedMacro && hasScorecardValues) {
      // If ticket already has a variant selected, use that
      if (currentScorecardVariant) {
        setSelectedVariant(currentScorecardVariant);
      } else if (selectedMacro.scorecardData?.[agentPosition]?.variant) {
        // Otherwise use the variant from the macro
        setSelectedVariant(selectedMacro.scorecardData[agentPosition].variant);
      } else if (availableVariants.length > 0) {
        // Default to first variant if none selected
        setSelectedVariant(availableVariants[0].key);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [selectedMacro, currentScorecardVariant, agentPosition, availableVariants, hasScorecardValues]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      // Use creator-filtered search if admin has selected a creator
      const results = isAdmin && selectedCreator
        ? await searchMacrosByCreator(searchTerm, selectedCreator._id)
        : await searchMacros(searchTerm);
      setSearchResults(results);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, searchMacros, searchMacrosByCreator, isAdmin, selectedCreator]);

  // Get display list
  const displayMacros = searchTerm.trim() ? searchResults : macros;

  // Check if macro has categories
  const hasCategories = selectedMacro?.categories && selectedMacro.categories.length > 0;
  const hasExtraData = hasCategories || hasScorecardValues;

  // Handle select - feedback only
  const handleSelectFeedbackOnly = () => {
    if (selectedMacro && onSelectMacro) {
      onSelectMacro(selectedMacro, {
        applyCategories: false,
        applyScorecard: false,
        feedbackType: selectedFeedbackType // Pass the selected feedback type (good/bad)
      });
      onOpenChange(false);
    }
  };

  // Handle select - all data
  const handleSelectAll = () => {
    if (selectedMacro && onSelectMacro) {
      onSelectMacro(selectedMacro, {
        applyCategories: true,
        applyScorecard: true,
        scorecardVariant: selectedVariant, // Pass the selected variant
        feedbackType: selectedFeedbackType, // Pass the selected feedback type (good/bad)
        scorecardData: currentScorecardData // Pass the correct scorecard data
      });
      onOpenChange(false);
    }
  };

  // Handle double click to select immediately (feedback + all data if exists)
  // Double-click defaults to 'good' feedback type
  const handleDoubleClick = (macro) => {
    if (onSelectMacro) {
      const macroHasCategories = macro.categories && macro.categories.length > 0;
      // Check good scorecard data since double-click defaults to good
      const goodScorecardForPosition = macro.goodScorecardData?.[agentPosition];
      const macroHasScorecard = agentPosition && goodScorecardForPosition &&
        Object.keys(goodScorecardForPosition).some(vk => {
          const vals = goodScorecardForPosition[vk];
          return vals && typeof vals === 'object' && Object.keys(vals).length > 0;
        });

      // Determine variant for double-click
      let variant = null;
      if (macroHasScorecard && needsVariantSelection) {
        variant = currentScorecardVariant ||
          (availableVariants.length > 0 ? availableVariants[0].key : null);
      }

      // If macro has extra data, apply all. Otherwise just feedback.
      // Double-click defaults to 'good' feedback
      onSelectMacro(macro, {
        applyCategories: macroHasCategories,
        applyScorecard: macroHasScorecard,
        scorecardVariant: variant,
        feedbackType: 'good', // Default to good on double-click
        scorecardData: macro.goodScorecardData
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-[70vw] !h-[60vh] !max-h-[60vh] p-0 gap-0 flex flex-col overflow-hidden">
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
            {/* Admin Creator Dropdown */}
            {isAdmin && (
              <div className="p-3 border-b border-gray-200 dark:border-neutral-800" ref={creatorDropdownRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCreatorDropdown(!showCreatorDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className={selectedCreator ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                        {selectedCreator ? selectedCreator.name : 'My Macros'}
                      </span>
                      {selectedCreator && (
                        <span className="text-xs text-gray-400">({selectedCreator.macroCount})</span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCreatorDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showCreatorDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCreator(null);
                          setShowCreatorDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                          !selectedCreator ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <UserCircle className="w-4 h-4" />
                          My Macros
                        </span>
                      </button>
                      <div className="border-t border-gray-200 dark:border-neutral-700 my-1" />
                      {adminGraders.map(grader => (
                        <button
                          key={grader._id}
                          type="button"
                          onClick={() => {
                            setSelectedCreator(grader);
                            setShowCreatorDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                            selectedCreator?._id === grader._id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{grader.name}</span>
                            <span className="text-xs text-gray-400">({grader.macroCount})</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                  {displayMacros.map((macro) => {
                    const macroHasCategories = macro.categories && macro.categories.length > 0;
                    const hasGoodScorecard = agentPosition && macro.goodScorecardData?.[agentPosition] &&
                      Object.keys(macro.goodScorecardData[agentPosition] || {}).length > 0;
                    const hasBadScorecard = agentPosition && macro.badScorecardData?.[agentPosition] &&
                      Object.keys(macro.badScorecardData[agentPosition] || {}).length > 0;
                    const macroHasScorecard = hasGoodScorecard || hasBadScorecard;

                    return (
                      <motion.button
                        key={macro._id}
                        onClick={() => setSelectedMacro(macro)}
                        onDoubleClick={() => handleDoubleClick(macro)}
                        className={`w-full text-left px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                          selectedMacro?._id === macro._id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                        }`}
                        variants={staggerItem}
                        whileHover={{ x: 4, transition: { duration: duration.fast } }}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                            {macro.title}
                          </p>
                          {/* Visibility icons */}
                          <span className="flex items-center gap-1 flex-shrink-0">
                            {macro.isPublic && (
                              <Globe className="w-3.5 h-3.5 text-blue-500" title="Public" />
                            )}
                            {!macro.isOwner && !macro.isPublic && macro.isSharedWithMe && (
                              <Users className="w-3.5 h-3.5 text-green-500" title="Shared with you" />
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Show creator name for non-owned macros */}
                          {!macro.isOwner && (
                            <span className="text-xs text-purple-500">
                              by {macro.createdBy?.name || 'Unknown'}
                            </span>
                          )}
                          {macroHasCategories && (
                            <span className="text-xs text-blue-500 flex items-center gap-0.5">
                              <Tag className="w-3 h-3" />
                              {macro.categories.length}
                            </span>
                          )}
                          {macroHasScorecard && (
                            <span className="text-xs text-purple-500 flex items-center gap-0.5">
                              <ListChecks className="w-3 h-3" />
                              SC
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
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
                <motion.div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: duration.normal, ease: easing.smooth }}
                  key={selectedMacro._id}
                >
                  {/* Title */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                      Title
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedMacro.title}
                    </p>
                  </div>

                  {/* Feedback Preview with Good/Bad Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Feedback Content
                      </p>
                      {/* Good/Bad Selector */}
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setSelectedFeedbackType('good')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            selectedFeedbackType === 'good'
                              ? 'bg-green-500 text-white'
                              : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          Good
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedFeedbackType('bad')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            selectedFeedbackType === 'bad'
                              ? 'bg-red-500 text-white'
                              : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          Bad
                        </button>
                      </div>
                    </div>
                    <div className={`bg-gray-50 dark:bg-neutral-950 rounded-lg border p-3 ${
                      selectedFeedbackType === 'good'
                        ? 'border-green-200 dark:border-green-800'
                        : 'border-red-200 dark:border-red-800'
                    }`}>
                      <TicketContentDisplay
                        content={selectedFeedbackType === 'good' ? selectedMacro.goodFeedback : selectedMacro.badFeedback}
                        className="text-sm text-gray-700 dark:text-neutral-300"
                      />
                    </div>
                  </div>

                  {/* Categories Preview */}
                  {hasCategories && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Categories ({selectedMacro.categories.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMacro.categories.map(cat => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scorecard Preview */}
                  {hasScorecardValues && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <ListChecks className="w-3 h-3" />
                        Scorecard Values for {agentPosition}
                      </p>

                      {/* Variant Selection for positions that require it */}
                      {needsVariantSelection && availableVariants.length > 0 && (
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 dark:text-neutral-400 mb-1 block">
                            {currentScorecardVariant ? 'Scorecard type (from ticket):' : 'Select scorecard type:'}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedVariant || ''}
                              onChange={(e) => setSelectedVariant(e.target.value)}
                              disabled={!!currentScorecardVariant} // Disable if ticket already has variant
                              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {availableVariants.map(v => (
                                <option key={v.key} value={v.key}>{v.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                          {currentScorecardVariant && (
                            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                              Using variant already selected in ticket
                            </p>
                          )}
                        </div>
                      )}

                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-3">
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {(() => {
                            // Count values for the selected variant
                            const variantValues = selectedVariant && scorecardDataForPosition[selectedVariant];
                            if (variantValues && typeof variantValues === 'object') {
                              return `${Object.keys(variantValues).length} scorecard fields will be applied`;
                            }
                            // Fallback: count all values across all variants
                            let total = 0;
                            Object.keys(scorecardDataForPosition).forEach(vk => {
                              const vals = scorecardDataForPosition[vk];
                              if (vals && typeof vals === 'object') {
                                total += Object.keys(vals).length;
                              }
                            });
                            return `${total} scorecard fields available`;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                  <div className="flex items-center justify-between">
                    {/* Info text */}
                    {hasExtraData && (
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        This macro includes categories/scorecard data
                      </p>
                    )}
                    {!hasExtraData && <div />}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenChange(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                      >
                        Cancel
                      </button>

                      {hasExtraData ? (
                        <>
                          <button
                            onClick={handleSelectFeedbackOnly}
                            className="px-3 py-1.5 text-sm text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                          >
                            Feedback Only
                          </button>
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Insert All
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleSelectFeedbackOnly}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Insert Macro
                        </button>
                      )}
                    </div>
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
