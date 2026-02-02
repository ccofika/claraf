import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Archive, RotateCcw, Trash2, ExternalLink, Sparkles, X, ChevronDown, User, Settings2, Edit, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { useQAManager } from '../../context/QAManagerContext';
import { LoadingSkeleton, EmptyState, QualityScoreBadge, StatusBadge, Pagination, GlassActions, GlassActionButton, GlassActionDivider, Button } from './components';
import QASearchBar from '../../components/QASearchBar';
import TicketHoverPreview from '../../components/TicketHoverPreview';

const QAArchive = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.endsWith('/edit');

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Advanced View state (admin only)
  const [advancedView, setAdvancedView] = useState(false);
  const [advancedTickets, setAdvancedTickets] = useState([]);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedPagination, setAdvancedPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const {
    user,
    isQAAdmin,
    loading,
    tickets,
    agentsForFilter,
    graders,
    pagination,
    archiveFilters,
    setArchiveFilters,
    selectedArchivedTickets,
    setSelectedArchivedTickets,
    focusedTicketIndex,
    setFocusedTicketIndex,
    ticketListRef,
    getSortedData,
    setViewDialog,
    setDeleteDialog,
    handleRestoreTicket,
    handleBulkRestore,
    handleBulkStatusChange,
    handleBulkDelete,
    handlePageChange,
    fetchArchivedTickets,
    openTicketDialog,
    getAuthHeaders,
  } = useQAManager();

  const API_URL = process.env.REACT_APP_API_URL;

  // Fetch all tickets for advanced view (admin only)
  const fetchAdvancedTickets = useCallback(async (page = 1) => {
    if (!isQAAdmin) return;

    try {
      setAdvancedLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', advancedPagination.limit);

      // Apply current filters
      if (archiveFilters.agent) params.append('agent', archiveFilters.agent);
      if (archiveFilters.status) params.append('status', archiveFilters.status);
      if (archiveFilters.grader) params.append('createdBy', archiveFilters.grader);
      if (archiveFilters.dateFrom) params.append('dateFrom', archiveFilters.dateFrom);
      if (archiveFilters.dateTo) params.append('dateTo', archiveFilters.dateTo);
      if (archiveFilters.search) params.append('search', archiveFilters.search);
      if (archiveFilters.categories?.length > 0) {
        params.append('categories', archiveFilters.categories.join(','));
      }
      // Don't filter by isArchived - show all tickets

      const response = await axios.get(
        `${API_URL}/api/qa/admin/tickets?${params.toString()}`,
        getAuthHeaders()
      );

      setAdvancedTickets(response.data.tickets || []);
      setAdvancedPagination(prev => ({
        ...prev,
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      console.error('Error fetching advanced tickets:', err);
      toast.error('Failed to load tickets');
    } finally {
      setAdvancedLoading(false);
    }
  }, [isQAAdmin, API_URL, getAuthHeaders, archiveFilters, advancedPagination.limit]);

  // Handle advanced view pagination
  const handleAdvancedPageChange = useCallback((newPage) => {
    setAdvancedPagination(prev => ({ ...prev, page: newPage }));
    fetchAdvancedTickets(newPage);
  }, [fetchAdvancedTickets]);

  // Helper to check if current user can restore a ticket
  // In normal view: only own tickets. In advanced view: all tickets (admin only)
  const canRestoreTicket = (ticket) => {
    if (advancedView && isQAAdmin) return true;
    return ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id;
  };

  // Handle restore with permission check
  const handleRestoreWithCheck = (ticket) => {
    // In advanced view, check if ticket is archived
    if (advancedView && !ticket.isArchived) {
      toast.info('This ticket is already active');
      return;
    }
    if (!canRestoreTicket(ticket)) {
      toast.error('You can only restore tickets you created');
      return;
    }
    handleRestoreTicket(ticket._id);
  };

  // Handle archive ticket (for active tickets in advanced view)
  const handleArchiveTicket = async (ticket) => {
    if (!advancedView || !isQAAdmin) return;
    if (ticket.isArchived) {
      toast.info('This ticket is already archived');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/qa/tickets/${ticket._id}/archive`, {}, getAuthHeaders());
      toast.success('Ticket archived');
      fetchAdvancedTickets(advancedPagination.page);
    } catch (err) {
      console.error('Error archiving ticket:', err);
      toast.error('Failed to archive ticket');
    }
  };

  // Handle bulk archive for advanced view (archive active tickets)
  const handleBulkArchiveAdvanced = async () => {
    if (!advancedView || !isQAAdmin) return;
    const activeTicketIds = selectedArchivedTickets.filter(id => {
      const ticket = advancedTickets.find(t => t._id === id);
      return ticket && !ticket.isArchived;
    });
    if (activeTicketIds.length === 0) {
      toast.info('No active tickets selected to archive');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/qa/tickets/bulk-archive`, { ticketIds: activeTicketIds }, getAuthHeaders());
      toast.success(`${activeTicketIds.length} ticket(s) archived`);
      setSelectedArchivedTickets([]);
      fetchAdvancedTickets(advancedPagination.page);
    } catch (err) {
      console.error('Error bulk archiving tickets:', err);
      toast.error('Failed to archive tickets');
    }
  };

  // Handle bulk unarchive for advanced view (restore archived tickets)
  const handleBulkUnarchiveAdvanced = async () => {
    if (!advancedView || !isQAAdmin) return;
    const archivedTicketIds = selectedArchivedTickets.filter(id => {
      const ticket = advancedTickets.find(t => t._id === id);
      return ticket && ticket.isArchived;
    });
    if (archivedTicketIds.length === 0) {
      toast.info('No archived tickets selected to restore');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/qa/tickets/bulk-restore`, { ticketIds: archivedTicketIds }, getAuthHeaders());
      toast.success(`${archivedTicketIds.length} ticket(s) restored`);
      setSelectedArchivedTickets([]);
      fetchAdvancedTickets(advancedPagination.page);
    } catch (err) {
      console.error('Error bulk restoring tickets:', err);
      toast.error('Failed to restore tickets');
    }
  };

  // Get counts for selected tickets (for floating panel)
  const getSelectedTicketCounts = () => {
    if (!advancedView) return { active: 0, archived: selectedArchivedTickets.length };
    let active = 0;
    let archived = 0;
    selectedArchivedTickets.forEach(id => {
      const ticket = advancedTickets.find(t => t._id === id);
      if (ticket) {
        if (ticket.isArchived) archived++;
        else active++;
      }
    });
    return { active, archived };
  };

  // Handle edit ticket navigation
  const handleEditTicket = (ticket) => {
    navigate(`/qa-manager/archive/${ticket._id}/edit`);
  };

  // Toggle advanced view
  const toggleAdvancedView = () => {
    if (!advancedView) {
      setAdvancedView(true);
      fetchAdvancedTickets(1);
    } else {
      setAdvancedView(false);
    }
  };

  // Refetch advanced tickets when filters change
  useEffect(() => {
    if (advancedView && isQAAdmin) {
      fetchAdvancedTickets(1);
    }
  }, [advancedView, isQAAdmin, archiveFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination to page 1 when component mounts
  useEffect(() => {
    handlePageChange(1);
  }, []);

  // Fetch archived tickets on mount and when filters change
  useEffect(() => {
    fetchArchivedTickets();
  }, [fetchArchivedTickets, archiveFilters]);

  // Handle URL-based dialog opening (like QATickets does)
  useEffect(() => {
    if (!ticketId) return;

    // Check both ticket sources depending on view mode
    const ticketSource = advancedView ? advancedTickets : tickets;
    if (ticketSource.length === 0) return;

    const ticket = ticketSource.find(t => t._id === ticketId || t.ticketId === ticketId);
    if (ticket) {
      if (isEditMode) {
        openTicketDialog('edit', ticket, 'archive');
      } else {
        setViewDialog({ open: true, ticket, source: 'archive' });
      }
    }
  }, [ticketId, isEditMode, tickets, advancedTickets, advancedView, setViewDialog, openTicketDialog]);

  // Navigate to ticket view with archive source
  const handleViewTicket = (ticket) => {
    navigate(`/qa-manager/archive/${ticket._id}`);
  };

  // For AI search, tickets are already sorted by relevance, don't re-sort
  const isAISearch = archiveFilters.searchMode === 'ai' && archiveFilters.search && archiveFilters.search.trim().length > 0;

  // Use different data source based on view mode
  const currentTickets = advancedView ? advancedTickets : tickets;
  const currentLoading = advancedView ? advancedLoading : loading;
  const currentPagination = advancedView ? advancedPagination : pagination;
  const currentPageChange = advancedView ? handleAdvancedPageChange : handlePageChange;

  const sortedTickets = isAISearch ? currentTickets : getSortedData(currentTickets);

  return (
    <div className="space-y-4">
      {/* Unified Search Bar with AI/Text toggle and filters */}
      <div className="mb-4">
        <QASearchBar
          currentFilters={archiveFilters}
          onFilterChange={setArchiveFilters}
          agents={agentsForFilter}
          graders={graders}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {advancedView ? 'Advanced Management' : 'Archive'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            {advancedView
              ? 'All tickets from all graders'
              : isAISearch
                ? `Found ${tickets.length} similar tickets`
                : 'Archived tickets • Restore your own'}
          </p>
        </div>
        {isQAAdmin && (
          <Button
            size="sm"
            variant={advancedView ? 'primary' : 'glass'}
            onClick={toggleAdvancedView}
            className={advancedView ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-purple-600 dark:text-purple-400'}
          >
            <Settings2 className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{advancedView ? 'Exit Advanced View' : 'Advanced View'}</span>
          </Button>
        )}
      </div>

      {currentLoading ? (
        isAISearch && !advancedView ? (
          // Custom AI search loading state
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-purple-500/30 rounded-full animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Searching with AI...</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Finding semantically similar tickets</p>
              </div>
            </div>
          </div>
        ) : (
          <LoadingSkeleton />
        )
      ) : currentTickets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <EmptyState
            icon={Archive}
            title={advancedView ? "No tickets found" : isAISearch ? "No matching tickets found" : "No archived tickets"}
            description={advancedView
              ? "No tickets match your current filters."
              : isAISearch
                ? "Try different search terms or check if tickets have embeddings generated."
                : "Archived tickets will appear here."}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden">
            {/* Mobile header with select all */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedArchivedTickets.length === currentTickets.length && currentTickets.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedArchivedTickets(currentTickets.map(t => t._id));
                  } else {
                    setSelectedArchivedTickets([]);
                  }
                }}
                className="rounded border-gray-300 dark:border-neutral-600 cursor-pointer"
              />
              <span className="text-xs text-gray-500 dark:text-neutral-400">Select all</span>
            </div>
            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sortedTickets.map((ticket, index) => (
                <div
                  key={ticket._id}
                  className={`p-3 ${
                    selectedArchivedTickets.includes(ticket._id)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : focusedTicketIndex === index
                      ? 'bg-gray-50 dark:bg-neutral-800/50'
                      : ''
                  }`}
                  onClick={() => {
                    setFocusedTicketIndex(index);
                    handleViewTicket(ticket);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedArchivedTickets.includes(ticket._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedArchivedTickets([...selectedArchivedTickets, ticket._id]);
                        } else {
                          setSelectedArchivedTickets(selectedArchivedTickets.filter(id => id !== ticket._id));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 dark:border-neutral-600 cursor-pointer mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {ticket.agent?.name || 'Unknown'}
                        </span>
                        <QualityScoreBadge score={ticket.qualityScorePercent} />
                      </div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-gray-500 dark:text-neutral-400">
                          #{ticket.ticketId || ticket._id.slice(-6)}
                        </span>
                        {isAISearch && !advancedView && ticket.relevanceScore && (
                          <span className={`text-xs font-medium ${
                            ticket.relevanceScore >= 70 ? 'text-green-600' :
                            ticket.relevanceScore >= 50 ? 'text-yellow-600' :
                            'text-gray-500'
                          }`}>
                            {ticket.relevanceScore}% match
                          </span>
                        )}
                        {advancedView && (
                          ticket.isArchived ? (
                            <span className="text-xs text-gray-500">Archived</span>
                          ) : (
                            <span className="text-xs text-green-600">Active</span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mb-2">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {ticket.createdBy?.name || ticket.createdBy?.email?.split('@')[0] || 'Unknown'}
                          {(ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id) && (
                            <span className="text-green-600 ml-1">(you)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={ticket.status} />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${ticket.ticketId}`, '_blank');
                            }}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {advancedView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTicket(ticket);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {advancedView ? (
                            ticket.isArchived ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreWithCheck(ticket);
                                }}
                                className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveTicket(ticket);
                                }}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )
                          ) : (
                            canRestoreTicket(ticket) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreWithCheck(ticket);
                                }}
                                className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPagination.page}
              totalPages={currentPagination.pages}
              totalItems={currentPagination.total}
              onPageChange={currentPageChange}
            />
          </div>

          {/* Desktop Table View */}
          <table className="w-full hidden md:table">
            <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedArchivedTickets.length === currentTickets.length && currentTickets.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedArchivedTickets(currentTickets.map(t => t._id));
                      } else {
                        setSelectedArchivedTickets([]);
                      }
                    }}
                    className="rounded border-gray-300 dark:border-neutral-600 cursor-pointer"
                  />
                </th>
                {isAISearch && !advancedView && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Match</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Grader</th>
                {advancedView && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Archived</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                  {advancedView ? 'Entry Date' : 'Archived Date'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800" ref={ticketListRef}>
              {sortedTickets.map((ticket, index) => (
                <TicketHoverPreview key={ticket._id} ticket={ticket}>
                  <tr
                    data-ticket-index={index}
                    className={`group transition-colors cursor-pointer ${
                      selectedArchivedTickets.includes(ticket._id)
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : focusedTicketIndex === index
                        ? 'bg-gray-50 dark:bg-neutral-800/50'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                    }`}
                    onClick={(e) => {
                      if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) {
                        return;
                      }
                      setFocusedTicketIndex(index);
                      handleViewTicket(ticket);
                    }}
                  >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedArchivedTickets.includes(ticket._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedArchivedTickets([...selectedArchivedTickets, ticket._id]);
                        } else {
                          setSelectedArchivedTickets(selectedArchivedTickets.filter(id => id !== ticket._id));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-neutral-600 cursor-pointer"
                    />
                  </td>
                  {isAISearch && !advancedView && (
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1.5 cursor-help"
                        title={`Hybrid: ${ticket.relevanceScore}%\nSemantic: ${ticket.semanticScore || '-'}%\nKeyword: ${ticket.keywordScore || '-'}%`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span className={`text-xs font-semibold ${
                          ticket.relevanceScore >= 70 ? 'text-green-600 dark:text-green-400' :
                          ticket.relevanceScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-500 dark:text-neutral-400'
                        }`}>
                          {ticket.relevanceScore}%
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-neutral-400" onClick={(e) => e.stopPropagation()}>{ticket.ticketId || ticket._id.slice(-6)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" onClick={(e) => e.stopPropagation()}>{ticket.agent?.name || 'Unknown'}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                      <span className={`text-sm ${canRestoreTicket(ticket) ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-neutral-400'}`}>
                        {ticket.createdBy?.name || ticket.createdBy?.email?.split('@')[0] || 'Unknown'}
                      </span>
                      {(ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id) && (
                        <span className="text-xs text-green-600 dark:text-green-400">(you)</span>
                      )}
                    </div>
                  </td>
                  {advancedView && (
                    <td className="px-4 py-3">
                      {ticket.isArchived ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400">
                          <XCircle className="w-3 h-3" />
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <QualityScoreBadge score={ticket.qualityScorePercent} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">
                    {advancedView
                      ? new Date(ticket.dateEntered || ticket.createdAt).toLocaleDateString()
                      : (ticket.archivedDate ? new Date(ticket.archivedDate).toLocaleDateString() : new Date(ticket.createdAt).toLocaleDateString())
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <GlassActions>
                        <GlassActionButton
                          onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${ticket.ticketId}`, '_blank')}
                          title="Open in Intercom"
                          isFirst
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300" />
                        </GlassActionButton>
                        {advancedView && (
                          <>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => handleEditTicket(ticket)}
                              title="Edit"
                              variant="primary"
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/primary:text-blue-500 dark:group-hover/primary:text-blue-400 transition-colors" />
                            </GlassActionButton>
                          </>
                        )}
                        <GlassActionDivider />
                        {/* Archive/Unarchive button based on ticket status */}
                        {advancedView ? (
                          ticket.isArchived ? (
                            <GlassActionButton
                              onClick={() => handleRestoreWithCheck(ticket)}
                              title="Unarchive"
                              variant="success"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/success:text-green-500 dark:group-hover/success:text-green-400 transition-colors" />
                            </GlassActionButton>
                          ) : (
                            <GlassActionButton
                              onClick={() => handleArchiveTicket(ticket)}
                              title="Archive"
                              variant="warning"
                            >
                              <Archive className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/warning:text-amber-500 dark:group-hover/warning:text-amber-400 transition-colors" />
                            </GlassActionButton>
                          )
                        ) : (
                          <GlassActionButton
                            onClick={() => handleRestoreWithCheck(ticket)}
                            title={canRestoreTicket(ticket) ? "Unarchive" : "Can only restore your own tickets"}
                            variant="success"
                            className={!canRestoreTicket(ticket) ? 'opacity-50 cursor-not-allowed' : ''}
                            isLast
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${canRestoreTicket(ticket) ? 'text-gray-600 dark:text-neutral-300 group-hover/success:text-green-500 dark:group-hover/success:text-green-400' : 'text-gray-400 dark:text-neutral-500'} transition-colors`} />
                          </GlassActionButton>
                        )}
                        {advancedView && (
                          <>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => setDeleteDialog({ open: true, type: 'ticket', id: ticket._id, name: ticket.ticketId })}
                              title="Delete"
                              variant="danger"
                              isLast
                            >
                              <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/delete:text-red-500 dark:group-hover/delete:text-red-400 transition-colors" />
                            </GlassActionButton>
                          </>
                        )}
                      </GlassActions>
                    </div>
                  </td>
                </tr>
              </TicketHoverPreview>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPagination.page}
            totalPages={currentPagination.pages}
            totalItems={currentPagination.total}
            onPageChange={currentPageChange}
          />
        </div>
      )}

      {/* Floating Action Panel for Selected Tickets */}
      <AnimatePresence>
        {selectedArchivedTickets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto max-w-full"
          >
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                {selectedArchivedTickets.length} ticket(s) selected
                {advancedView && (
                  <span className="text-xs text-gray-500 dark:text-neutral-500 ml-1">
                    ({getSelectedTicketCounts().active} active, {getSelectedTicketCounts().archived} archived)
                  </span>
                )}
              </span>

              <div className="h-6 w-px bg-gray-200 dark:bg-neutral-700" />

              {/* Advanced View: Show Archive and Unarchive buttons */}
              {advancedView ? (
                <>
                  {/* Archive Button (for active tickets) */}
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={handleBulkArchiveAdvanced}
                    className="text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    title="Archive active tickets"
                    disabled={getSelectedTicketCounts().active === 0}
                  >
                    <Archive className="w-4 h-4 mr-1.5" />
                    Archive ({getSelectedTicketCounts().active})
                  </Button>

                  {/* Unarchive Button (for archived tickets) */}
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={handleBulkUnarchiveAdvanced}
                    className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    title="Restore archived tickets"
                    disabled={getSelectedTicketCounts().archived === 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Unarchive ({getSelectedTicketCounts().archived})
                  </Button>

                  <div className="relative" ref={dropdownRef}>
                    <Button
                      size="sm"
                      variant="glass"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      Change Status
                      <ChevronDown className={`w-4 h-4 ml-1.5 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </Button>

                    <AnimatePresence>
                      {statusDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              handleBulkStatusChange('Selected');
                              setStatusDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Selected
                          </button>
                          <button
                            onClick={() => {
                              handleBulkStatusChange('Graded');
                              setStatusDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Graded
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-6 w-px bg-gray-200 dark:bg-neutral-700" />

                  {/* Delete Button - Advanced View only */}
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={handleBulkDelete}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                </>
              ) : (
                /* Normal View: Just Unarchive (own tickets only) */
                <Button
                  size="sm"
                  variant="glass"
                  onClick={handleBulkRestore}
                  className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  title="Only tickets you created will be restored"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Unarchive (own)
                </Button>
              )}

              <div className="h-6 w-px bg-gray-200 dark:bg-neutral-700" />

              {/* Clear Selection */}
              <button
                onClick={() => setSelectedArchivedTickets([])}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QAArchive;
