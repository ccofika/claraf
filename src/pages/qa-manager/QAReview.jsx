import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, XCircle, Eye, Edit, BarChart2, MessageSquare
} from 'lucide-react';
import { useQAManager } from '../../context/QAManagerContext';
import { LoadingSkeleton, EmptyState, QualityScoreBadge, Button, Pagination, GlassActions, GlassActionButton, GlassActionDivider } from './components';
import QASearchBar from '../../components/QASearchBar';
import TicketHoverPreview from '../../components/TicketHoverPreview';

const QAReview = () => {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.pathname.endsWith('/edit');

  const {
    loading,
    isReviewer,
    reviewTickets,
    agents,
    graders,
    reviewPagination,
    setReviewPagination,
    reviewFilters,
    setReviewFilters,
    fetchReviewTickets,
    fetchReviewTicket,
    handleApproveTicket,
    handleDenyTicket,
    getSortedData,
    openTicketDialog,
    setViewDialog,
  } = useQAManager();

  // Local state
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [focusedTicketIndex, setFocusedTicketIndex] = useState(-1);
  const ticketListRef = useRef(null);

  // Redirect if not a reviewer
  useEffect(() => {
    if (!isReviewer) {
      navigate('/qa-manager/tickets');
    }
  }, [isReviewer, navigate]);

  // Reset pagination to page 1 when component mounts
  useEffect(() => {
    setReviewPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Fetch review tickets on mount and when filters change
  useEffect(() => {
    if (isReviewer) {
      fetchReviewTickets();
    }
  }, [fetchReviewTickets, reviewFilters, isReviewer]);

  // Handle URL-based dialog opening
  useEffect(() => {
    const loadTicketFromUrl = async () => {
      if (ticketId && isReviewer) {
        const ticket = await fetchReviewTicket(ticketId);
        if (ticket) {
          if (isEditMode) {
            openTicketDialog('edit', ticket, 'review');
          } else {
            setViewDialog({ open: true, ticket, source: 'review' });
          }
        }
      }
    };
    loadTicketFromUrl();
  }, [ticketId, isEditMode, isReviewer, fetchReviewTicket, openTicketDialog, setViewDialog]);

  const sortedTickets = getSortedData(reviewTickets);

  // Navigate to ticket view
  const handleViewTicket = (ticket) => {
    navigate(`/qa-manager/review/${ticket._id}`);
  };

  // Navigate to ticket edit
  const handleEditTicket = (ticket) => {
    navigate(`/qa-manager/review/${ticket._id}/edit`);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setReviewPagination(prev => ({ ...prev, page: newPage }));
  };

  // Select all handler
  const handleSelectAll = () => {
    if (selectedTickets.length === sortedTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(sortedTickets.map(t => t._id));
    }
  };

  if (!isReviewer) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="mb-4">
        <QASearchBar
          currentFilters={reviewFilters}
          onFilterChange={setReviewFilters}
          agents={agents}
          graders={graders}
          hideStatusFilter={true}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Review Queue</h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Approve or deny tickets with quality score below 85%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="glass"
            onClick={() => navigate('/qa-manager/review/analytics')}
            className="text-purple-600 dark:text-purple-400"
          >
            <BarChart2 className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : sortedTickets.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No tickets to review"
          description="All tickets have been reviewed. Check back later for new submissions."
        />
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {/* Mobile header with select all */}
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={selectedTickets.length === sortedTickets.length && sortedTickets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-neutral-600"
                />
                Select all
              </label>
              <span className="text-xs text-gray-500">{sortedTickets.length} tickets</span>
            </div>

            {/* Mobile ticket cards */}
            {sortedTickets.map((ticket) => (
              <div
                key={ticket._id}
                className={`bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 ${
                  selectedTickets.includes(ticket._id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTickets.includes(ticket._id)}
                    onChange={() => {
                      setSelectedTickets(prev =>
                        prev.includes(ticket._id)
                          ? prev.filter(id => id !== ticket._id)
                          : [...prev, ticket._id]
                      );
                    }}
                    className="rounded border-gray-300 dark:border-neutral-600 mt-1"
                  />
                  <div className="flex-1 min-w-0" onClick={() => handleEditTicket(ticket)}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.ticketId}
                        </span>
                      </div>
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 dark:text-neutral-400">
                      <p><span className="text-gray-400">Agent:</span> {ticket.agent?.name || 'Unknown'}</p>
                      <p><span className="text-gray-400">Grader:</span> {ticket.createdBy?.name || ticket.createdBy?.email || 'Unknown'}</p>
                      <p><span className="text-gray-400">Date:</span> {ticket.firstReviewDate
                        ? new Date(ticket.firstReviewDate).toLocaleDateString()
                        : new Date(ticket.dateEntered).toLocaleDateString()}</p>
                      {ticket.additionalNote && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <MessageSquare className="w-3 h-3" />
                          <span>Has note</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Mobile actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTicket(ticket)}
                    className="p-2 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => await handleApproveTicket(ticket._id)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => await handleDenyTicket(ticket._id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    title="Deny"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full" ref={ticketListRef}>
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTickets.length === sortedTickets.length && sortedTickets.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-neutral-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Grader
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Note
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {sortedTickets.map((ticket, index) => (
                  <TicketHoverPreview key={ticket._id} ticket={ticket}>
                    <tr
                      className={`hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                        selectedTickets.includes(ticket._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${focusedTicketIndex === index ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                      onClick={() => handleEditTicket(ticket)}
                    >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedTickets(prev =>
                            prev.includes(ticket._id)
                              ? prev.filter(id => id !== ticket._id)
                              : [...prev, ticket._id]
                          );
                        }}
                        className="rounded border-gray-300 dark:border-neutral-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.ticketId}
                        </span>
                      </div>
                      {ticket.shortDescription && (
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 truncate max-w-[200px]">
                          {ticket.shortDescription}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {ticket.agent?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-neutral-400">
                        {ticket.createdBy?.name || ticket.createdBy?.email || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-neutral-400">
                        {ticket.firstReviewDate
                          ? new Date(ticket.firstReviewDate).toLocaleDateString()
                          : new Date(ticket.dateEntered).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.additionalNote ? (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-xs">Has note</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <GlassActions>
                        <GlassActionButton
                          onClick={() => handleViewTicket(ticket)}
                          title="View"
                          variant="primary"
                          isFirst
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </GlassActionButton>
                        <GlassActionDivider />
                        <GlassActionButton
                          onClick={() => handleEditTicket(ticket)}
                          title="Edit & Review"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </GlassActionButton>
                        <GlassActionDivider />
                        <GlassActionButton
                          onClick={async () => {
                            await handleApproveTicket(ticket._id);
                          }}
                          title="Approve"
                          variant="success"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </GlassActionButton>
                        <GlassActionDivider />
                        <GlassActionButton
                          onClick={async () => {
                            await handleDenyTicket(ticket._id);
                          }}
                          title="Deny"
                          variant="danger"
                          isLast
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </GlassActionButton>
                      </GlassActions>
                    </td>
                  </tr>
                </TicketHoverPreview>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {reviewPagination.pages > 1 && (
            <Pagination
              currentPage={reviewPagination.page}
              totalPages={reviewPagination.pages}
              totalItems={reviewPagination.total}
              itemsPerPage={reviewPagination.limit}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default QAReview;
