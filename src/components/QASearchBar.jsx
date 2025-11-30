import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Sparkles, X, Filter, Calendar, Tag,
  TrendingUp, Users, FileText, Target, UserCheck
} from 'lucide-react';
import { Badge } from './ui/badge';

const QASearchBar = ({ currentFilters = {}, onFilterChange, agents = [], graders = [], isArchive = false }) => {
  const [searchMode, setSearchMode] = useState('text'); // 'ai' or 'text' - default is now 'text'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  const searchInputRef = useRef(null);

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
      category: '',
      priority: '',
      tags: '',
      grader: '',
      searchMode: 'text'
    });
    setAgentSearchQuery('');
  };

  const getActiveFilterCount = () => {
    const filterKeys = ['agent', 'status', 'category', 'priority', 'tags', 'grader'];
    let count = 0;

    filterKeys.forEach(key => {
      if (currentFilters[key] && currentFilters[key] !== '') {
        count++;
      }
    });

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
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Category
              </label>
              <select
                value={currentFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              >
                <option value="">All categories</option>
                <option value="Account closure">Account closure</option>
                <option value="ACP usage">ACP usage</option>
                <option value="Account recovery">Account recovery</option>
                <option value="Affiliate program">Affiliate program</option>
                <option value="Available bonuses">Available bonuses</option>
                <option value="Balance issues">Balance issues</option>
                <option value="Bet | Bet archive">Bet | Bet archive</option>
                <option value="Birthday bonus">Birthday bonus</option>
                <option value="Break in play">Break in play</option>
                <option value="Bonus crediting">Bonus crediting</option>
                <option value="Bonus drops">Bonus drops</option>
                <option value="Casino">Casino</option>
                <option value="Coin mixing | AML">Coin mixing | AML</option>
                <option value="Compliance (KYC, Terms of service, Privacy)">Compliance (KYC, ToS, Privacy)</option>
                <option value="Crypto - General">Crypto - General</option>
                <option value="Crypto deposits">Crypto deposits</option>
                <option value="Crypto withdrawals">Crypto withdrawals</option>
                <option value="Data Deletion">Data Deletion</option>
                <option value="Deposit bonus">Deposit bonus</option>
                <option value="Exclusion | General">Exclusion | General</option>
                <option value="Exclusion | Self exclusion">Exclusion | Self exclusion</option>
                <option value="Exclusion | Casino exclusion">Exclusion | Casino exclusion</option>
                <option value="Fiat General">Fiat General</option>
                <option value="Fiat - CAD">Fiat - CAD</option>
                <option value="Fiat - BRL">Fiat - BRL</option>
                <option value="Fiat - JPY">Fiat - JPY</option>
                <option value="Fiat - PEN/ARS/CLP">Fiat - PEN/ARS/CLP</option>
                <option value="Fiat - INR">Fiat - INR</option>
                <option value="Fiat - NGN/VND/IDR">Fiat - NGN/VND/IDR</option>
                <option value="Forum">Forum</option>
                <option value="Funds recovery">Funds recovery</option>
                <option value="Games issues">Games issues</option>
                <option value="Games | Providers | Rules">Games | Providers | Rules</option>
                <option value="Games | Live games">Games | Live games</option>
                <option value="Hacked accounts">Hacked accounts</option>
                <option value="In-game chat | Third party chat">In-game chat | Third party chat</option>
                <option value="Monthly bonus">Monthly bonus</option>
                <option value="No luck tickets | RTP">No luck tickets | RTP</option>
                <option value="Phishing | Scam attempt">Phishing | Scam attempt</option>
                <option value="Phone removal">Phone removal</option>
                <option value="Pre/Post monthly bonus">Pre/Post monthly bonus</option>
                <option value="Promotions">Promotions</option>
                <option value="Provably fair">Provably fair</option>
                <option value="Race">Race</option>
                <option value="Rakeback">Rakeback</option>
                <option value="Reload">Reload</option>
                <option value="Responsible gambling">Responsible gambling</option>
                <option value="Roles">Roles</option>
                <option value="Rollover">Rollover</option>
                <option value="Security (2FA, Password, Email codes)">Security (2FA, Password, Email)</option>
                <option value="Sportsbook">Sportsbook</option>
                <option value="Stake basics">Stake basics</option>
                <option value="Stake originals">Stake originals</option>
                <option value="Tech issues | Jira cases | Bugs">Tech issues | Jira | Bugs</option>
                <option value="Tip Recovery">Tip Recovery</option>
                <option value="VIP host">VIP host</option>
                <option value="VIP program">VIP program</option>
                <option value="Welcome bonus">Welcome bonus</option>
                <option value="Weekly bonus">Weekly bonus</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Agent - Searchable Dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Users className="w-3 h-3 inline mr-1" />
                Agent
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  onFocus={() => setAgentSearchQuery(agentSearchQuery)}
                  placeholder="Search agents..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
                />
                {agentSearchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                    <button
                      onClick={() => {
                        handleFilterChange('agent', '');
                        setAgentSearchQuery('');
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
