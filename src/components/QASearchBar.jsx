import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, Filter, Calendar, Tag,
  Users, FileText, Target, UserCheck, ChevronDown
} from 'lucide-react';
import { Badge } from './ui/badge';
import { DatePicker } from './ui/date-picker';
import {
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

  // Category search state
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);

  // Grader search state
  const [graderSearchQuery, setGraderSearchQuery] = useState('');
  const [showGraderDropdown, setShowGraderDropdown] = useState(false);
  const [graderHighlightIndex, setGraderHighlightIndex] = useState(0);

  const searchInputRef = useRef(null);
  const agentDropdownRef = useRef(null);
  const agentInputRef = useRef(null);
  const agentListRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const categoryInputRef = useRef(null);
  const categoryListRef = useRef(null);
  const graderDropdownRef = useRef(null);
  const graderInputRef = useRef(null);
  const graderListRef = useRef(null);

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

  // Sync grader search query with currentFilters
  useEffect(() => {
    if (currentFilters.grader) {
      const selectedGrader = graders.find(g => g._id === currentFilters.grader);
      if (selectedGrader) {
        setGraderSearchQuery(selectedGrader.name || selectedGrader.email);
      }
    } else {
      setGraderSearchQuery('');
    }
  }, [currentFilters.grader, graders]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setShowAgentDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
      if (graderDropdownRef.current && !graderDropdownRef.current.contains(event.target)) {
        setShowGraderDropdown(false);
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
    setCategorySearch('');
    setGraderSearchQuery('');
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

  // Filtered graders based on search
  const filteredGraders = graders.filter(grader => {
    const name = grader.name || grader.email || '';
    return name.toLowerCase().includes(graderSearchQuery.toLowerCase());
  });

  // All categories list
  const allCategories = [
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

  // Filtered categories based on search (excluding already selected)
  const filteredCategories = allCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
    !(currentFilters.categories || []).includes(cat)
  );

  // Reset category highlight index when search changes
  useEffect(() => {
    setCategoryHighlightIndex(0);
  }, [categorySearch]);

  // Scroll category highlighted item into view
  useEffect(() => {
    if (showCategoryDropdown && categoryListRef.current) {
      const highlightedElement = categoryListRef.current.querySelector('[data-highlighted="true"]');
      if (highlightedElement) {
        const container = categoryListRef.current;
        const elementTop = highlightedElement.offsetTop;
        const elementBottom = elementTop + highlightedElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elementTop < containerTop) {
          container.scrollTop = elementTop;
        } else if (elementBottom > containerBottom) {
          container.scrollTop = elementBottom - container.clientHeight;
        }
      }
    }
  }, [categoryHighlightIndex, showCategoryDropdown]);

  // Keyboard handler for category dropdown
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
          handleFilterChange('categories', [...(currentFilters.categories || []), selected]);
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
        if (categorySearch === '' && (currentFilters.categories || []).length > 0) {
          const newCategories = [...(currentFilters.categories || [])];
          newCategories.pop();
          handleFilterChange('categories', newCategories);
        }
        break;
      default:
        break;
    }
  };

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

  // Scroll highlighted item into view (agent)
  useEffect(() => {
    if (showAgentDropdown && agentListRef.current) {
      const highlightedElement = agentListRef.current.querySelector('[data-highlighted="true"]');
      if (highlightedElement) {
        const container = agentListRef.current;
        const elementTop = highlightedElement.offsetTop;
        const elementBottom = elementTop + highlightedElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elementTop < containerTop) {
          container.scrollTop = elementTop;
        } else if (elementBottom > containerBottom) {
          container.scrollTop = elementBottom - container.clientHeight;
        }
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

  // Reset grader highlight index when search query changes
  useEffect(() => {
    if (showGraderDropdown) {
      setGraderHighlightIndex(0);
    }
  }, [graderSearchQuery]);

  // Set initial highlight when grader dropdown opens
  useEffect(() => {
    if (showGraderDropdown) {
      setGraderHighlightIndex(0);
    }
  }, [showGraderDropdown]);

  // Scroll grader highlighted item into view
  useEffect(() => {
    if (showGraderDropdown && graderListRef.current) {
      const highlightedElement = graderListRef.current.querySelector('[data-highlighted="true"]');
      if (highlightedElement) {
        const container = graderListRef.current;
        const elementTop = highlightedElement.offsetTop;
        const elementBottom = elementTop + highlightedElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elementTop < containerTop) {
          container.scrollTop = elementTop;
        } else if (elementBottom > containerBottom) {
          container.scrollTop = elementBottom - container.clientHeight;
        }
      }
    }
  }, [graderHighlightIndex, showGraderDropdown]);

  // Keyboard handler for grader dropdown navigation
  const handleGraderKeyDown = (e) => {
    if (!showGraderDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowGraderDropdown(true);
        setGraderHighlightIndex(0);
      }
      return;
    }

    const totalItems = filteredGraders.length + 1; // +1 for "All graders" option

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setGraderHighlightIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setGraderHighlightIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (graderHighlightIndex === 0) {
          // "All graders" selected
          handleFilterChange('grader', '');
          setGraderSearchQuery('');
        } else if (graderHighlightIndex > 0 && graderHighlightIndex <= filteredGraders.length) {
          const selectedGrader = filteredGraders[graderHighlightIndex - 1];
          if (selectedGrader) {
            handleFilterChange('grader', selectedGrader._id);
            setGraderSearchQuery(selectedGrader.name || selectedGrader.email);
          }
        }
        setShowGraderDropdown(false);
        break;
      case 'Escape':
        e.preventDefault();
        setShowGraderDropdown(false);
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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="mt-2 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Advanced Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {/* Categories - Tag-based searchable dropdown */}
            <div className="relative" ref={categoryDropdownRef}>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Categories
              </label>
              <div
                className={`flex flex-wrap items-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-950 cursor-text min-h-[32px] border border-neutral-200 dark:border-neutral-700 ${showCategoryDropdown ? 'ring-2 ring-neutral-900 dark:ring-neutral-300' : ''}`}
                onClick={() => categoryInputRef.current?.focus()}
              >
                {(currentFilters.categories || []).map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                  >
                    {cat.length > 12 ? cat.substring(0, 12) + '...' : cat}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange('categories', (currentFilters.categories || []).filter(c => c !== cat));
                      }}
                      className="hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      <X className="w-2.5 h-2.5" />
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
                  placeholder={(currentFilters.categories || []).length === 0 ? "Search categories..." : ""}
                  className="flex-1 min-w-[80px] bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-xs"
                />
              </div>
              <AnimatePresence>
              {showCategoryDropdown && (
                <motion.div
                  ref={categoryListRef}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: duration.fast }}
                  className="absolute z-[100] w-full mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat, index) => (
                      <button
                        key={cat}
                        type="button"
                        data-highlighted={categoryHighlightIndex === index}
                        onClick={() => {
                          handleFilterChange('categories', [...(currentFilters.categories || []), cat]);
                          setCategorySearch('');
                          setCategoryHighlightIndex(0);
                          setTimeout(() => categoryInputRef.current?.focus(), 0);
                        }}
                        onMouseEnter={() => setCategoryHighlightIndex(index)}
                        className={`w-full px-3 py-2 text-left text-xs text-neutral-900 dark:text-white transition-colors ${
                          categoryHighlightIndex === index
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-500">
                      {categorySearch ? 'No categories found' : 'All categories selected'}
                    </div>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Agent - Searchable Dropdown */}
            <div className="relative" ref={agentDropdownRef}>
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
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[100]"
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
            </div>

            {/* Status */}
            <div>
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
            </div>

            {/* Grader - Searchable Dropdown */}
            {graders.length > 0 && (
              <div className="relative" ref={graderDropdownRef}>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  <UserCheck className="w-3 h-3 inline mr-1" />
                  Grader
                </label>
                <div className="relative">
                  <input
                    ref={graderInputRef}
                    type="text"
                    value={graderSearchQuery}
                    onChange={(e) => {
                      setGraderSearchQuery(e.target.value);
                      setShowGraderDropdown(true);
                    }}
                    onFocus={() => setShowGraderDropdown(true)}
                    onKeyDown={handleGraderKeyDown}
                    placeholder="Search graders..."
                    className="w-full px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                  />
                  <AnimatePresence>
                  {showGraderDropdown && (
                    <motion.div
                      ref={graderListRef}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: duration.fast }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[100]"
                    >
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        data-highlighted={graderHighlightIndex === 0}
                        onClick={() => {
                          handleFilterChange('grader', '');
                          setGraderSearchQuery('');
                          setShowGraderDropdown(false);
                        }}
                        onMouseEnter={() => setGraderHighlightIndex(0)}
                        className={`w-full px-3 py-2 text-left text-xs text-neutral-900 dark:text-white transition-colors ${
                          graderHighlightIndex === 0
                            ? 'bg-neutral-200 dark:bg-neutral-700'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        All graders
                      </motion.button>
                      {filteredGraders.length > 0 ? (
                        filteredGraders.map((grader, index) => (
                          <motion.button
                            key={grader._id}
                            whileTap={{ scale: 0.98 }}
                            data-highlighted={graderHighlightIndex === index + 1}
                            onClick={() => {
                              handleFilterChange('grader', grader._id);
                              setGraderSearchQuery(grader.name || grader.email);
                              setShowGraderDropdown(false);
                            }}
                            onMouseEnter={() => setGraderHighlightIndex(index + 1)}
                            className={`w-full px-3 py-2 text-left text-xs text-neutral-900 dark:text-white transition-colors ${
                              graderHighlightIndex === index + 1
                                ? 'bg-neutral-200 dark:bg-neutral-700'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {grader.name || grader.email}
                          </motion.button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-500">
                          No graders found
                        </div>
                      )}
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Score Range */}
            <div>
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
            </div>

            <div>
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
            </div>

            {/* Date Range - Full width row */}
            <div className="col-span-full">
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
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QASearchBar;
