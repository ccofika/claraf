import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Archive, RotateCcw, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { useQAManager } from '../../context/QAManagerContext';
import { LoadingSkeleton, EmptyState, QualityScoreBadge, StatusBadge, Pagination, GlassActions, GlassActionButton, GlassActionDivider } from './components';
import QASearchBar from '../../components/QASearchBar';
import TicketHoverPreview from '../../components/TicketHoverPreview';

const QAArchive = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname.endsWith('/edit');

  const {
    loading,
    tickets,
    agentsForFilter,
    graders,
    pagination,
    archiveFilters,
    setArchiveFilters,
    focusedTicketIndex,
    setFocusedTicketIndex,
    ticketListRef,
    getSortedData,
    setViewDialog,
    setDeleteDialog,
    handleRestoreTicket,
    handlePageChange,
    fetchArchivedTickets,
    openTicketDialog,
  } = useQAManager();

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
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t._id === ticketId || t.ticketId === ticketId);
      if (ticket) {
        if (isEditMode) {
          openTicketDialog('edit', ticket, 'archive');
        } else {
          setViewDialog({ open: true, ticket, source: 'archive' });
        }
      }
    }
  }, [ticketId, isEditMode, tickets, setViewDialog, openTicketDialog]);

  // Navigate to ticket view with archive source
  const handleViewTicket = (ticket) => {
    navigate(`/qa-manager/archive/${ticket._id}`);
  };

  // For AI search, tickets are already sorted by relevance, don't re-sort
  const isAISearch = archiveFilters.searchMode === 'ai' && archiveFilters.search && archiveFilters.search.trim().length > 0;
  const sortedTickets = isAISearch ? tickets : getSortedData(tickets);

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

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Archive</h2>
        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
          {isAISearch
            ? `Found ${tickets.length} semantically similar tickets`
            : 'Archived tickets from all QA agents'}
        </p>
      </div>

      {loading ? (
        isAISearch ? (
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
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <EmptyState
            icon={Archive}
            title={isAISearch ? "No matching tickets found" : "No archived tickets"}
            description={isAISearch
              ? "Try different search terms or check if tickets have embeddings generated."
              : "Archived tickets will appear here."}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
              <tr>
                {isAISearch && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Match</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Archived Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800" ref={ticketListRef}>
              {sortedTickets.map((ticket, index) => (
                <TicketHoverPreview key={ticket._id} ticket={ticket}>
                  <tr
                    data-ticket-index={index}
                    className={`group transition-colors cursor-pointer ${
                      focusedTicketIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                    }`}
                    onClick={(e) => {
                      if (e.target.closest('button')) {
                        return;
                      }
                      setFocusedTicketIndex(index);
                      handleViewTicket(ticket);
                    }}
                  >
                  {isAISearch && (
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
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <QualityScoreBadge score={ticket.qualityScorePercent} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">
                    {ticket.archivedDate ? new Date(ticket.archivedDate).toLocaleDateString() : new Date(ticket.createdAt).toLocaleDateString()}
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
                        <GlassActionDivider />
                        <GlassActionButton
                          onClick={() => handleRestoreTicket(ticket._id)}
                          title="Restore"
                          variant="success"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/success:text-green-500 dark:group-hover/success:text-green-400 transition-colors" />
                        </GlassActionButton>
                        <GlassActionDivider />
                        <GlassActionButton
                          onClick={() => setDeleteDialog({ open: true, type: 'ticket', id: ticket._id, name: ticket.ticketId })}
                          title="Delete"
                          variant="danger"
                          isLast
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/delete:text-red-500 dark:group-hover/delete:text-red-400 transition-colors" />
                        </GlassActionButton>
                      </GlassActions>
                    </div>
                  </td>
                </tr>
              </TicketHoverPreview>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default QAArchive;
