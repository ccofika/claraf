import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Folder, FileText, Filter, Grid, List, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const AddContentModal = ({ isOpen, onClose, onSelectElement, onSelectTicket }) => {
  const [activeTab, setActiveTab] = useState('workspaces'); // 'workspaces' or 'tickets'
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [elements, setElements] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Filters
  const [elementTypeFilter, setElementTypeFilter] = useState('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recentlyModified'); // 'recentlyModified', 'recentlyCreated', 'alphabetical'
  const [showOnlyRecent, setShowOnlyRecent] = useState(false); // Show only items modified in last 7 days

  // For example elements - track current example index for each element
  const [exampleIndices, setExampleIndices] = useState({});

  // Fetch workspaces on mount
  useEffect(() => {
    if (isOpen && activeTab === 'workspaces') {
      fetchWorkspaces();
    }
  }, [isOpen, activeTab]);

  // Reset example indices and filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExampleIndices({});
      setShowOnlyRecent(false);
    }
  }, [isOpen]);

  // Fetch tickets on mount
  useEffect(() => {
    if (isOpen && activeTab === 'tickets') {
      fetchTickets();
    }
  }, [isOpen, activeTab]);

  // Fetch elements when workspace is selected
  useEffect(() => {
    if (selectedWorkspace) {
      fetchElements(selectedWorkspace._id);
    }
  }, [selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setSelectedWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchElements = async (workspaceId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/canvas/workspace/${workspaceId}/elements`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setElements(response.data);
    } catch (error) {
      console.error('Error fetching elements:', error);
      toast.error('Failed to load elements');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tickets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Helper function for getting element display title
  const getElementDisplayTitle = (element) => {
    if (element.type === 'example') {
      const currentIndex = exampleIndices[element._id] || 0;
      const currentExample = element.content?.examples?.[currentIndex];
      return currentExample?.title || 'Untitled Example';
    }
    return stripHtml(element.content?.value || element.content?.title || 'Untitled');
  };

  // Memoized filtered elements
  const filteredElements = React.useMemo(() => {
    let filtered = elements;

    // Filter out wrapper elements - they should not be shareable
    filtered = filtered.filter(el => el.type !== 'wrapper');

    // Filter by type
    if (elementTypeFilter !== 'all') {
      filtered = filtered.filter(el => el.type === elementTypeFilter);
    }

    // Filter by recently modified (last 7 days)
    if (showOnlyRecent) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(el => {
        const updatedAt = new Date(el.updatedAt);
        return updatedAt >= sevenDaysAgo;
      });
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(el => {
        const searchLower = searchQuery.toLowerCase();
        return (
          el.content?.value?.toLowerCase().includes(searchLower) ||
          el.content?.title?.toLowerCase().includes(searchLower) ||
          el.content?.description?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort elements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recentlyModified':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'recentlyCreated':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'alphabetical':
          const aTitle = getElementDisplayTitle(a).toLowerCase();
          const bTitle = getElementDisplayTitle(b).toLowerCase();
          return aTitle.localeCompare(bTitle);
        default:
          return 0;
      }
    });

    return filtered;
  }, [elements, elementTypeFilter, showOnlyRecent, searchQuery, sortBy, exampleIndices]);

  // Memoized filtered tickets
  const filteredTickets = React.useMemo(() => {
    let filtered = tickets;

    // Filter by status
    if (ticketStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === ticketStatusFilter);
    }

    // Filter by priority
    if (ticketPriorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === ticketPriorityFilter);
    }

    // Filter by recently modified (last 7 days)
    if (showOnlyRecent) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(t => {
        const updatedAt = new Date(t.updatedAt);
        return updatedAt >= sevenDaysAgo;
      });
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t => {
        const searchLower = searchQuery.toLowerCase();
        return (
          t.title?.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort tickets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recentlyModified':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'recentlyCreated':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'alphabetical':
          return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
        default:
          return 0;
      }
    });

    return filtered;
  }, [tickets, ticketStatusFilter, ticketPriorityFilter, showOnlyRecent, searchQuery, sortBy]);

  // Get current example index for an element
  const getCurrentExampleIndex = (elementId) => {
    return exampleIndices[elementId] || 0;
  };

  // Navigate to previous example
  const handlePreviousExample = (e, element) => {
    e.stopPropagation();
    const currentIndex = getCurrentExampleIndex(element._id);
    const examples = element.content?.examples || [];
    if (examples.length > 0 && currentIndex > 0) {
      setExampleIndices(prev => ({
        ...prev,
        [element._id]: currentIndex - 1
      }));
    }
  };

  // Navigate to next example
  const handleNextExample = (e, element) => {
    e.stopPropagation();
    const currentIndex = getCurrentExampleIndex(element._id);
    const examples = element.content?.examples || [];
    if (examples.length > 0 && currentIndex < examples.length - 1) {
      setExampleIndices(prev => ({
        ...prev,
        [element._id]: currentIndex + 1
      }));
    }
  };

  // Get current example for an element
  const getCurrentExample = (element) => {
    if (element.type !== 'example' || !element.content?.examples?.length) {
      return null;
    }
    const currentIndex = getCurrentExampleIndex(element._id);
    return element.content.examples[currentIndex];
  };

  const handleElementSelect = (element) => {
    // For description elements, use a simple title instead of the full content
    let elementTitle = 'Untitled';
    let selectedExample = null;
    let exampleIndex = null;

    if (element.type === 'description') {
      elementTitle = 'Description';
    } else if (element.type === 'macro') {
      elementTitle = element.content?.title || 'Macro';
    } else if (element.type === 'example') {
      // Get the currently selected example and its index
      const currentExample = getCurrentExample(element);
      const currentIndex = getCurrentExampleIndex(element._id);
      selectedExample = currentExample;
      exampleIndex = currentIndex;
      elementTitle = currentExample?.title || 'Example';
    } else {
      elementTitle = element.content?.value || element.content?.title || 'Untitled';
    }

    onSelectElement({
      _id: element._id,
      workspaceId: selectedWorkspace._id,
      workspaceName: selectedWorkspace.name,
      type: element.type,
      title: elementTitle,
      content: element.content?.title || '', // For title/macro types
      description: element.type === 'description' ? element.content?.value || '' : '',
      macro: element.type === 'macro' ? element.content?.description || '' : '',
      example: selectedExample,
      exampleIndex: exampleIndex // Pass the index so we know which example was shared
    });
    onClose();
  };

  const handleTicketSelect = (ticket) => {
    onSelectTicket({
      _id: ticket._id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category
    });
    onClose();
  };

  const getElementIcon = (type) => {
    const icons = {
      title: '📌',
      description: '📝',
      macro: '🔧',
      example: '💬'
    };
    return icons[type] || '📄';
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-6xl h-[80vh] bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden flex flex-col rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <Plus className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
              Add Content to Message
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/60 dark:border-neutral-800/60 flex-shrink-0">
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-6 py-3 text-[14px] font-medium transition-colors relative ${
              activeTab === 'workspaces'
                ? 'text-[#1164A3] dark:text-[#1164A3]'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            <Folder className="w-4 h-4 inline-block mr-2" />
            Workspace Elements
            {activeTab === 'workspaces' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1164A3]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-3 text-[14px] font-medium transition-colors relative ${
              activeTab === 'tickets'
                ? 'text-[#1164A3] dark:text-[#1164A3]'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            QA Tickets
            {activeTab === 'tickets' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1164A3]" />
            )}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-neutral-800/60 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'workspaces' ? 'Search elements...' : 'Search tickets...'}
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 rounded-md text-[14px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3]"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 rounded-md p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3 mt-3">
            {activeTab === 'workspaces' ? (
              <>
                {/* Workspace Selector */}
                <select
                  value={selectedWorkspace?._id || ''}
                  onChange={(e) => {
                    const ws = workspaces.find(w => w._id === e.target.value);
                    setSelectedWorkspace(ws);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md text-[13px] text-gray-900 dark:text-neutral-50 focus:outline-none focus:border-[#1164A3]"
                >
                  {workspaces.map(ws => (
                    <option key={ws._id} value={ws._id}>{ws.name}</option>
                  ))}
                </select>

                {/* Element Type Filter */}
                <select
                  value={elementTypeFilter}
                  onChange={(e) => setElementTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md text-[13px] text-gray-900 dark:text-neutral-50 focus:outline-none focus:border-[#1164A3]"
                >
                  <option value="all">All Types</option>
                  <option value="title">Title</option>
                  <option value="description">Description</option>
                  <option value="macro">Macro</option>
                  <option value="example">Example</option>
                </select>
              </>
            ) : (
              <>
                {/* Ticket Status Filter */}
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md text-[13px] text-gray-900 dark:text-neutral-50 focus:outline-none focus:border-[#1164A3]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                {/* Ticket Priority Filter */}
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md text-[13px] text-gray-900 dark:text-neutral-50 focus:outline-none focus:border-[#1164A3]"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </>
            )}

            {/* Sort Dropdown - for both tabs */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md text-[13px] text-gray-900 dark:text-neutral-50 focus:outline-none focus:border-[#1164A3]"
            >
              <option value="recentlyModified">Recently Modified</option>
              <option value="recentlyCreated">Recently Created</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            {/* Show Only Recent Checkbox */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
              <input
                type="checkbox"
                checked={showOnlyRecent}
                onChange={(e) => setShowOnlyRecent(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-neutral-600 text-[#1164A3] focus:ring-[#1164A3] focus:ring-offset-0"
              />
              <span className="text-[13px] text-gray-900 dark:text-neutral-50 whitespace-nowrap">
                Last 7 days
              </span>
            </label>

            <div className="ml-auto text-[13px] text-gray-500 dark:text-neutral-500">
              {activeTab === 'workspaces'
                ? `${filteredElements.length} element${filteredElements.length !== 1 ? 's' : ''}`
                : `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''}`
              }
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#1164A3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-neutral-500">Loading...</p>
              </div>
            </div>
          ) : activeTab === 'workspaces' ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredElements.map(element => {
                  const isExample = element.type === 'example';
                  const examples = element.content?.examples || [];
                  const currentIndex = getCurrentExampleIndex(element._id);
                  const currentExample = getCurrentExample(element);
                  const hasMultipleExamples = examples.length > 1;

                  return (
                    <div key={element._id} className="relative">
                      <button
                        onClick={() => handleElementSelect(element)}
                        className="w-full p-4 bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-[#1164A3] dark:hover:border-[#1164A3] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{getElementIcon(element.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-gray-500 dark:text-neutral-500 uppercase mb-1">
                              {element.type}
                              {isExample && hasMultipleExamples && (
                                <span className="ml-2 text-[#1164A3]">
                                  {currentIndex + 1}/{examples.length}
                                </span>
                              )}
                            </div>
                            <div className="text-[14px] font-semibold text-gray-900 dark:text-neutral-50 mb-2 truncate">
                              {getElementDisplayTitle(element)}
                            </div>
                            {isExample && currentExample?.messages?.length > 0 && (
                              <div className="text-[12px] text-gray-500 dark:text-neutral-500 line-clamp-2">
                                {stripHtml(currentExample.messages[0].text)}
                              </div>
                            )}
                            {!isExample && (element.content?.description || element.content?.value) && (
                              <div className="text-[12px] text-gray-500 dark:text-neutral-500 line-clamp-2">
                                {stripHtml(element.content?.description || element.content?.value || '')}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Navigation arrows for example elements with multiple examples */}
                      {isExample && hasMultipleExamples && (
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            onClick={(e) => handlePreviousExample(e, element)}
                            disabled={currentIndex === 0}
                            className="p-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                            title="Previous example"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-neutral-300" />
                          </button>
                          <button
                            onClick={(e) => handleNextExample(e, element)}
                            disabled={currentIndex === examples.length - 1}
                            className="p-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                            title="Next example"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-700 dark:text-neutral-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredElements.map(element => {
                  const isExample = element.type === 'example';
                  const examples = element.content?.examples || [];
                  const currentIndex = getCurrentExampleIndex(element._id);
                  const hasMultipleExamples = examples.length > 1;

                  return (
                    <div key={element._id} className="relative">
                      <button
                        onClick={() => handleElementSelect(element)}
                        className="w-full p-3 bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-[#1164A3] dark:hover:border-[#1164A3] hover:shadow-sm transition-all text-left flex items-center gap-3"
                      >
                        <div className="text-xl">{getElementIcon(element.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-neutral-500 uppercase">
                              {element.type}
                            </span>
                            {isExample && hasMultipleExamples && (
                              <span className="text-[11px] font-semibold text-[#1164A3]">
                                {currentIndex + 1}/{examples.length}
                              </span>
                            )}
                          </div>
                          <div className="text-[14px] font-medium text-gray-900 dark:text-neutral-50 truncate">
                            {getElementDisplayTitle(element)}
                          </div>
                        </div>

                        {/* Navigation arrows for example elements with multiple examples */}
                        {isExample && hasMultipleExamples && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => handlePreviousExample(e, element)}
                              disabled={currentIndex === 0}
                              className="p-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Previous example"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-neutral-300" />
                            </button>
                            <button
                              onClick={(e) => handleNextExample(e, element)}
                              disabled={currentIndex === examples.length - 1}
                              className="p-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Next example"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-neutral-300" />
                            </button>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTickets.map(ticket => (
                  <button
                    key={ticket._id}
                    onClick={() => handleTicketSelect(ticket)}
                    className="p-4 bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-[#1164A3] dark:hover:border-[#1164A3] hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        ticket.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        ticket.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        ticket.status === 'open' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        ticket.status === 'in-progress' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        ticket.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-[14px] font-semibold text-gray-900 dark:text-neutral-50 mb-2 line-clamp-2">
                      {ticket.title}
                    </div>
                    {ticket.description && (
                      <div className="text-[12px] text-gray-500 dark:text-neutral-500 line-clamp-2">
                        {ticket.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTickets.map(ticket => (
                  <button
                    key={ticket._id}
                    onClick={() => handleTicketSelect(ticket)}
                    className="w-full p-3 bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-[#1164A3] dark:hover:border-[#1164A3] hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            ticket.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            ticket.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            ticket.status === 'open' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            ticket.status === 'in-progress' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                            ticket.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="text-[14px] font-medium text-gray-900 dark:text-neutral-50 truncate">
                          {ticket.title}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {/* Empty State */}
          {!loading && (
            (activeTab === 'workspaces' && filteredElements.length === 0) ||
            (activeTab === 'tickets' && filteredTickets.length === 0)
          ) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">{activeTab === 'workspaces' ? '📁' : '🎫'}</div>
                <p className="text-gray-500 dark:text-neutral-500 text-[14px]">
                  No {activeTab === 'workspaces' ? 'elements' : 'tickets'} found
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddContentModal;
