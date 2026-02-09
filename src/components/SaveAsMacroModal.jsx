import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { X, Hash, Save, ChevronDown, Copy, Globe, Users } from 'lucide-react';
import TicketRichTextEditor from './TicketRichTextEditor';
import ScorecardEditor from './ScorecardEditor';
import { useMacros } from '../hooks/useMacros';
import { staggerContainer, staggerItem } from '../utils/animations';
import { getScorecardConfig, getScorecardCategories, hasScorecard, requiresVariantSelection } from '../data/scorecardConfig';

const SCORECARD_POSITIONS = ['Junior Scorecard', 'Medior Scorecard', 'Senior Scorecard'];

const SaveAsMacroModal = ({
  open,
  onOpenChange,
  initialFeedback = '',
  initialCategories = [],
  initialScorecardData = {},
  agentPosition = null,
  onSave
}) => {
  const { createMacro, fetchQAGraders } = useMacros();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    goodFeedback: '',
    badFeedback: '',
    categories: [],
    goodScorecardData: {},
    badScorecardData: {},
    isPublic: false,
    sharedWith: []
  });

  // Track which feedback version is being edited (good or bad)
  const [editingVersion, setEditingVersion] = useState('good');

  // QA Graders for sharing
  const [qaGraders, setQaGraders] = useState([]);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [shareHighlightIndex, setShareHighlightIndex] = useState(0);
  const shareDropdownRef = useRef(null);
  const shareInputRef = useRef(null);
  const shareListRef = useRef(null);

  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);
  const categoryDropdownRef = useRef(null);
  const categoryInputRef = useRef(null);
  const categoryListRef = useRef(null);

  // Scorecard position selector
  const [selectedScorecardPosition, setSelectedScorecardPosition] = useState(
    agentPosition && hasScorecard(agentPosition) ? agentPosition : 'Junior Scorecard'
  );

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

  // Get scorecard config for selected position
  const scorecardConfig = getScorecardConfig(selectedScorecardPosition);
  const hasMultipleVariants = scorecardConfig?.variants && scorecardConfig.variants.length > 1;
  const variants = hasMultipleVariants
    ? scorecardConfig.variants
    : [{ key: scorecardConfig?.defaultVariant || 'use_this_one', label: selectedScorecardPosition }];

  // Fetch QA graders on open
  useEffect(() => {
    if (open) {
      fetchQAGraders().then(graders => setQaGraders(graders || []));
    }
  }, [open, fetchQAGraders]);

  // Reset form when opened with new data
  useEffect(() => {
    if (open) {
      const position = agentPosition && hasScorecard(agentPosition) ? agentPosition : 'Junior Scorecard';
      setSelectedScorecardPosition(position);
      // Initial data goes to the "good" version
      setFormData({
        title: '',
        goodFeedback: initialFeedback || '',
        badFeedback: '',
        categories: initialCategories || [],
        goodScorecardData: convertInitialScorecardData(initialScorecardData) || {},
        badScorecardData: {},
        isPublic: false,
        sharedWith: []
      });
      setEditingVersion('good');
      setCategorySearch('');
      setShowCategoryDropdown(false);
      setShareSearch('');
      setShowShareDropdown(false);
    }
  }, [open, initialFeedback, initialCategories, initialScorecardData, agentPosition]);

  // Convert old format { values: {}, variant: '' } to new format { variantKey: values }
  const convertInitialScorecardData = (data) => {
    if (!data) return {};

    const converted = {};
    Object.keys(data).forEach(position => {
      const positionData = data[position];

      // Check if it's old format (has 'values' key)
      if (positionData && positionData.values !== undefined) {
        const variant = positionData.variant || 'use_this_one';
        converted[position] = {
          [variant]: positionData.values
        };
      } else {
        // Already new format
        converted[position] = positionData;
      }
    });
    return converted;
  };

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

  // Share dropdown - filter graders
  const filteredGraders = qaGraders.filter(grader =>
    grader.name.toLowerCase().includes(shareSearch.toLowerCase()) &&
    !formData.sharedWith.includes(grader._id)
  );

  // Reset share highlight when search changes
  useEffect(() => {
    setShareHighlightIndex(0);
  }, [shareSearch]);

  // Scroll share highlighted item into view
  useEffect(() => {
    if (showShareDropdown && shareListRef.current) {
      const highlighted = shareListRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [shareHighlightIndex, showShareDropdown]);

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
        setShowShareDropdown(false);
        setShareSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShareKeyDown = (e) => {
    if (!showShareDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowShareDropdown(true);
      }
      return;
    }

    const totalItems = filteredGraders.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShareHighlightIndex(prev => (prev + 1) % Math.max(totalItems, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setShareHighlightIndex(prev => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredGraders[shareHighlightIndex]) {
          const selected = filteredGraders[shareHighlightIndex];
          setFormData(prev => ({ ...prev, sharedWith: [...prev.sharedWith, selected._id] }));
          setShareSearch('');
          setShareHighlightIndex(0);
          setTimeout(() => shareInputRef.current?.focus(), 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowShareDropdown(false);
        setShareSearch('');
        break;
      case 'Backspace':
        if (shareSearch === '' && formData.sharedWith.length > 0) {
          setFormData(prev => ({ ...prev, sharedWith: prev.sharedWith.slice(0, -1) }));
        }
        break;
      default:
        break;
    }
  };

  // Helper to get grader name by ID
  const getGraderName = (graderId) => {
    const grader = qaGraders.find(g => g._id === graderId);
    return grader?.name || 'Unknown';
  };

  // Get the current scorecard data based on editing version (good/bad)
  const currentScorecardData = editingVersion === 'good' ? formData.goodScorecardData : formData.badScorecardData;
  const scorecardDataKey = editingVersion === 'good' ? 'goodScorecardData' : 'badScorecardData';

  // Get values for a specific position and variant
  const getValuesForVariant = (position, variantKey) => {
    return currentScorecardData[position]?.[variantKey] || {};
  };

  // Update scorecard values for a specific position and variant
  const updateScorecardValues = (position, variantKey, values) => {
    setFormData(prev => ({
      ...prev,
      [scorecardDataKey]: {
        ...prev[scorecardDataKey],
        [position]: {
          ...prev[scorecardDataKey][position],
          [variantKey]: values
        }
      }
    }));
  };

  // Check if a position has any scorecard values (for current editing version)
  const positionHasValues = (position) => {
    const data = currentScorecardData[position];
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

  // Copy matching values from another scorecard position
  const copyFromScorecard = (sourcePosition) => {
    const sourceData = currentScorecardData[sourcePosition];
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
      [scorecardDataKey]: {
        ...prev[scorecardDataKey],
        [selectedScorecardPosition]: newPositionData
      }
    }));

    toast.success(`Copied values from ${sourcePosition}`);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.goodFeedback.trim()) {
      toast.error('Good feedback content is required');
      return;
    }
    if (!formData.badFeedback.trim()) {
      toast.error('Bad feedback content is required');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createMacro({
        title: formData.title,
        goodFeedback: formData.goodFeedback,
        badFeedback: formData.badFeedback,
        categories: formData.categories,
        goodScorecardData: formData.goodScorecardData,
        badScorecardData: formData.badScorecardData,
        isPublic: formData.isPublic,
        sharedWith: formData.sharedWith
      });
      if (result.success) {
        toast.success('Macro saved successfully');
        if (onSave) {
          onSave(result.data);
        }
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton overlayClassName="z-[70]" className="bg-white dark:bg-neutral-900 !max-w-[75vw] !w-[75vw] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden z-[70]">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Save as Macro
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Title & Feedback */}
          <motion.div
            className="w-1/2 overflow-y-auto p-4 space-y-4 border-r border-gray-200 dark:border-neutral-800"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Title */}
            <motion.div variants={staggerItem}>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
                Macro Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., ontario-ip-issue"
                className="bg-white dark:bg-neutral-800"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                Use a descriptive, searchable name for this macro.
              </p>
            </motion.div>

            {/* Feedback Content with Good/Bad Selector */}
            <motion.div variants={staggerItem} className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-gray-600 dark:text-neutral-400">
                  Feedback Content <span className="text-red-500">*</span>
                </Label>
                {/* Good/Bad Version Selector */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setEditingVersion('good')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      editingVersion === 'good'
                        ? 'bg-green-500 text-white'
                        : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVersion('bad')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      editingVersion === 'bad'
                        ? 'bg-red-500 text-white'
                        : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    Bad
                  </button>
                </div>
              </div>
              <div className={`rounded-lg ${editingVersion === 'good' ? 'ring-2 ring-green-200 dark:ring-green-800' : 'ring-2 ring-red-200 dark:ring-red-800'}`}>
                <TicketRichTextEditor
                  value={editingVersion === 'good' ? formData.goodFeedback : formData.badFeedback}
                  onChange={(html) => setFormData(prev => ({
                    ...prev,
                    [editingVersion === 'good' ? 'goodFeedback' : 'badFeedback']: html
                  }))}
                  placeholder={`Enter the ${editingVersion === 'good' ? 'GOOD' : 'BAD'} feedback template content...`}
                  rows={10}
                  className="min-h-[200px] max-h-[45vh] overflow-y-auto"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                {editingVersion === 'good'
                  ? 'This feedback will be used when the ticket is marked as GOOD.'
                  : 'This feedback will be used when the ticket is marked as BAD.'}
              </p>
            </motion.div>
          </motion.div>

          {/* Right Column - Categories & Scorecard */}
          <motion.div
            className="w-1/2 overflow-y-auto p-4 space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Categories */}
            <motion.div variants={staggerItem} ref={categoryDropdownRef} className="relative">
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
            </motion.div>

            {/* Visibility Section - Public & Share */}
            <motion.div variants={staggerItem} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-neutral-800/50">
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-2 block">
                Visibility (optional)
              </Label>

              {/* Public Checkbox */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
                    formData.isPublic
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Public</span>
                </button>
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  {formData.isPublic ? 'Visible to all QA graders' : 'Only you can see this macro'}
                </span>
              </div>

              {/* Share with Dropdown */}
              <div ref={shareDropdownRef} className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" />
                  <span className="text-xs text-gray-600 dark:text-neutral-400">Share with</span>
                </div>
                <div
                  className={`flex flex-wrap items-center gap-1 px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-neutral-800 cursor-text min-h-[38px] border border-gray-200 dark:border-neutral-700 ${showShareDropdown ? 'ring-2 ring-gray-900 dark:ring-gray-300' : ''}`}
                  onClick={() => shareInputRef.current?.focus()}
                >
                  {formData.sharedWith.map(userId => (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full"
                    >
                      {getGraderName(userId)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, sharedWith: prev.sharedWith.filter(id => id !== userId) }));
                        }}
                        className="hover:text-green-900 dark:hover:text-green-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={shareInputRef}
                    type="text"
                    value={shareSearch}
                    onChange={(e) => {
                      setShareSearch(e.target.value);
                      setShowShareDropdown(true);
                    }}
                    onFocus={() => setShowShareDropdown(true)}
                    onKeyDown={handleShareKeyDown}
                    placeholder={formData.sharedWith.length === 0 ? "Search QA graders..." : ""}
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                  />
                </div>
                {showShareDropdown && (
                  <div
                    ref={shareListRef}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-32 overflow-y-auto"
                  >
                    {filteredGraders.length > 0 ? (
                      filteredGraders.map((grader, index) => (
                        <button
                          key={grader._id}
                          type="button"
                          data-highlighted={shareHighlightIndex === index}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, sharedWith: [...prev.sharedWith, grader._id] }));
                            setShareSearch('');
                            setShareHighlightIndex(0);
                            setTimeout(() => shareInputRef.current?.focus(), 0);
                          }}
                          onMouseEnter={() => setShareHighlightIndex(index)}
                          className={`w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white transition-colors ${
                            shareHighlightIndex === index
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {grader.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-500">
                        {shareSearch ? 'No graders found' : qaGraders.length === 0 ? 'No graders available' : 'All graders selected'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Scorecard Section */}
            <motion.div variants={staggerItem}>
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

              {/* Render scorecard editors for each variant */}
              {hasMultipleVariants ? (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.key}
                      className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-neutral-800/50"
                    >
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200 dark:border-neutral-700">
                        <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">
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
                        disabled={false}
                        hideVariantSelector={true}
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
                    variant={variants[0]?.key || 'use_this_one'}
                    onVariantChange={() => {}}
                    values={getValuesForVariant(selectedScorecardPosition, variants[0]?.key || 'use_this_one')}
                    onChange={(values) => updateScorecardValues(selectedScorecardPosition, variants[0]?.key || 'use_this_one', values)}
                    disabled={false}
                    hideVariantSelector={true}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
                {hasMultipleVariants
                  ? 'Configure values for each scorecard variant. Both will be saved.'
                  : 'Set scorecard values that will be applied when this macro is used.'}
                {' '}Positions with values are marked with *.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Macro'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsMacroModal;
