import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, Filter, Calendar, Tag,
  Users, FileText, Target, UserCheck, ChevronDown
} from 'lucide-react';
import { Badge } from './ui/badge';
import { DatePicker } from './ui/date-picker';
import {
  dropdownVariants,
  staggerContainer,
  staggerItem,
  duration,
  easing
} from '../utils/animations';

const QASearchBar = ({ currentFilters = {}, onFilterChange, agents = [], graders = [] }) => {
  const [searchMode, setSearchMode] = useState('text'); // 'ai' or 'text' - default is now 'text'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [agentHighlightIndex, setAgentHighlightIndex] = useState(-1); // -1 means "All agents" option

  const searchInputRef = useRef(null);
  const agentDropdownRef = useRef(null);
  const agentInputRef = useRef(null);
  const agentListRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  // Sync with currentFilters from parent
  useEffect(() => {
    // When parent filters change, update agent search query if needed
    if (currentFilters.agent) {
      const selectedAgent = agents.find(a => a._id === currentFilters.agent);
      if (selectedAgent) {
        setAgentSearchQuery(selectedAgent.name);
      }
    } else {
      setAgentSearchQuery('');
    }
  }, [currentFilters.agent, agents]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setShowAgentDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value) => {
    // Update parent filters immediately
    onFilterChange({
      ...currentFilters,
      search: value,
      searchMode // Pass search mode to parent so it knows whether to use AI or text search
    });
  };

  const handleFilterChange = (key, value) => {
    // Update parent filters
    onFilterChange({
      ...currentFilters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      agent: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      scoreMin: 0,
      scoreMax: 100,
      search: '',
      categories: [],
      tags: '',
      grader: '',
      searchMode: 'text'
    });
    setAgentSearchQuery('');
  };

  const getActiveFilterCount = () => {
    const filterKeys = ['agent', 'status', 'tags', 'grader'];
    let count = 0;

    filterKeys.forEach(key => {
      if (currentFilters[key] && currentFilters[key] !== '') {
        count++;
      }
    });

    // Count categories as one filter if any selected
    if (currentFilters.categories && currentFilters.categories.length > 0) {
      count++;
    }

    // Count date range as one filter if either is set
    if (currentFilters.dateFrom || currentFilters.dateTo) {
      count++;
    }

    // Count score range as one filter if different from defaults
    if ((currentFilters.scoreMin && currentFilters.scoreMin > 0) ||
        (currentFilters.scoreMax && currentFilters.scoreMax < 100)) {
      count++;
    }

    return count;
  };

  // Filtered agents based on search
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase())
  );

  // Reset highlight index when search query changes
  useEffect(() => {
    if (showAgentDropdown) {
      setAgentHighlightIndex(0); // Start at "All agents" when dropdown opens
    }
  }, [agentSearchQuery]);

  // Set initial highlight when dropdown opens
  useEffect(() => {
    if (showAgentDropdown) {
      setAgentHighlightIndex(0);
    }
  }, [showAgentDropdown]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (showAgentDropdown && agentListRef.current) {
      const highlightedElement = agentListRef.current.querySelector('[data-highlighted="true"]');
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [agentHighlightIndex, showAgentDropdown]);

  // Keyboard handler for agent dropdown navigation
  const handleAgentKeyDown = (e) => {
    if (!showAgentDropdown) {
      // Open dropdown on arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowAgentDropdown(true);
        setAgentHighlightIndex(0);
      }
      return;
    }

    const totalItems = filteredAgents.length + 1; // +1 for "All agents" option

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setAgentHighlightIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setAgentHighlightIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (agentHighlightIndex === 0) {
          // "All agents" selected
          handleFilterChange('agent', '');
          setAgentSearchQuery('');
        } else if (agentHighlightIndex > 0 && agentHighlightIndex <= filteredAgents.length) {
          // Agent selected (index is 1-based for agents since 0 is "All agents")
          const selectedAgent = filteredAgents[agentHighlightIndex - 1];
          if (selectedAgent) {
            handleFilterChange('agent', selectedAgent._id);
            setAgentSearchQuery(selectedAgent.name);
          }
        }
        setShowAgentDropdown(false);
        break;
      case 'Escape':
        e.preventDefault();
        setShowAgentDropdown(false);
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.normal, ease: easing.smooth }}
      className="relative w-full"
    >
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <motion.div
            whileFocus={{ scale: 1.01 }}
            className="
              flex items-center gap-2 px-3 py-2
              rounded-xl
              bg-white dark:bg-neutral-900
              border border-neutral-200 dark:border-neutral-800
              transition-all duration-200
              shadow-sm
            "
          >
            {/* Search Icon */}
            {searchMode === 'ai' ? (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <Search className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            )}

            {/* Search Input */}
            <input
              ref={searchInputRef}
              type="text"
              value={currentFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`${searchMode === 'ai' ? 'AI-powered semantic search' : 'Search tickets'}... (${searchMode === 'ai' ? 'Smart' : 'Text'})`}
              className="flex-1 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 outline-none text-sm"
            />

            {/* Clear Button */}
            {currentFilters.search && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSearchChange('')}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </motion.button>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700" />

            {/* AI / Text Toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchMode('ai')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  transition-all duration-200
                  ${searchMode === 'ai'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }
                `}
              >
                <Sparkles className="w-3 h-3" />
                AI
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchMode('text')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  transition-all duration-200
                  ${searchMode === 'text'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }
                `}
              >
                <Search className="w-3 h-3" />
                Text
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Advanced Filters Toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
            transition-all duration-200
            ${showAdvancedFilters
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
              : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          Filters
          {getActiveFilterCount() > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 dark:bg-purple-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {getActiveFilterCount()}
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
      {showAdvancedFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          className="mt-2 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Advanced Filters</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearAllFilters}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Clear all
            </motion.button>
          </div>

          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {/* Categories - Multi-select */}
            <motion.div variants={staggerItem} className="relative" ref={categoryDropdownRef}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Categories
              </label>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-left flex items-center justify-between"
              >
                <span className={(!currentFilters.categories || currentFilters.categories.length === 0) ? 'text-neutral-500 dark:text-neutral-500' : ''}>
                  {(!currentFilters.categories || currentFilters.categories.length === 0)
                    ? 'All categories'
                    : currentFilters.categories.length === 1
                      ? currentFilters.categories[0]
                      : `${currentFilters.categories.length} selected`}
                </span>
                <motion.span animate={{ rotate: showCategoryDropdown ? 180 : 0 }} transition={{ duration: duration.fast }}>
                  <ChevronDown className="w-3 h-3" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
              {showCategoryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: duration.fast }}
                  className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      handleFilterChange('categories', []);
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  >
                    Clear all
                  </motion.button>
                  {[
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
                  ].map(cat => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={(currentFilters.categories || []).includes(cat)}
                        onChange={(e) => {
                          const current = currentFilters.categories || [];
                          if (e.target.checked) {
                            handleFilterChange('categories', [...current, cat]);
                          } else {
                            handleFilterChange('categories', current.filter(c => c !== cat));
                          }
                        }}
                        className="w-3 h-3 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-neutral-900 dark:text-white truncate">{cat}</span>
                    </label>
                  ))}
                </motion.div>
              )}
              </AnimatePresence>
              {currentFilters.categories && currentFilters.categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-1 mt-1"
                >
                  {currentFilters.categories.slice(0, 3).map(cat => (
                    <motion.span
                      key={cat}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                    >
                      {cat.length > 15 ? cat.substring(0, 15) + '...' : cat}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        type="button"
                        onClick={() => handleFilterChange('categories', currentFilters.categories.filter(c => c !== cat))}
                        className="hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <X className="w-2.5 h-2.5" />
                      </motion.button>
                    </motion.span>
                  ))}
                  {currentFilters.categories.length > 3 && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-500">
                      +{currentFilters.categories.length - 3} more
                    </span>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Agent - Searchable Dropdown */}
            <motion.div variants={staggerItem} className="relative" ref={agentDropdownRef}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <Users className="w-3 h-3 inline mr-1" />
                Agent
              </label>
              <div className="relative">
                <input
                  ref={agentInputRef}
                  type="text"
                  value={agentSearchQuery}
                  onChange={(e) => {
                    setAgentSearchQuery(e.target.value);
                    setShowAgentDropdown(true);
                  }}
                  onFocus={() => setShowAgentDropdown(true)}
                  onKeyDown={handleAgentKeyDown}
                  placeholder="Search agents..."
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                />
                <AnimatePresence>
                {showAgentDropdown && (
                  <motion.div
                    ref={agentListRef}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: duration.fast }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
                  >
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      data-highlighted={agentHighlightIndex === 0}
                      onClick={() => {
                        handleFilterChange('agent', '');
                        setAgentSearchQuery('');
                        setShowAgentDropdown(false);
                      }}
                      onMouseEnter={() => setAgentHighlightIndex(0)}
                      className={`w-full px-3 py-2 text-left text-xs text-neutral-900 dark:text-white transition-colors ${
                        agentHighlightIndex === 0
                          ? 'bg-neutral-200 dark:bg-neutral-700'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      All agents
                    </motion.button>
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map((agent, index) => (
                        <motion.button
                          key={agent._id}
                          whileTap={{ scale: 0.98 }}
                          data-highlighted={agentHighlightIndex === index + 1}
                          onClick={() => {
                            handleFilterChange('agent', agent._id);
                            setAgentSearchQuery(agent.name);
                            setShowAgentDropdown(false);
                          }}
                          onMouseEnter={() => setAgentHighlightIndex(index + 1)}
                          className={`w-full px-3 py-2 text-left text-xs text-neutral-900 dark:text-white transition-colors ${
                            agentHighlightIndex === index + 1
                              ? 'bg-neutral-200 dark:bg-neutral-700'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {agent.name}
                        </motion.button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-500">
                        No agents found
                      </div>
                    )}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Status */}
            <motion.div variants={staggerItem}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <FileText className="w-3 h-3 inline mr-1" />
                Status
              </label>
              <select
                value={currentFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
              >
                <option value="">All statuses</option>
                <option value="Selected">Selected</option>
                <option value="Graded">Graded</option>
              </select>
            </motion.div>

            {/* Grader */}
            {graders.length > 0 && (
              <motion.div variants={staggerItem}>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  <UserCheck className="w-3 h-3 inline mr-1" />
                  Grader
                </label>
                <select
                  value={currentFilters.grader || ''}
                  onChange={(e) => handleFilterChange('grader', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                >
                  <option value="">All graders</option>
                  {graders.map(grader => (
                    <option key={grader._id} value={grader._id}>
                      {grader.name || grader.email}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* Score Range */}
            <motion.div variants={staggerItem}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <Target className="w-3 h-3 inline mr-1" />
                Min Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentFilters.scoreMin !== undefined && currentFilters.scoreMin !== 0 ? currentFilters.scoreMin : ''}
                onChange={(e) => handleFilterChange('scoreMin', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <Target className="w-3 h-3 inline mr-1" />
                Max Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={currentFilters.scoreMax !== undefined && currentFilters.scoreMax !== 100 ? currentFilters.scoreMax : ''}
                onChange={(e) => handleFilterChange('scoreMax', e.target.value)}
                placeholder="100"
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
              />
            </motion.div>

            {/* Date Range - Full width row */}
            <motion.div variants={staggerItem} className="col-span-full">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date From
                  </label>
                  <DatePicker
                    value={currentFilters.dateFrom || ''}
                    onChange={(date) => handleFilterChange('dateFrom', date)}
                    placeholder="Select start date"
                    size="sm"
                    className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date To
                  </label>
                  <DatePicker
                    value={currentFilters.dateTo || ''}
                    onChange={(date) => handleFilterChange('dateTo', date)}
                    placeholder="Select end date"
                    size="sm"
                    className="border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QASearchBar;
