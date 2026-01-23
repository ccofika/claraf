import React, { useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Archive, Plus, Send, Hash, Edit, Trash2, ExternalLink, Eye, Check, XCircle, Sparkles
} from 'lucide-react';
import { useQAManager } from '../../context/QAManagerContext';
import { LoadingSkeleton, EmptyState, QualityScoreBadge, StatusBadge, Button, Pagination, GlassActions, GlassActionButton, GlassActionDivider } from './components';
import QASearchBar from '../../components/QASearchBar';
import TicketHoverPreview from '../../components/TicketHoverPreview';

const QATickets = () => {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.pathname.endsWith('/edit');

  const {
    loading,
    tickets,
    agents,
    graders,
    pagination,
    ticketsFilters,
    setTicketsFilters,
    selectedTickets,
    setSelectedTickets,
    focusedTicketIndex,
    setFocusedTicketIndex,
    ticketListRef,
    validationErrors,
    pendingMacroTickets,
    archivingAll,
    getSortedData,
    openTicketDialog,
    setViewDialog,
    setDeleteDialog,
    setManageMacrosDialog,
    setSendMacroDialog,
    setDeclineConfirmDialog,
    handleArchiveTicket,
    handleBulkArchive,
    handleArchiveAll,
    handleAcceptMacroTicket,
    handlePageChange,
    fetchTickets,
  } = useQAManager();

  // Reset pagination to page 1 when component mounts
  useEffect(() => {
    handlePageChange(1);
  }, []);

  // Fetch tickets on mount and when filters change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, ticketsFilters]);

  // Handle URL-based dialog opening
  useEffect(() => {
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t._id === ticketId || t.ticketId === ticketId);
      if (ticket) {
        if (isEditMode) {
          openTicketDialog('edit', ticket, 'tickets');
        } else {
          setViewDialog({ open: true, ticket, source: 'tickets' });
        }
      }
    }
  }, [ticketId, isEditMode, tickets, openTicketDialog, setViewDialog]);

  const sortedTickets = getSortedData(tickets);

  // Navigate to ticket view
  const handleViewTicket = (ticket) => {
    navigate(`/qa-manager/tickets/${ticket._id}`);
  };

  // Navigate to ticket edit
  const handleEditTicket = (ticket) => {
    navigate(`/qa-manager/tickets/${ticket._id}/edit`);
  };

  return (
    <div className="space-y-4">
      {/* Unified Search Bar with AI/Text toggle and filters */}
      <div className="mb-4">
        <QASearchBar
          currentFilters={ticketsFilters}
          onFilterChange={setTicketsFilters}
          agents={agents}
          graders={graders}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Review and grade support tickets</p>
        </div>
        <div className="flex items-center gap-2">
          {tickets.length > 0 && (
            <Button
              size="sm"
              variant="glass"
              onClick={handleArchiveAll}
              disabled={archivingAll}
              className="text-amber-600 dark:text-amber-400"
            >
              <Archive className="w-4 h-4 mr-1.5" />
              {archivingAll ? 'Archiving...' : 'Archive All'}
            </Button>
          )}
          <Button size="sm" variant="glass" onClick={() => setManageMacrosDialog({ open: true })}>
            <Hash className="w-4 h-4 mr-1.5" />
            Macros
          </Button>
          <Button
            size="sm"
            variant="glass"
            onClick={() => setSendMacroDialog({ open: true })}
            className="text-blue-600 dark:text-blue-400"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Send
          </Button>
          <Button size="sm" variant="glass" onClick={() => openTicketDialog('create')}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-neutral-300">{selectedTickets.length} ticket(s) selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedTickets([])}>
              Clear
            </Button>
            <Button size="sm" variant="glass" onClick={handleBulkArchive}>
              <Archive className="w-4 h-4 mr-1.5" />
              Archive Selected
            </Button>
          </div>
        </div>
      )}

      {/* Pending Tickets - Blue glowing cards above regular tickets */}
      {pendingMacroTickets.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Incoming Tickets ({pendingMacroTickets.length})
          </h3>
          {pendingMacroTickets.map((macroTicket) => (
            <motion.div
              key={macroTicket._id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-500 rounded-lg p-4 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Ticket ID</p>
                    <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{macroTicket.ticketId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Agent</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{macroTicket.agent?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Date</p>
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      {new Date(macroTicket.dateEntered).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">From</p>
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      {macroTicket.sentBy?.name || macroTicket.sentBy?.email}
                    </p>
                  </div>
                  {macroTicket.notes && (
                    <div className="max-w-xs">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-neutral-300 truncate">
                        <span dangerouslySetInnerHTML={{ __html: macroTicket.notes.substring(0, 100) + (macroTicket.notes.length > 100 ? '...' : '') }} />
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${macroTicket.ticketId}`, '_blank')}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    title="Open in Intercom"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setViewDialog({
                        open: true,
                        ticket: {
                          _id: macroTicket._id,
                          ticketId: macroTicket.ticketId,
                          agent: macroTicket.agent,
                          dateEntered: macroTicket.dateEntered,
                          notes: macroTicket.notes,
                          status: 'Pending',
                          isMacroTicket: true
                        },
                        source: 'tickets'
                      });
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptMacroTicket(macroTicket._id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDeclineConfirmDialog({ open: true, macroTicket })}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : tickets.length === 0 && pendingMacroTickets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <EmptyState
            icon={FileText}
            title="No tickets found"
            description="No tickets match your current filters."
            action={
              <Button variant="glass" onClick={() => openTicketDialog('create')}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Ticket
              </Button>
            }
          />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <EmptyState
            icon={FileText}
            title="No regular tickets found"
            description="You have pending macro tickets above, but no regular tickets match your filters."
          />
        </div>
      ) : (
        <div className="py-4 -my-4 px-2 -mx-2 overflow-visible">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 rounded-t-lg">
                <tr>
                  <th className="px-4 py-2.5 w-8 rounded-tl-lg">
                    <input
                      type="checkbox"
                      checked={selectedTickets.length === tickets.length && tickets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTickets(tickets.map(t => t._id));
                        } else {
                          setSelectedTickets([]);
                        }
                      }}
                      className="rounded border-gray-300 dark:border-neutral-600"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800" ref={ticketListRef}>
                {sortedTickets.map((ticket, index) => {
                  const ticketValidationError = validationErrors.invalidTickets[ticket._id];
                  const hasValidationError = validationErrors.validationMode && ticketValidationError;

                  return (
                    <TicketHoverPreview key={ticket._id} ticket={ticket}>
                      <tr
                        data-ticket-index={index}
                        className={`group transition-colors cursor-pointer relative ${
                          hasValidationError
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : focusedTicketIndex === index
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                        }`}
                        style={hasValidationError ? {
                          boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 0 2px rgba(239, 68, 68, 0.6)'
                        } : undefined}
                        onClick={(e) => {
                          if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) {
                            return;
                          }
                          setFocusedTicketIndex(index);
                          handleViewTicket(ticket);
                        }}
                      >
                      {/* Validation error tooltip */}
                      {hasValidationError && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                            <span className="text-red-400 dark:text-red-600 font-semibold">Missing:</span> {ticketValidationError.missing.join(', ')}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-100" />
                          </div>
                        </div>
                      )}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTickets([...selectedTickets, ticket._id]);
                            } else {
                              setSelectedTickets(selectedTickets.filter(id => id !== ticket._id));
                            }
                          }}
                          className="rounded border-gray-300 dark:border-neutral-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-neutral-400" onClick={(e) => e.stopPropagation()}>{ticket.ticketId || ticket._id.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
                        {ticket.agent?.name || ticket.agentName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">
                        {new Date(ticket.dateEntered || ticket.createdAt || ticket.reviewDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3">
                        <QualityScoreBadge score={ticket.qualityScorePercent} />
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
                              onClick={() => handleEditTicket(ticket)}
                              title="Edit"
                              variant="primary"
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/primary:text-blue-500 dark:group-hover/primary:text-blue-400 transition-colors" />
                            </GlassActionButton>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => handleArchiveTicket(ticket._id)}
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300" />
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
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QATickets;
