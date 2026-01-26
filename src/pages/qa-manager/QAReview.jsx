import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, XCircle, Eye, Edit, BarChart2, MessageSquare
} from 'lucide-react';
import { useQAManager } from '../../context/QAManagerContext';
import { LoadingSkeleton, EmptyState, QualityScoreBadge, Button, Pagination, GlassActions, GlassActionButton, GlassActionDivider } from './components';
import QASearchBar from '../../components/QASearchBar';
import TicketHoverPreview from '../../components/TicketHoverPreview';
import ReviewTicketDialog from './components/ReviewTicketDialog';

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
    handleUpdateReviewTicket,
    getSortedData,
  } = useQAManager();

  // Local state
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [focusedTicketIndex, setFocusedTicketIndex] = useState(-1);
  const [viewTicket, setViewTicket] = useState(null);
  const [editTicket, setEditTicket] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view' or 'edit'
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
            setEditTicket(ticket);
            setDialogMode('edit');
            setDialogOpen(true);
          } else {
            setViewTicket(ticket);
            setDialogMode('view');
            setDialogOpen(true);
          }
        }
      }
    };
    loadTicketFromUrl();
  }, [ticketId, isEditMode, isReviewer, fetchReviewTicket]);

  const sortedTickets = getSortedData(reviewTickets);

  // Navigate to ticket view
  const handleViewTicket = (ticket) => {
    navigate(`/qa-manager/review/${ticket._id}`);
  };

  // Navigate to ticket edit
  const handleEditTicket = (ticket) => {
    navigate(`/qa-manager/review/${ticket._id}/edit`);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setViewTicket(null);
    setEditTicket(null);
    navigate('/qa-manager/review');
  };

  // Handle approve from dialog
  const handleApprove = async (ticketId, formData) => {
    try {
      // First update the ticket with any changes
      if (formData) {
        await handleUpdateReviewTicket(ticketId, formData);
      }
      // Then approve
      await handleApproveTicket(ticketId);
      handleCloseDialog();
    } catch (err) {
      console.error('Error approving ticket:', err);
    }
  };

  // Handle deny from dialog
  const handleDeny = async (ticketId, formData) => {
    try {
      // First update the ticket with any changes
      if (formData) {
        await handleUpdateReviewTicket(ticketId, formData);
      }
      // Then deny
      await handleDenyTicket(ticketId);
      handleCloseDialog();
    } catch (err) {
      console.error('Error denying ticket:', err);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Queue</h2>
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
            <BarChart2 className="w-4 h-4 mr-1.5" />
            Analytics
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
          {/* Tickets Table */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
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
                      onClick={() => handleViewTicket(ticket)}
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

      {/* Review Ticket Dialog */}
      <ReviewTicketDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        ticket={dialogMode === 'edit' ? editTicket : viewTicket}
        mode={dialogMode}
        onApprove={handleApprove}
        onDeny={handleDeny}
        onUpdate={handleUpdateReviewTicket}
      />
    </div>
  );
};

export default QAReview;
