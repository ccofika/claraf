import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Sparkles, X, Filter, Calendar, Tag,
  TrendingUp, Users, FileText, Target, UserCheck, ChevronDown
} from 'lucide-react';
import { Badge } from './ui/badge';

const QASearchBar = ({ currentFilters = {}, onFilterChange, agents = [], graders = [], isArchive = false }) => {
  const [searchMode, setSearchMode] = useState('text'); // 'ai' or 'text' - default is now 'text'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const searchInputRef = useRef(null);
  const agentDropdownRef = useRef(null);
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
      priority: '',
      tags: '',
      grader: '',
      searchMode: 'text'
    });
    setAgentSearchQuery('');
  };

  const getActiveFilterCount = () => {
    const filterKeys = ['agent', 'status', 'priority', 'tags', 'grader'];
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

  return (
    <div className="relative w-full">
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <div
            className="
              flex items-center gap-2 px-3 py-2
              rounded-lg
              bg-white dark:bg-neutral-900
              border-2 border-gray-200 dark:border-neutral-800
              transition-all duration-200
              shadow-sm
            "
          >
            {/* Search Icon */}
            {searchMode === 'ai' ? (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <Search className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            )}

            {/* Search Input */}
            <input
              ref={searchInputRef}
              type="text"
              value={currentFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`${searchMode === 'ai' ? 'AI-powered semantic search' : 'Search tickets'}... (${searchMode === 'ai' ? 'Smart' : 'Text'})`}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 outline-none text-sm"
            />

            {/* Clear Button */}
            {currentFilters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-gray-300 dark:bg-neutral-700" />

            {/* AI / Text Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-md p-0.5">
              <button
                onClick={() => setSearchMode('ai')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  transition-all duration-200
                  ${searchMode === 'ai'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Sparkles className="w-3 h-3" />
                AI
              </button>
              <button
                onClick={() => setSearchMode('text')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  transition-all duration-200
                  ${searchMode === 'text'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Search className="w-3 h-3" />
                Text
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${showAdvancedFilters
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-800'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 dark:bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="mt-2 p-4 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Categories - Multi-select */}
            <div className="relative" ref={categoryDropdownRef}>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Categories
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white text-left flex items-center justify-between"
              >
                <span className={(!currentFilters.categories || currentFilters.categories.length === 0) ? 'text-gray-500 dark:text-neutral-500' : ''}>
                  {(!currentFilters.categories || currentFilters.categories.length === 0)
                    ? 'All categories'
                    : currentFilters.categories.length === 1
                      ? currentFilters.categories[0]
                      : `${currentFilters.categories.length} selected`}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('categories', []);
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                  >
                    Clear all
                  </button>
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
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer text-xs"
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
                        className="w-3 h-3 rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-900 dark:text-white truncate">{cat}</span>
                    </label>
                  ))}
                </div>
              )}
              {currentFilters.categories && currentFilters.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentFilters.categories.slice(0, 3).map(cat => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                    >
                      {cat.length > 15 ? cat.substring(0, 15) + '...' : cat}
                      <button
                        type="button"
                        onClick={() => handleFilterChange('categories', currentFilters.categories.filter(c => c !== cat))}
                        className="hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {currentFilters.categories.length > 3 && (
                    <span className="text-[10px] text-gray-500 dark:text-neutral-500">
                      +{currentFilters.categories.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Agent - Searchable Dropdown */}
            <div className="relative" ref={agentDropdownRef}>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Users className="w-3 h-3 inline mr-1" />
                Agent
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={agentSearchQuery}
                  onChange={(e) => {
                    setAgentSearchQuery(e.target.value);
                    setShowAgentDropdown(true);
                  }}
                  onFocus={() => setShowAgentDropdown(true)}
                  placeholder="Search agents..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
                />
                {showAgentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                    <button
                      onClick={() => {
                        handleFilterChange('agent', '');
                        setAgentSearchQuery('');
                        setShowAgentDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-900 dark:text-white"
                    >
                      All agents
                    </button>
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map(agent => (
                        <button
                          key={agent._id}
                          onClick={() => {
                            handleFilterChange('agent', agent._id);
                            setAgentSearchQuery(agent.name);
                            setShowAgentDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-900 dark:text-white"
                        >
                          {agent.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-500 dark:text-neutral-500">
                        No agents found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Priority
              </label>
              <select
                value={currentFilters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              >
                <option value="">All priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <FileText className="w-3 h-3 inline mr-1" />
                Status
              </label>
              <select
                value={currentFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              >
                <option value="">All statuses</option>
                <option value="Selected">Selected</option>
                <option value="Graded">Graded</option>
              </select>
            </div>

            {/* Grader - Only shown in Archive tab for admins */}
            {isArchive && graders.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  <UserCheck className="w-3 h-3 inline mr-1" />
                  Grader
                </label>
                <select
                  value={currentFilters.grader || ''}
                  onChange={(e) => handleFilterChange('grader', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
                >
                  <option value="">All graders</option>
                  {graders.map(grader => (
                    <option key={grader._id} value={grader._id}>
                      {grader.name || grader.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Score Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
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
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
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
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date From
              </label>
              <input
                type="date"
                value={currentFilters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date To
              </label>
              <input
                type="date"
                value={currentFilters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QASearchBar;
