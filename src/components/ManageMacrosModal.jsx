import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { X, Plus, Trash2, Search, FileText, ExternalLink, Hash, ChevronDown, Copy } from 'lucide-react';
import TicketRichTextEditor from './TicketRichTextEditor';
import ScorecardEditor from './ScorecardEditor';
import { useMacros } from '../hooks/useMacros';
import { staggerContainer, staggerItem, fadeInUp, fadeInLeft, duration, easing } from '../utils/animations';
import { getScorecardCategories, hasScorecard, getScorecardConfig, requiresVariantSelection } from '../data/scorecardConfig';

const SCORECARD_POSITIONS = ['Junior Scorecard', 'Medior Scorecard', 'Senior Scorecard'];

const ManageMacrosModal = ({ open, onOpenChange, onViewTicket }) => {
  const {
    macros,
    loading,
    fetchMacros,
    createMacro,
    updateMacro,
    deleteMacro,
    getMacroTickets
  } = useMacros();

  const [selectedMacro, setSelectedMacro] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    title: '',
    feedback: '',
    categories: [],
    scorecardData: {}
  });

  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);
  const categoryDropdownRef = useRef(null);
  const categoryInputRef = useRef(null);
  const categoryListRef = useRef(null);

  // Scorecard position selector
  const [selectedScorecardPosition, setSelectedScorecardPosition] = useState('Junior Scorecard');

  // Used in tickets state
  const [usedInTickets, setUsedInTickets] = useState({ tickets: [], total: 0, hasMore: false });
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsOffset, setTicketsOffset] = useState(0);

  // Default categories list
  const defaultCategories = [
    'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program',
    'Available bonuses', 'Balance issues', 'Bet | Bet archive', 'Birthday bonus',
    'Break in play', 'Bonus crediting', 'Bonus drops', 'Casino',
    'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
    'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data deletion',
    'Deposit bonus', 'Exclusion | General', 'Exclusion | Self exclusion',
    'Exclusion | Casino exclusion', 'Fiat General', 'Fiat - CAD', 'Fiat - BRL',
    'Fiat - JPY', 'Fiat - INR', 'Fiat - PEN/ARS/CLP', 'Forum', 'Funds recovery',
    'Games issues', 'Games | Providers | Rules', 'Games | Live games',
    'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus',
    'No luck tickets | RTP', 'Phishing | Scam attempt', 'Phone removal',
    'Pre/Post monthly bonus', 'Promotions', 'Provably fair', 'Race', 'Rakeback',
    'Reload', 'Responsible gambling', 'Roles', 'Rollover',
    'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics',
    'Stake chat', 'Stake original', 'Tech issues | Jira cases | Bugs',
    'Tip recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus', 'Other'
  ];

  const allCategories = hasScorecard(selectedScorecardPosition)
    ? getScorecardCategories(selectedScorecardPosition)
    : defaultCategories;

  const filteredCategories = allCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
    !formData.categories.includes(cat)
  );

  // Fetch macros on open
  useEffect(() => {
    if (open) {
      fetchMacros();
      setSelectedMacro(null);
      setIsCreating(false);
      setFormData({ title: '', feedback: '', categories: [], scorecardData: {} });
      setSelectedScorecardPosition('Junior Scorecard');
    }
  }, [open, fetchMacros]);

  // Update form when macro is selected
  useEffect(() => {
    if (selectedMacro) {
      setFormData({
        title: selectedMacro.title,
        feedback: selectedMacro.feedback,
        categories: selectedMacro.categories || [],
        scorecardData: selectedMacro.scorecardData || {}
      });
      setIsCreating(false);
      loadUsedInTickets(selectedMacro._id);
      // Set initial scorecard position to first one that has data, or Junior
      const positionsWithData = SCORECARD_POSITIONS.filter(pos => selectedMacro.scorecardData?.[pos]);
      setSelectedScorecardPosition(positionsWithData[0] || 'Junior Scorecard');
    }
  }, [selectedMacro]);

  // Reset highlight when search changes
  useEffect(() => {
    setCategoryHighlightIndex(0);
  }, [categorySearch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (showCategoryDropdown && categoryListRef.current) {
      const highlighted = categoryListRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [categoryHighlightIndex, showCategoryDropdown]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryKeyDown = (e) => {
    if (!showCategoryDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowCategoryDropdown(true);
      }
      return;
    }

    const totalItems = filteredCategories.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setCategoryHighlightIndex(prev => (prev + 1) % Math.max(totalItems, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCategoryHighlightIndex(prev => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCategories[categoryHighlightIndex]) {
          const selected = filteredCategories[categoryHighlightIndex];
          setFormData(prev => ({ ...prev, categories: [...prev.categories, selected] }));
          setCategorySearch('');
          setCategoryHighlightIndex(0);
          setTimeout(() => categoryInputRef.current?.focus(), 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowCategoryDropdown(false);
        setCategorySearch('');
        break;
      case 'Backspace':
        if (categorySearch === '' && formData.categories.length > 0) {
          setFormData(prev => ({ ...prev, categories: prev.categories.slice(0, -1) }));
        }
        break;
      default:
        break;
    }
  };

  // Get scorecard config for selected position
  const currentScorecardConfig = getScorecardConfig(selectedScorecardPosition);
  const needsVariantForPosition = requiresVariantSelection(selectedScorecardPosition);

  // Helper to get values for a specific variant
  const getValuesForVariant = (position, variantKey) => {
    return formData.scorecardData[position]?.[variantKey] || {};
  };

  // Update scorecard values for a specific variant
  const updateScorecardValues = (position, variantKey, values) => {
    setFormData(prev => ({
      ...prev,
      scorecardData: {
        ...prev.scorecardData,
        [position]: {
          ...prev.scorecardData[position],
          [variantKey]: values
        }
      }
    }));
  };

  // Check if position has any scorecard values saved
  const positionHasValues = (position) => {
    const data = formData.scorecardData[position];
    if (!data) return false;
    return Object.keys(data).some(variantKey => {
      const values = data[variantKey];
      return values && typeof values === 'object' && Object.keys(values).length > 0;
    });
  };

  // Find the first scorecard with values that is different from the selected one
  const sourceScorecardForCopy = SCORECARD_POSITIONS.find(pos => {
    if (pos === selectedScorecardPosition) return false;
    return positionHasValues(pos);
  });

  // Copy matching values from another scorecard
  const copyFromScorecard = (sourcePosition) => {
    const sourceData = formData.scorecardData[sourcePosition];
    if (!sourceData) return;

    // Get the config for the target position
    const targetConfig = getScorecardConfig(selectedScorecardPosition);
    if (!targetConfig) return;

    const targetVariants = targetConfig.variants || [{ key: 'use_this_one' }];

    // Copy values to each variant of the target position
    const newPositionData = {};
    targetVariants.forEach(variant => {
      const newValues = {};
      // Try to find matching values from any variant of the source
      Object.keys(sourceData).forEach(sourceVariantKey => {
        const sourceValues = sourceData[sourceVariantKey];
        if (sourceValues && typeof sourceValues === 'object') {
          Object.keys(sourceValues).forEach(key => {
            if (sourceValues[key] !== null && sourceValues[key] !== undefined) {
              newValues[key] = sourceValues[key];
            }
          });
        }
      });
      newPositionData[variant.key] = newValues;
    });

    setFormData(prev => ({
      ...prev,
      scorecardData: {
        ...prev.scorecardData,
        [selectedScorecardPosition]: newPositionData
      }
    }));

    toast.success(`Copied values from ${sourcePosition}`);
  };

  // Load used in tickets
  const loadUsedInTickets = async (macroId, offset = 0) => {
    setLoadingTickets(true);
    try {
      const result = await getMacroTickets(macroId, 10, offset);
      if (offset === 0) {
        setUsedInTickets(result);
      } else {
        setUsedInTickets(prev => ({
          ...result,
          tickets: [...prev.tickets, ...result.tickets]
        }));
      }
      setTicketsOffset(offset);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Filter macros by search term
  const filteredMacros = macros.filter(macro =>
    macro.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create new
  const handleCreateNew = () => {
    setSelectedMacro(null);
    setIsCreating(true);
    setFormData({ title: '', feedback: '', categories: [], scorecardData: {} });
    setUsedInTickets({ tickets: [], total: 0, hasMore: false });
    setSelectedScorecardPosition('Junior Scorecard');
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.feedback.trim()) {
      toast.error('Feedback content is required');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        title: formData.title,
        feedback: formData.feedback,
        categories: formData.categories,
        scorecardData: formData.scorecardData
      };

      if (isCreating) {
        const result = await createMacro(dataToSave);
        if (result.success) {
          toast.success('Macro created successfully');
          setSelectedMacro(result.data);
          setIsCreating(false);
        } else {
          toast.error(result.error);
        }
      } else if (selectedMacro) {
        const result = await updateMacro(selectedMacro._id, dataToSave);
        if (result.success) {
          toast.success('Macro updated successfully');
          setSelectedMacro(result.data);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMacro) return;

    if (!window.confirm(`Are you sure you want to delete "${selectedMacro.title}"?`)) {
      return;
    }

    const result = await deleteMacro(selectedMacro._id);
    if (result.success) {
      toast.success('Macro deleted successfully');
      setSelectedMacro(null);
      setFormData({ title: '', feedback: '', categories: [], scorecardData: {} });
    } else {
      toast.error(result.error);
    }
  };

  // Handle ticket click - open ViewTicket on top without closing ManageMacros
  const handleTicketClick = (item) => {
    if (onViewTicket) {
      // item.ticketId is the populated Ticket document, so use item.ticketId._id for MongoDB ObjectId
      const ticketMongoId = item.ticketId?._id || item.ticketId;
      if (ticketMongoId) {
        onViewTicket(ticketMongoId);
      }
      // Don't close ManageMacrosModal - ViewTicket will open on top
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Manage Macros
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Main Content - 25/75 Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR - Macro List (25%) */}
          <div className="w-1/4 flex flex-col border-r border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search macros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white dark:bg-neutral-900"
                />
              </div>
            </div>

            {/* Macro List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                  Loading macros...
                </div>
              ) : filteredMacros.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                  {searchTerm ? 'No macros found' : 'No macros yet'}
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                  {filteredMacros.map((macro, index) => (
                    <motion.button
                      key={macro._id}
                      onClick={() => setSelectedMacro(macro)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                        selectedMacro?._id === macro._id ? 'bg-gray-100 dark:bg-neutral-800' : ''
                      }`}
                      variants={staggerItem}
                      whileHover={{ x: 4, transition: { duration: duration.fast } }}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {macro.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        Used {macro.usageCount || 0} times
                        {(macro.categories?.length > 0 || Object.keys(macro.scorecardData || {}).length > 0) && (
                          <span className="ml-2 text-blue-500">+data</span>
                        )}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* New Macro Button */}
            <div className="p-3 border-t border-gray-200 dark:border-neutral-800">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Macro
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - Edit Form (75%) */}
          <div className="w-3/4 flex flex-col overflow-hidden">
            {!selectedMacro && !isCreating ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a macro to edit or create a new one</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Two column layout for form */}
                  <div className="flex gap-6">
                    {/* Left column - Title, Feedback, Used In */}
                    <div className="w-1/2 space-y-6">
                      {/* Title */}
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., ontario-ip-issue"
                          className="bg-white dark:bg-neutral-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                          Use a descriptive name. Type # followed by part of the title to quickly insert this macro.
                        </p>
                      </div>

                      {/* Feedback Content */}
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
                          Feedback Content <span className="text-red-500">*</span>
                        </Label>
                        <TicketRichTextEditor
                          value={formData.feedback}
                          onChange={(html) => setFormData({ ...formData, feedback: html })}
                          placeholder="Enter the feedback template content..."
                          rows={10}
                          className="min-h-[200px]"
                        />
                      </div>

                      {/* Used In Tickets - Only show for existing macros */}
                      {selectedMacro && !isCreating && (
                        <div>
                          <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5" />
                            This macro was used in:
                          </Label>
                          <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
                            {loadingTickets && usedInTickets.tickets.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-neutral-400">Loading...</p>
                            ) : usedInTickets.tickets.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-neutral-400 italic">
                                This macro hasn't been used in any tickets yet.
                              </p>
                            ) : (
                              <>
                                <motion.div
                                  className="flex flex-wrap gap-2"
                                  variants={staggerContainer}
                                  initial="initial"
                                  animate="animate"
                                >
                                  {usedInTickets.tickets.map((item, index) => (
                                    <motion.button
                                      key={index}
                                      onClick={() => handleTicketClick(item)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-mono rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                      variants={staggerItem}
                                      whileHover={{ scale: 1.05, transition: { duration: duration.fast } }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {item.ticketNumber || item.ticketId?._id?.slice(-6) || 'Unknown'}
                                    </motion.button>
                                  ))}
                                </motion.div>
                                {usedInTickets.hasMore && (
                                  <button
                                    onClick={() => loadUsedInTickets(selectedMacro._id, ticketsOffset + 10)}
                                    disabled={loadingTickets}
                                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {loadingTickets ? 'Loading...' : `Show more (${usedInTickets.total - usedInTickets.tickets.length} more)`}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right column - Categories & Scorecard */}
                    <div className="w-1/2 space-y-6">
                      {/* Categories */}
                      <div ref={categoryDropdownRef} className="relative">
                        <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
                          Categories (optional)
                        </Label>
                        <div
                          className={`flex flex-wrap items-center gap-1 px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-neutral-800 cursor-text min-h-[38px] border border-gray-200 dark:border-neutral-700 ${showCategoryDropdown ? 'ring-2 ring-gray-900 dark:ring-gray-300' : ''}`}
                          onClick={() => categoryInputRef.current?.focus()}
                        >
                          {formData.categories.map(cat => (
                            <span
                              key={cat}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                            >
                              {cat}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
                                }}
                                className="hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            ref={categoryInputRef}
                            type="text"
                            value={categorySearch}
                            onChange={(e) => {
                              setCategorySearch(e.target.value);
                              setShowCategoryDropdown(true);
                            }}
                            onFocus={() => setShowCategoryDropdown(true)}
                            onKeyDown={handleCategoryKeyDown}
                            placeholder={formData.categories.length === 0 ? "Search categories..." : ""}
                            className="flex-1 min-w-[100px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                          />
                        </div>
                        {showCategoryDropdown && (
                          <div
                            ref={categoryListRef}
                            className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          >
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map((cat, index) => (
                                <button
                                  key={cat}
                                  type="button"
                                  data-highlighted={categoryHighlightIndex === index}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, categories: [...prev.categories, cat] }));
                                    setCategorySearch('');
                                    setCategoryHighlightIndex(0);
                                    setTimeout(() => categoryInputRef.current?.focus(), 0);
                                  }}
                                  onMouseEnter={() => setCategoryHighlightIndex(index)}
                                  className={`w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white transition-colors ${
                                    categoryHighlightIndex === index
                                      ? 'bg-blue-100 dark:bg-blue-900/30'
                                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-500">
                                {categorySearch ? 'No categories found' : 'All categories selected'}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                          Categories will be applied when this macro is used.
                        </p>
                      </div>

                      {/* Scorecard Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-gray-600 dark:text-neutral-400">
                            Scorecard Values (optional)
                          </Label>
                          {/* Scorecard Position Selector */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                value={selectedScorecardPosition}
                                onChange={(e) => setSelectedScorecardPosition(e.target.value)}
                                className="appearance-none pl-2 pr-6 py-1 text-xs border border-gray-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {SCORECARD_POSITIONS.map(pos => (
                                  <option key={pos} value={pos}>
                                    {pos}
                                    {positionHasValues(pos) ? ' *' : ''}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Show variant-specific editors for positions with multiple variants */}
                        {currentScorecardConfig?.variants && currentScorecardConfig.variants.length > 1 ? (
                          <div className="space-y-3">
                            {currentScorecardConfig.variants.map(variant => (
                              <div key={variant.key} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-neutral-800/50">
                                <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200 dark:border-neutral-700">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {variant.label}
                                  </span>
                                  {sourceScorecardForCopy && (
                                    <button
                                      type="button"
                                      onClick={() => copyFromScorecard(sourceScorecardForCopy)}
                                      className="flex items-center gap-1 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy from {sourceScorecardForCopy.replace(' Scorecard', '')}
                                    </button>
                                  )}
                                </div>
                                <ScorecardEditor
                                  agentPosition={selectedScorecardPosition}
                                  variant={variant.key}
                                  onVariantChange={() => {}}
                                  values={getValuesForVariant(selectedScorecardPosition, variant.key)}
                                  onChange={(values) => updateScorecardValues(selectedScorecardPosition, variant.key, values)}
                                  hideVariantSelector={true}
                                  disabled={false}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-neutral-800/50">
                            {sourceScorecardForCopy && (
                              <div className="flex items-center justify-end mb-2 pb-1 border-b border-gray-200 dark:border-neutral-700">
                                <button
                                  type="button"
                                  onClick={() => copyFromScorecard(sourceScorecardForCopy)}
                                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy from {sourceScorecardForCopy.replace(' Scorecard', '')}
                                </button>
                              </div>
                            )}
                            <ScorecardEditor
                              agentPosition={selectedScorecardPosition}
                              variant="use_this_one"
                              onVariantChange={() => {}}
                              values={getValuesForVariant(selectedScorecardPosition, 'use_this_one')}
                              onChange={(values) => updateScorecardValues(selectedScorecardPosition, 'use_this_one', values)}
                              hideVariantSelector={true}
                              disabled={false}
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                          {currentScorecardConfig?.variants && currentScorecardConfig.variants.length > 1
                            ? 'Set values for each scorecard type. Positions with values are marked with *.'
                            : 'Set scorecard values. Positions with values are marked with *.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                  <div className="flex items-center justify-between">
                    <div>
                      {selectedMacro && !isCreating && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isCreating) {
                            setIsCreating(false);
                            setFormData({ title: '', feedback: '', categories: [], scorecardData: {} });
                          } else {
                            setSelectedMacro(null);
                          }
                        }}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : isCreating ? 'Create Macro' : 'Save Changes'}
                      </button>
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

export default ManageMacrosModal;
