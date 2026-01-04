import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { X, Plus, Trash2, Search, FileText, ExternalLink, Hash } from 'lucide-react';
import TicketRichTextEditor from './TicketRichTextEditor';
import { useMacros } from '../hooks/useMacros';

const ManageMacrosModal = ({ open, onOpenChange, onViewTicket }) => {
  const {
    macros,
    loading,
    fetchMacros,
    createMacro,
    updateMacro,
    deleteMacro,
    getMacroTickets
  } = useMacros();

  const [selectedMacro, setSelectedMacro] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    title: '',
    feedback: ''
  });

  // Used in tickets state
  const [usedInTickets, setUsedInTickets] = useState({ tickets: [], total: 0, hasMore: false });
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsOffset, setTicketsOffset] = useState(0);

  // Fetch macros on open
  useEffect(() => {
    if (open) {
      fetchMacros();
      setSelectedMacro(null);
      setIsCreating(false);
      setFormData({ title: '', feedback: '' });
    }
  }, [open, fetchMacros]);

  // Update form when macro is selected
  useEffect(() => {
    if (selectedMacro) {
      setFormData({
        title: selectedMacro.title,
        feedback: selectedMacro.feedback
      });
      setIsCreating(false);
      loadUsedInTickets(selectedMacro._id);
    }
  }, [selectedMacro]);

  // Load used in tickets
  const loadUsedInTickets = async (macroId, offset = 0) => {
    setLoadingTickets(true);
    try {
      const result = await getMacroTickets(macroId, 10, offset);
      if (offset === 0) {
        setUsedInTickets(result);
      } else {
        setUsedInTickets(prev => ({
          ...result,
          tickets: [...prev.tickets, ...result.tickets]
        }));
      }
      setTicketsOffset(offset);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Filter macros by search term
  const filteredMacros = macros.filter(macro =>
    macro.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create new
  const handleCreateNew = () => {
    setSelectedMacro(null);
    setIsCreating(true);
    setFormData({ title: '', feedback: '' });
    setUsedInTickets({ tickets: [], total: 0, hasMore: false });
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.feedback.trim()) {
      toast.error('Feedback content is required');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        const result = await createMacro(formData);
        if (result.success) {
          toast.success('Macro created successfully');
          setSelectedMacro(result.data);
          setIsCreating(false);
        } else {
          toast.error(result.error);
        }
      } else if (selectedMacro) {
        const result = await updateMacro(selectedMacro._id, formData);
        if (result.success) {
          toast.success('Macro updated successfully');
          setSelectedMacro(result.data);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMacro) return;

    if (!window.confirm(`Are you sure you want to delete "${selectedMacro.title}"?`)) {
      return;
    }

    const result = await deleteMacro(selectedMacro._id);
    if (result.success) {
      toast.success('Macro deleted successfully');
      setSelectedMacro(null);
      setFormData({ title: '', feedback: '' });
    } else {
      toast.error(result.error);
    }
  };

  // Handle ticket click - open ViewTicket on top without closing ManageMacros
  const handleTicketClick = (item) => {
    if (onViewTicket) {
      // item.ticketId is the populated Ticket document, so use item.ticketId._id for MongoDB ObjectId
      const ticketMongoId = item.ticketId?._id || item.ticketId;
      if (ticketMongoId) {
        onViewTicket(ticketMongoId);
      }
      // Don't close ManageMacrosModal - ViewTicket will open on top
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Manage Macros
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Main Content - 25/75 Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR - Macro List (25%) */}
          <div className="w-1/4 flex flex-col border-r border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search macros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white dark:bg-neutral-900"
                />
              </div>
            </div>

            {/* Macro List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                  Loading macros...
                </div>
              ) : filteredMacros.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-neutral-400 text-sm">
                  {searchTerm ? 'No macros found' : 'No macros yet'}
                </div>
              ) : (
                filteredMacros.map((macro) => (
                  <button
                    key={macro._id}
                    onClick={() => setSelectedMacro(macro)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                      selectedMacro?._id === macro._id ? 'bg-gray-100 dark:bg-neutral-800' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {macro.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                      Used {macro.usageCount || 0} times
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* New Macro Button */}
            <div className="p-3 border-t border-gray-200 dark:border-neutral-800">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Macro
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - Edit Form (75%) */}
          <div className="w-3/4 flex flex-col overflow-hidden">
            {!selectedMacro && !isCreating ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a macro to edit or create a new one</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
                      Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., ontario-ip-issue"
                      className="bg-white dark:bg-neutral-800"
                    />
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                      Use a descriptive name. Type # followed by part of the title to quickly insert this macro.
                    </p>
                  </div>

                  {/* Feedback Content */}
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">
                      Feedback Content
                    </Label>
                    <TicketRichTextEditor
                      value={formData.feedback}
                      onChange={(html) => setFormData({ ...formData, feedback: html })}
                      placeholder="Enter the feedback template content..."
                      rows={10}
                      className="min-h-[200px]"
                    />
                  </div>

                  {/* Used In Tickets - Only show for existing macros */}
                  {selectedMacro && !isCreating && (
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5" />
                        This macro was used in:
                      </Label>
                      <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
                        {loadingTickets && usedInTickets.tickets.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Loading...</p>
                        ) : usedInTickets.tickets.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-neutral-400 italic">
                            This macro hasn't been used in any tickets yet.
                          </p>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {usedInTickets.tickets.map((item, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleTicketClick(item)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-mono rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  {item.ticketNumber || item.ticketId?._id?.slice(-6) || 'Unknown'}
                                </button>
                              ))}
                            </div>
                            {usedInTickets.hasMore && (
                              <button
                                onClick={() => loadUsedInTickets(selectedMacro._id, ticketsOffset + 10)}
                                disabled={loadingTickets}
                                className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {loadingTickets ? 'Loading...' : `Show more (${usedInTickets.total - usedInTickets.tickets.length} more)`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                  <div className="flex items-center justify-between">
                    <div>
                      {selectedMacro && !isCreating && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isCreating) {
                            setIsCreating(false);
                            setFormData({ title: '', feedback: '' });
                          } else {
                            setSelectedMacro(null);
                          }
                        }}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : isCreating ? 'Create Macro' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMacrosModal;
