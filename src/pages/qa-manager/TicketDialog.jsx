import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, MessageSquare, Hash, Save, X, ChevronLeft, ChevronRight,
  AlertTriangle, Sparkles, Users, ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { DatePicker } from '../../components/ui/date-picker';
import TicketRichTextEditor from '../../components/TicketRichTextEditor';
import ScorecardEditor from '../../components/ScorecardEditor';
import SimilarFeedbacksPanel from '../../components/SimilarFeedbacksPanel';
import RelatedTicketsPanel from '../../components/RelatedTicketsPanel';
import ChooseMacroModal from '../../components/ChooseMacroModal';
import { hasScorecard, getScorecardCategories } from '../../data/scorecardConfig';
import { useMacros } from '../../hooks/useMacros';
import { Button } from './components';

const TicketDialog = ({
  ticketDialog,
  setTicketDialog,
  agents,
  tickets,
  ticketFormDataRef,
  originalFormDataRef,
  hasUnsavedChangesRef,
  handleCreateTicket,
  handleUpdateTicket,
  getCurrentTicketIndex,
  navigateWithUnsavedCheck,
  setUnsavedChangesModal,
  setSaveAsMacroDialog,
  routerNavigate
}) => {
  const formRef = useRef(null);
  const [rightPanelMode, setRightPanelMode] = useState('ai');
  const [formData, setFormDataLocal] = useState(() => ({ ...ticketFormDataRef.current }));

  const setFormData = useCallback((valueOrUpdater) => {
    setFormDataLocal(prev => {
      const newValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      ticketFormDataRef.current = newValue;
      return newValue;
    });
  }, [ticketFormDataRef]);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);
  const categoryDropdownRef = useRef(null);
  const categoryInputRef = useRef(null);
  const categoryListRef = useRef(null);
  const [showChooseMacroModal, setShowChooseMacroModal] = useState(false);
  const { recordUsage } = useMacros();

  // Sync formData with ticketFormDataRef when dialog opens or ticket changes
  useEffect(() => {
    if (ticketDialog.open) {
      setFormDataLocal({ ...ticketFormDataRef.current });
    }
  }, [ticketDialog.open, ticketDialog.data?._id, ticketFormDataRef]);

  const selectedAgent = agents.find(a => a._id === formData.agent);
  const agentPosition = selectedAgent?.position || null;
  const agentHasScorecard = agentPosition && hasScorecard(agentPosition);

  const defaultCategories = [
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

  const allCategories = agentHasScorecard
    ? getScorecardCategories(agentPosition)
    : defaultCategories;

  const filteredCategories = allCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
    !formData.categories.includes(cat)
  );

  useEffect(() => {
    setCategoryHighlightIndex(0);
  }, [categorySearch]);

  useEffect(() => {
    if (showCategoryDropdown && categoryListRef.current) {
      const highlighted = categoryListRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [categoryHighlightIndex, showCategoryDropdown]);

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
          setFormData({ ...formData, categories: [...formData.categories, selected] });
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
        if (categorySearch === '' && formData.categories.length > 0) {
          setFormData({ ...formData, categories: formData.categories.slice(0, -1) });
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (ticketDialog.mode === 'edit' && ticketDialog.data) {
      originalFormDataRef.current = { ...ticketFormDataRef.current };
      hasUnsavedChangesRef.current = false;
    }
    return () => {
      hasUnsavedChangesRef.current = false;
      originalFormDataRef.current = null;
    };
  }, [ticketDialog.mode, ticketDialog.data?._id, originalFormDataRef, hasUnsavedChangesRef, ticketFormDataRef]);

  useEffect(() => {
    if (ticketDialog.mode === 'edit' && originalFormDataRef.current) {
      const original = originalFormDataRef.current;
      const hasChanges =
        formData.agent !== original.agent ||
        formData.ticketId !== original.ticketId ||
        formData.status !== original.status ||
        formData.qualityScorePercent !== original.qualityScorePercent ||
        formData.notes !== original.notes ||
        formData.feedback !== original.feedback ||
        formData.dateEntered !== original.dateEntered ||
        JSON.stringify(formData.categories) !== JSON.stringify(original.categories) ||
        formData.scorecardVariant !== original.scorecardVariant ||
        JSON.stringify(formData.scorecardValues) !== JSON.stringify(original.scorecardValues);
      hasUnsavedChangesRef.current = hasChanges;
    }
  }, [formData, ticketDialog.mode, originalFormDataRef, hasUnsavedChangesRef]);

  const currentIndex = ticketDialog.data ? getCurrentTicketIndex(ticketDialog.data._id) : -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < tickets.length - 1;

  // Determine base path based on source
  const source = ticketDialog.source || 'tickets';
  const basePath = source === 'archive' ? '/qa-manager/archive' : '/qa-manager/tickets';

  // Navigate to ticket with URL update
  const handleNavigateTicket = (direction) => {
    navigateWithUnsavedCheck(direction, ticketDialog.data?._id, (newTicket) => {
      if (routerNavigate && newTicket) {
        routerNavigate(`${basePath}/${newTicket._id}/edit`);
      }
    });
  };

  useEffect(() => {
    // Only add keyboard listener when dialog is open
    if (!ticketDialog.open) return;

    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }
      if (e.altKey && ticketDialog.mode === 'edit' && ticketDialog.data) {
        if (e.key === 'ArrowLeft' && canGoPrev) {
          e.preventDefault();
          handleNavigateTicket('prev');
        } else if (e.key === 'ArrowRight' && canGoNext) {
          e.preventDefault();
          handleNavigateTicket('next');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticketDialog.open, ticketDialog.mode, ticketDialog.data, canGoPrev, canGoNext, navigateWithUnsavedCheck, routerNavigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticketDialog.mode === 'create') {
      handleCreateTicket(formData);
    } else {
      handleUpdateTicket(ticketDialog.data._id, formData);
    }
  };

  const hasFormData = () => {
    return (
      formData.agent ||
      formData.ticketId ||
      formData.notes?.trim() ||
      formData.feedback?.trim() ||
      formData.qualityScorePercent ||
      formData.categories?.length > 0 ||
      formData.scorecardVariant ||
      Object.keys(formData.scorecardValues || {}).length > 0
    );
  };

  const handleCloseDialog = () => {
    const shouldShowModal = ticketDialog.mode === 'create'
      ? hasFormData()
      : hasUnsavedChangesRef.current;

    const closeAndNavigate = () => {
      setTicketDialog({ ...ticketDialog, open: false });
      if (routerNavigate) {
        routerNavigate(basePath);
      }
    };

    if (shouldShowModal) {
      setUnsavedChangesModal({
        open: true,
        onConfirm: () => {
          setUnsavedChangesModal({ open: false, onConfirm: null });
          closeAndNavigate();
        }
      });
    } else {
      closeAndNavigate();
    }
  };

  if (!ticketDialog.open) return null;

  return (
    <>
      <Dialog open={ticketDialog.open} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Edit Ticket'}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {ticketDialog.mode === 'edit' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleNavigateTicket('prev')}
                      disabled={!canGoPrev}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Previous ticket"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateTicket('next')}
                      disabled={!canGoNext}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next ticket"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700 mx-1" />
                  </>
                )}
                {formData.ticketId && (
                  <button
                    type="button"
                    onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${formData.ticketId}`, '_blank')}
                    className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                    title="Open in Intercom"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
            <div className="w-3/5 flex flex-col border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Agent <span className="text-red-600 dark:text-red-400">*</span></Label>
                    <select
                      value={formData.agent}
                      onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Agent</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Ticket ID <span className="text-red-600 dark:text-red-400">*</span></Label>
                    <Input
                      value={formData.ticketId}
                      onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                      placeholder="Enter ticket ID"
                      required
                      className="text-sm bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Date Entered</Label>
                    <DatePicker
                      value={formData.dateEntered}
                      onChange={(value) => setFormData({ ...formData, dateEntered: value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                  </Label>
                  <TicketRichTextEditor
                    value={formData.notes}
                    onChange={(html) => setFormData({ ...formData, notes: html })}
                    placeholder="Internal notes for yourself"
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none min-h-[140px]"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-neutral-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white dark:bg-neutral-900 text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Grading Information
                    </span>
                  </div>
                </div>

                {agentHasScorecard && (
                  <ScorecardEditor
                    agentPosition={agentPosition}
                    variant={formData.scorecardVariant}
                    onVariantChange={(variant) => {
                      setFormData({ ...formData, scorecardVariant: variant, scorecardValues: {} });
                    }}
                    values={formData.scorecardValues}
                    onChange={(values) => setFormData({ ...formData, scorecardValues: values })}
                    disabled={false}
                  />
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Status</Label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                    >
                      <option value="Selected">Selected</option>
                      <option value="Graded">Graded</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Quality Score (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.qualityScorePercent}
                      onChange={(e) => setFormData({ ...formData, qualityScorePercent: e.target.value })}
                      placeholder="0-100"
                      className="text-sm bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
                    />
                  </div>
                  <div ref={categoryDropdownRef} className="relative">
                    <Label className={`text-xs mb-1.5 block ${
                      formData.categories.length === 0 && rightPanelMode === 'related'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-neutral-400'
                    }`}>
                      Categories
                      {formData.categories.length === 0 && rightPanelMode === 'related' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <div
                      className={`flex flex-wrap items-center gap-1 px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-neutral-900 cursor-text min-h-[38px] ${
                        formData.categories.length === 0 && rightPanelMode === 'related'
                          ? 'border-2 border-red-400 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-500/20'
                          : 'border border-gray-200 dark:border-neutral-800'
                      } ${showCategoryDropdown ? 'ring-2 ring-gray-900 dark:ring-gray-300' : ''}`}
                      onClick={() => categoryInputRef.current?.focus()}
                    >
                      {formData.categories.map(cat => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
                            }}
                            className="hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <X className="w-3 h-3" />
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
                        placeholder={formData.categories.length === 0 ? "Search categories..." : ""}
                        className="flex-1 min-w-[100px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                      />
                    </div>
                    {showCategoryDropdown && (
                      <div
                        ref={categoryListRef}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat, index) => (
                            <button
                              key={cat}
                              type="button"
                              data-highlighted={categoryHighlightIndex === index}
                              onClick={() => {
                                setFormData({ ...formData, categories: [...formData.categories, cat] });
                                setCategorySearch('');
                                setCategoryHighlightIndex(0);
                                setTimeout(() => categoryInputRef.current?.focus(), 0);
                              }}
                              onMouseEnter={() => setCategoryHighlightIndex(index)}
                              className={`w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white transition-colors ${
                                categoryHighlightIndex === index
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              {cat}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-500">
                            {categorySearch ? 'No categories found' : 'All categories selected'}
                          </div>
                        )}
                      </div>
                    )}
                    {formData.categories.length === 0 && rightPanelMode === 'related' && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        This field must be filled for Related Tickets
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Feedback
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChooseMacroModal(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Hash className="w-3 h-3" />
                        Choose Macro
                      </button>
                      {formData.feedback && formData.feedback.trim() && (
                        <button
                          type="button"
                          onClick={() => setSaveAsMacroDialog({ open: true, feedback: formData.feedback })}
                          className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save as Macro
                        </button>
                      )}
                    </div>
                  </div>
                  <TicketRichTextEditor
                    value={formData.feedback}
                    onChange={(html) => setFormData({ ...formData, feedback: html })}
                    placeholder="Feedback to agent after grading (type # to insert macro)"
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none min-h-[140px]"
                    enableMacros={true}
                    onMacroSelect={(macro) => {
                      if (ticketDialog.data?._id) {
                        recordUsage(macro._id, ticketDialog.data._id, ticketDialog.data.ticketId);
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
                  <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="glass">
                    {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="w-2/5 flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />

              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('ai')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      rightPanelMode === 'ai'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Similar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('related')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      rightPanelMode === 'related'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Related
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative z-10">
                {rightPanelMode === 'ai' ? (
                  <SimilarFeedbacksPanel
                    notes={formData.notes}
                    ticketId={ticketDialog.data?._id}
                    categories={formData.categories || []}
                    onCopyFeedback={(feedback) => {
                      const currentFeedback = formData.feedback || '';
                      const separator = currentFeedback.trim() ? '\n\n' : '';
                      setFormData(prev => ({
                        ...prev,
                        feedback: currentFeedback + separator + feedback
                      }));
                    }}
                  />
                ) : (
                  <RelatedTicketsPanel
                    agentId={formData.agent}
                    categories={formData.categories}
                    currentTicketId={ticketDialog.data?._id}
                  />
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ChooseMacroModal
        open={showChooseMacroModal}
        onOpenChange={setShowChooseMacroModal}
        onSelectMacro={(macro) => {
          const currentFeedback = formData.feedback || '';
          const separator = currentFeedback.trim() ? '\n\n' : '';
          setFormData(prev => ({
            ...prev,
            feedback: currentFeedback + separator + macro.feedback
          }));
          if (ticketDialog.data?._id) {
            recordUsage(macro._id, ticketDialog.data._id, ticketDialog.data.ticketId);
          }
          setShowChooseMacroModal(false);
        }}
      />
    </>
  );
};

export default TicketDialog;
