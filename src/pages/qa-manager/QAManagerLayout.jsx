import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, FileText, UsersRound, TrendingUp, Target, Bug,
  Keyboard, RefreshCw, Search, AlertTriangle, Loader2, X, Check,
  RotateCcw, ClipboardList, ClipboardCheck, Edit, Hash, ChevronLeft, ChevronRight,
  MessageSquare, Users, Sparkles, ExternalLink, Trash2, Plus, Play,
  ChevronDown, Wand2, GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
// Tabs components replaced with custom sliding tabs implementation
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { QAManagerProvider, useQAManager } from '../../context/QAManagerContext';
import { duration, easing } from '../../utils/animations';
import QACommandPalette from '../../components/QACommandPalette';
import QAShortcutsModal from '../../components/QAShortcutsModal';
import ManageMacrosModal from '../../components/ManageMacrosModal';
import ChooseMacroModal from '../../components/ChooseMacroModal';
import SaveAsMacroModal from '../../components/SaveAsMacroModal';
import SendTicketModal from '../../components/SendTicketModal';
import BugReportButton from '../../components/BugReportButton';
import { TicketContentDisplay } from '../../components/TicketRichTextEditor';
import SimilarFeedbacksPanel from '../../components/SimilarFeedbacksPanel';
import RelatedTicketsPanel from '../../components/RelatedTicketsPanel';
import ScorecardEditor from '../../components/ScorecardEditor';
import { hasScorecard } from '../../data/scorecardConfig';
import { Button, StatusBadge, QualityScoreBadge, ReviewNotificationBanner } from './components';
import TicketDialog from './TicketDialog';

// Inner layout component that uses the context
const QAManagerLayoutInner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    getAuthHeaders,
    loading,
    filters,
    setFilters,
    pendingMacroTickets,
    // Dialogs
    manageMacrosDialog,
    setManageMacrosDialog,
    chooseMacroDialog,
    setChooseMacroDialog,
    saveAsMacroDialog,
    setSaveAsMacroDialog,
    sendMacroDialog,
    setSendMacroDialog,
    declineConfirmDialog,
    setDeclineConfirmDialog,
    unsavedChangesModal,
    setUnsavedChangesModal,
    assignmentsDialog,
    setAssignmentsDialog,
    assignments,
    assignmentsLoading,
    gradingAssignmentModal,
    setGradingAssignmentModal,
    handleConfirmGradingWithExistingAssignment,
    handleDeleteAssignmentFromModal,
    handleCreateAssignmentAndStartGrading,
    handleCloseGradingAssignmentModal,
    allExistingAgents,
    tickets,
    agents,
    // View/Delete Dialogs
    viewDialog,
    setViewDialog,
    deleteDialog,
    setDeleteDialog,
    // Ticket Dialog
    ticketDialog,
    setTicketDialog,
    ticketFormDataRef,
    originalFormDataRef,
    hasUnsavedChangesRef,
    // Functions
    handleSendMacroTicket,
    handleAcceptMacroTicket,
    handleDeclineMacroTicket,
    handleResetAssignment,
    handleCreateManualAssignment,
    openTicketDialog,
    fetchDashboardStats,
    fetchAgents,
    fetchTickets,
    handleExportSelectedTickets,
    handleDeleteAgent,
    handleDeleteTicket,
    handleCreateTicket,
    handleUpdateTicket,
    getCurrentTicketIndex,
    navigateToTicket,
    navigateWithUnsavedCheck,
  } = useQAManager();

  // Local state for modals and UI
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [generateDropdownOpen, setGenerateDropdownOpen] = useState(false);
  const [generateDropdownPosition, setGenerateDropdownPosition] = useState({ top: 0, left: 0 });
  const searchInputRef = useRef(null);
  const generateButtonRef = useRef(null);

  // Local state for create assignment form in Assignments dialog
  const [showCreateAssignmentForm, setShowCreateAssignmentForm] = useState(false);
  const [newAssignmentName, setNewAssignmentName] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Generate default assignment name for new assignments
  const generateDefaultAssignmentName = (agentName) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(now.getDate() - daysToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const formatDate = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
    return `${agentName} ${formatDate(monday)}-${formatDate(sunday)}`;
  };

  // Handle create assignment submission
  const handleSubmitCreateAssignment = async () => {
    if (!newAssignmentName.trim()) return;
    setCreatingAssignment(true);
    const success = await handleCreateManualAssignment(assignmentsDialog.agentId, newAssignmentName);
    setCreatingAssignment(false);
    if (success) {
      setShowCreateAssignmentForm(false);
      setNewAssignmentName('');
    }
  };

  // Reset create form when dialog closes
  const handleAssignmentsDialogClose = (open) => {
    setAssignmentsDialog({ ...assignmentsDialog, open });
    if (!open) {
      setShowCreateAssignmentForm(false);
      setNewAssignmentName('');
    }
  };

  // Get active tab from URL
  const getActiveTab = () => {
    const path = location.pathname.replace('/qa-manager', '').replace(/^\//, '');
    if (!path || path === '') return 'dashboard';
    return path.split('/')[0];
  };

  const activeTab = getActiveTab();

  // Handle tab change
  const handleTabChange = (tab) => {
    navigate(`/qa-manager/${tab}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                       document.activeElement?.isContentEditable;

      // Alt key shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            navigate('/qa-manager/dashboard');
            return;
          case '2':
            e.preventDefault();
            navigate('/qa-manager/agents');
            return;
          case '3':
            e.preventDefault();
            navigate('/qa-manager/tickets');
            return;
          case '4':
            e.preventDefault();
            navigate('/qa-manager/archive');
            return;
          case 't':
          case 'T':
            e.preventDefault();
            openTicketDialog('create');
            return;
          case 'e':
          case 'E':
            e.preventDefault();
            handleExportSelectedTickets();
            return;
          case 's':
          case 'S':
            e.preventDefault();
            setFilters(prev => ({
              ...prev,
              searchMode: prev.searchMode === 'ai' ? 'text' : 'ai'
            }));
            toast.success(`Switched to ${filters.searchMode === 'ai' ? 'Text' : 'AI'} search`);
            return;
          case 'k':
          case 'K':
            e.preventDefault();
            setShowCommandPalette(true);
            return;
        }
      }

      // Single key shortcuts (only when not typing)
      if (!isTyping && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case '?':
            e.preventDefault();
            setShowShortcutsModal(true);
            return;
          case '/':
            e.preventDefault();
            searchInputRef.current?.focus();
            return;
          case 'r':
          case 'R':
            e.preventDefault();
            if (activeTab === 'dashboard') fetchDashboardStats();
            else if (activeTab === 'agents') fetchAgents();
            else fetchTickets();
            toast.success('Refreshing data...');
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, filters.searchMode, navigate, openTicketDialog, handleExportSelectedTickets, setFilters, fetchDashboardStats, fetchAgents, fetchTickets]);

  // Check if user is admin or reviewer
  const isAdmin = ['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email);
  const isFilipAdmin = user?.email === 'filipkozomara@mebit.io';
  const { isReviewer, reviewPendingCount } = useQAManager();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.normal, ease: easing.smooth }}
      className="flex flex-col h-full"
    >
      {/* Header - Full Width: Title | Navigation | Quick Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex-shrink-0 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800"
      >
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          {/* Left: Title */}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">QA Manager</h1>

          {/* Center: Navigation Tabs with Sliding Glass Pill */}
          <div className="flex-1 flex justify-center items-center min-w-0 relative gap-1">
            {/* Left scroll button */}
            <button
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all opacity-0 pointer-events-none nav-scroll-left"
              onClick={() => {
                const nav = document.querySelector('.nav-tabs-container');
                if (nav) nav.scrollBy({ left: -200, behavior: 'smooth' });
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 relative">
              {/* Left fade */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-50 dark:from-neutral-950 to-transparent z-10 pointer-events-none opacity-0 transition-opacity nav-fade-left" />
              {/* Right fade */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-50 dark:from-neutral-950 to-transparent z-10 pointer-events-none opacity-0 transition-opacity nav-fade-right" />

              <nav
                className="nav-tabs-container relative flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-hide scroll-smooth"
                onScroll={(e) => {
                  const nav = e.currentTarget;
                  const container = nav.closest('.flex-1.min-w-0.relative');
                  const parent = container?.parentElement;
                  const leftFade = container?.querySelector('.nav-fade-left');
                  const rightFade = container?.querySelector('.nav-fade-right');
                  const leftBtn = parent?.querySelector('.nav-scroll-left');
                  const rightBtn = parent?.querySelector('.nav-scroll-right');
                  const canScrollLeft = nav.scrollLeft > 10;
                  const canScrollRight = nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 10;
                  if (leftFade) leftFade.style.opacity = canScrollLeft ? '1' : '0';
                  if (rightFade) rightFade.style.opacity = canScrollRight ? '1' : '0';
                  if (leftBtn) {
                    leftBtn.style.opacity = canScrollLeft ? '1' : '0';
                    leftBtn.style.pointerEvents = canScrollLeft ? 'auto' : 'none';
                  }
                  if (rightBtn) {
                    rightBtn.style.opacity = canScrollRight ? '1' : '0';
                    rightBtn.style.pointerEvents = canScrollRight ? 'auto' : 'none';
                  }
                }}
                ref={(el) => {
                  if (el) {
                    // Initial check for scroll indicators
                    setTimeout(() => {
                      const container = el.closest('.flex-1.min-w-0.relative');
                      const parent = container?.parentElement;
                      const rightFade = container?.querySelector('.nav-fade-right');
                      const rightBtn = parent?.querySelector('.nav-scroll-right');
                      const canScrollRight = el.scrollWidth > el.clientWidth;
                      if (rightFade && canScrollRight) rightFade.style.opacity = '1';
                      if (rightBtn && canScrollRight) {
                        rightBtn.style.opacity = '1';
                        rightBtn.style.pointerEvents = 'auto';
                      }
                    }, 100);
                  }
                }}
              >
              {(() => {
                const regularTabs = [
                  { value: 'dashboard', label: 'Dashboard' },
                  { value: 'agents', label: 'Agents' },
                  { value: 'tickets', label: 'Tickets' },
                  { value: 'archive', label: 'Archive' },
                  ...(isReviewer ? [{ value: 'review', label: 'Review', badge: reviewPendingCount > 0 ? reviewPendingCount : null }] : []),
                  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
                ];

                const generateSubTabs = [
                  { value: 'summaries', label: 'Summary', icon: FileText },
                  { value: 'coaching', label: 'Coaching', icon: GraduationCap },
                ];

                const adminTabs = [
                  ...(isAdmin ? [
                    { value: 'all-agents', label: 'All Agents', icon: UsersRound },
                    { value: 'statistics', label: 'Statistics', icon: TrendingUp },
                    { value: 'active-overview', label: 'Active Overview', icon: Target },
                  ] : []),
                  ...(isFilipAdmin ? [
                    { value: 'bugs', label: 'Bugs', icon: Bug },
                  ] : []),
                ];

                const isGenerateActive = activeTab === 'summaries' || activeTab === 'coaching';

                return (
                  <>
                    {regularTabs.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={`relative z-10 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 whitespace-nowrap ${
                          activeTab === tab.value
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300'
                        }`}
                      >
                        {tab.icon && <tab.icon className="w-4 h-4" />}
                        {tab.label}
                        {tab.badge && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                            {tab.badge}
                          </span>
                        )}
                        {activeTab === tab.value && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute inset-0 rounded-xl -z-10"
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 35,
                            }}
                          >
                            {/* Animated gradient border - Light theme */}
                            <div
                              className="absolute inset-0 rounded-xl dark:hidden"
                              style={{
                                padding: '1px',
                                background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.12) 100%)',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                animation: 'rotateGradient 4s ease-in-out infinite',
                              }}
                            />
                            {/* Animated gradient border - Dark theme */}
                            <div
                              className="absolute inset-0 rounded-xl hidden dark:block"
                              style={{
                                padding: '1px',
                                background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.2) 100%)',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                animation: 'rotateGradient 4s ease-in-out infinite',
                              }}
                            />
                            {/* Inner glass background - Light theme */}
                            <div
                              className="absolute inset-[1px] rounded-[11px] dark:hidden"
                              style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 50%, rgba(255,255,255,0.95) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
                              }}
                            />
                            {/* Inner glass background - Dark theme */}
                            <div
                              className="absolute inset-[1px] rounded-[11px] hidden dark:block"
                              style={{
                                background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)',
                              }}
                            />
                          </motion.div>
                        )}
                      </button>
                    ))}

                    {/* Generate Dropdown */}
                    <div
                      ref={generateButtonRef}
                      className="relative"
                      onMouseEnter={() => {
                        if (generateButtonRef.current) {
                          const rect = generateButtonRef.current.getBoundingClientRect();
                          setGenerateDropdownPosition({
                            top: rect.bottom + 4,
                            left: rect.left
                          });
                        }
                        setGenerateDropdownOpen(true);
                      }}
                      onMouseLeave={() => setGenerateDropdownOpen(false)}
                    >
                      <button
                        className={`relative z-10 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 whitespace-nowrap ${
                          isGenerateActive
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300'
                        }`}
                      >
                        <Wand2 className="w-4 h-4" />
                        Generate
                        <ChevronDown className={`w-3 h-3 transition-transform ${generateDropdownOpen ? 'rotate-180' : ''}`} />
                        {isGenerateActive && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute inset-0 rounded-xl -z-10"
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 35,
                            }}
                          >
                            <div
                              className="absolute inset-0 rounded-xl dark:hidden"
                              style={{
                                padding: '1px',
                                background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.12) 100%)',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                animation: 'rotateGradient 4s ease-in-out infinite',
                              }}
                            />
                            <div
                              className="absolute inset-0 rounded-xl hidden dark:block"
                              style={{
                                padding: '1px',
                                background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.2) 100%)',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                animation: 'rotateGradient 4s ease-in-out infinite',
                              }}
                            />
                            <div
                              className="absolute inset-[1px] rounded-[11px] dark:hidden"
                              style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 50%, rgba(255,255,255,0.95) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
                              }}
                            />
                            <div
                              className="absolute inset-[1px] rounded-[11px] hidden dark:block"
                              style={{
                                background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)',
                              }}
                            />
                          </motion.div>
                        )}
                      </button>

                      {/* Dropdown Menu - Rendered via Portal */}
                      {generateDropdownOpen && createPortal(
                        <div
                          className="fixed z-[100]"
                          style={{
                            top: generateDropdownPosition.top - 10,
                            left: generateDropdownPosition.left
                          }}
                          onMouseEnter={() => setGenerateDropdownOpen(true)}
                          onMouseLeave={() => setGenerateDropdownOpen(false)}
                        >
                          {/* Invisible bridge area to prevent gap issues */}
                          <div className="h-[10px]" />
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="py-1 min-w-[140px] bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700"
                          >
                            {generateSubTabs.map((subTab) => (
                              <button
                                key={subTab.value}
                                onClick={() => {
                                  handleTabChange(subTab.value);
                                  setGenerateDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                  activeTab === subTab.value
                                    ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <subTab.icon className="w-4 h-4" />
                                {subTab.label}
                              </button>
                            ))}
                          </motion.div>
                        </div>,
                        document.body
                      )}
                    </div>

                    {adminTabs.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => handleTabChange(tab.value)}
                        className={`relative z-10 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 whitespace-nowrap ${
                          activeTab === tab.value
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300'
                        }`}
                      >
                        {tab.icon && <tab.icon className="w-4 h-4" />}
                        {tab.label}
                        {activeTab === tab.value && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute inset-0 rounded-xl -z-10"
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 35,
                            }}
                          >
                            {/* Animated gradient border - Light theme */}
                            <div
                              className="absolute inset-0 rounded-xl dark:hidden"
                              style={{
                                padding: '1px',
                                background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.12) 100%)',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                animation: 'rotateGradient 4s ease-in-out infinite',
                              }}
                            />
                            {/* Animated gradient border - Dark theme */}
                            <div
                              className="absolute inset-0 rounded-xl hidden dark:block"
                              style={{
                                padding: '1px',
                                background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.2) 100%)',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude',
                                animation: 'rotateGradient 4s ease-in-out infinite',
                              }}
                            />
                            {/* Inner glass background - Light theme */}
                            <div
                              className="absolute inset-[1px] rounded-[11px] dark:hidden"
                              style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 50%, rgba(255,255,255,0.95) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
                              }}
                            />
                            {/* Inner glass background - Dark theme */}
                            <div
                              className="absolute inset-[1px] rounded-[11px] hidden dark:block"
                              style={{
                                background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)',
                              }}
                            />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </>
                );
              })()}
              </nav>
            </div>

            {/* Right scroll button */}
            <button
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all opacity-0 pointer-events-none nav-scroll-right"
              onClick={() => {
                const nav = document.querySelector('.nav-tabs-container');
                if (nav) nav.scrollBy({ left: 200, behavior: 'smooth' });
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* CSS for gradient animation and scrollbar hide */}
          <style>{`
            @keyframes rotateGradient {
              0% { --gradient-angle: 135deg; }
              25% { --gradient-angle: 225deg; }
              50% { --gradient-angle: 315deg; }
              75% { --gradient-angle: 45deg; }
              100% { --gradient-angle: 135deg; }
            }
            @property --gradient-angle {
              syntax: '<angle>';
              initial-value: 135deg;
              inherits: false;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Right: Quick Search */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-gray-300 dark:hover:border-neutral-700 transition-colors whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            <span>Quick Search</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 rounded">
              Alt+K
            </kbd>
          </motion.button>
        </div>
      </motion.div>

      {/* Pending Macro Tickets Banner */}
      {pendingMacroTickets.length > 0 && (
        <div className="flex-shrink-0 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900/50">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700 dark:text-orange-400">
                  You have {pendingMacroTickets.length} pending ticket{pendingMacroTickets.length !== 1 ? 's' : ''} from other graders
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pendingMacroTickets.slice(0, 2).map((macroTicket) => (
                  <div key={macroTicket._id} className="flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-lg px-3 py-1.5 border border-orange-200 dark:border-orange-900/50">
                    <span className="text-xs text-gray-600 dark:text-neutral-400">
                      {macroTicket.ticketId} from {macroTicket.sentBy?.name || macroTicket.sentBy?.email?.split('@')[0]}
                    </span>
                    <button
                      onClick={() => handleAcceptMacroTicket(macroTicket._id)}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                      title="Accept"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeclineConfirmDialog({ open: true, macroTicket })}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Decline"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {pendingMacroTickets.length > 2 && (
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    +{pendingMacroTickets.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: duration.normal, ease: easing.smooth }}
            >
              <ReviewNotificationBanner />
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Global Dialogs */}

      {/* Assignments Dialog */}
      <Dialog open={assignmentsDialog.open} onOpenChange={handleAssignmentsDialogClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white dark:bg-neutral-900">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-500" />
                Assignments - {assignmentsDialog.agentName}
              </div>
              {!showCreateAssignmentForm && !assignmentsLoading && (
                <Button
                  onClick={() => {
                    setNewAssignmentName(generateDefaultAssignmentName(assignmentsDialog.agentName));
                    setShowCreateAssignmentForm(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Assignment
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Create Assignment Form */}
          {showCreateAssignmentForm && (
            <div className="p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500" />
                Create New Assignment
              </h4>
              <p className="text-xs text-gray-600 dark:text-neutral-400 mb-3">
                Do you want to create an assignment where the extension will write grades on Maestro?
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Assignment Name
                  </label>
                  <p className="text-xs text-gray-500 dark:text-neutral-500 mb-2">
                    Must match the assignment name on MaestroQA exactly
                  </p>
                  <input
                    type="text"
                    value={newAssignmentName}
                    onChange={(e) => setNewAssignmentName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg
                             bg-white dark:bg-neutral-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Agent Name 1/20-1/26"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitCreateAssignment()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateAssignmentForm(false);
                      setNewAssignmentName('');
                    }}
                    className="text-gray-600 dark:text-neutral-400 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitCreateAssignment}
                    disabled={!newAssignmentName.trim() || creatingAssignment}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {creatingAssignment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Create Assignment
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : assignments.length === 0 && !showCreateAssignmentForm ? (
              <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No assignments found for this agent</p>
                <p className="text-xs mt-1 mb-4">Do you want to create an assignment where the extension will write grades on Maestro?</p>
                <Button
                  onClick={() => {
                    setNewAssignmentName(generateDefaultAssignmentName(assignmentsDialog.agentName));
                    setShowCreateAssignmentForm(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Assignment
                </Button>
              </div>
            ) : assignments.length === 0 && showCreateAssignmentForm ? null : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{assignment.assignmentName}</h4>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          Created: {new Date(assignment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          assignment.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : assignment.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300'
                        }`}>
                          {assignment.status === 'completed' ? 'Completed' : assignment.status === 'in_progress' ? 'In Progress' : 'Created'}
                        </span>
                        <button
                          onClick={() => handleResetAssignment(assignment._id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Reset assignment"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-neutral-400">Total Tickets:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{assignment.ticketIds?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-neutral-400">Graded:</span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">{assignment.gradedTicketIds?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-neutral-400">Pending:</span>
                        <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                          {(assignment.ticketIds?.length || 0) - (assignment.gradedTicketIds?.length || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grading Assignment Modal - Only shown when existing assignment found */}
      <Dialog open={gradingAssignmentModal.open} onOpenChange={(open) => !open && handleCloseGradingAssignmentModal()}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              Existing Assignment Found
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                An assignment already exists for <strong className="text-gray-900 dark:text-white">{gradingAssignmentModal.agentName}</strong>.
                Do you want to add grades to this assignment?
              </p>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-300">Assignment Name:</span>
                </div>
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 ml-6">
                  {gradingAssignmentModal.existingAssignment?.assignmentName}
                </p>
                <div className="mt-2 ml-6 text-xs text-purple-600 dark:text-purple-400">
                  {gradingAssignmentModal.existingAssignment?.gradedTicketIds?.length || 0} / {gradingAssignmentModal.existingAssignment?.ticketIds?.length || 0} tickets graded
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleCloseGradingAssignmentModal}
              className="text-gray-600 dark:text-neutral-400"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAssignmentFromModal}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              No, delete assignment
            </Button>
            <Button
              onClick={handleConfirmGradingWithExistingAssignment}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Yes, use this assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Macro Modals */}
      <ManageMacrosModal
        open={manageMacrosDialog.open}
        onOpenChange={(open) => setManageMacrosDialog({ open })}
        onViewTicket={async (ticketId) => {
          let ticket = tickets.find(t => t._id === ticketId || t.ticketId === ticketId);
          if (ticket) {
            setViewDialog({ open: true, ticket, source: 'tickets' });
          }
        }}
      />
      <ChooseMacroModal
        open={chooseMacroDialog.open}
        onOpenChange={(open) => setChooseMacroDialog({ ...chooseMacroDialog, open })}
        onSelectMacro={(macro) => {
          if (chooseMacroDialog.onSelect) {
            chooseMacroDialog.onSelect(macro);
          }
          setChooseMacroDialog({ open: false, onSelect: null });
        }}
      />
      <SaveAsMacroModal
        open={saveAsMacroDialog.open}
        onOpenChange={(open) => setSaveAsMacroDialog({ ...saveAsMacroDialog, open })}
        initialFeedback={saveAsMacroDialog.feedback}
        initialCategories={saveAsMacroDialog.categories}
        initialScorecardData={saveAsMacroDialog.scorecardData}
        agentPosition={saveAsMacroDialog.agentPosition}
        onSave={() => setSaveAsMacroDialog({ open: false, feedback: '', categories: [], scorecardData: {}, agentPosition: null })}
      />

      {/* Send Ticket Modal */}
      <SendTicketModal
        open={sendMacroDialog.open}
        onOpenChange={(open) => setSendMacroDialog({ open })}
        agents={allExistingAgents}
        onSubmit={handleSendMacroTicket}
      />

      {/* Decline Ticket Confirmation Modal */}
      <Dialog open={declineConfirmDialog.open} onOpenChange={(open) => !open && setDeclineConfirmDialog({ open: false, macroTicket: null })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Decline Ticket
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-neutral-400 py-2">
            Are you sure you want to decline this ticket? This action cannot be undone.
          </p>
          {declineConfirmDialog.macroTicket && (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 text-sm">
              <p><span className="text-gray-500 dark:text-neutral-400">Ticket ID:</span> {declineConfirmDialog.macroTicket.ticketId}</p>
              <p><span className="text-gray-500 dark:text-neutral-400">Agent:</span> {declineConfirmDialog.macroTicket.agent?.name}</p>
              <p><span className="text-gray-500 dark:text-neutral-400">From:</span> {declineConfirmDialog.macroTicket.sentBy?.name || declineConfirmDialog.macroTicket.sentBy?.email}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeclineConfirmDialog({ open: false, macroTicket: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeclineMacroTicket(declineConfirmDialog.macroTicket._id)}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Modal */}
      <Dialog open={unsavedChangesModal.open} onOpenChange={(open) => !open && setUnsavedChangesModal({ open: false, onConfirm: null })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Nesačuvane promene
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-neutral-400 py-2">
            Imate nesačuvane promene na ovom tiketu. Da li ste sigurni da želite da napustite bez čuvanja?
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setUnsavedChangesModal({ open: false, onConfirm: null })}
            >
              Otkaži
            </Button>
            <Button
              variant="glass"
              onClick={() => {
                if (unsavedChangesModal.onConfirm) {
                  unsavedChangesModal.onConfirm();
                }
              }}
            >
              Izađi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <QACommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTicketSelect={(ticket) => {
          openTicketDialog('edit', ticket);
          setShowCommandPalette(false);
        }}
        currentFilters={filters}
      />

      {/* Shortcuts Modal */}
      <QAShortcutsModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* View Ticket Dialog */}
      <ViewTicketDialog
        viewDialog={viewDialog}
        setViewDialog={setViewDialog}
        tickets={tickets}
        user={user}
        setSaveAsMacroDialog={setSaveAsMacroDialog}
        getCurrentTicketIndex={getCurrentTicketIndex}
        navigateToTicket={navigateToTicket}
        routerNavigate={navigate}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        handleDeleteAgent={handleDeleteAgent}
        handleDeleteTicket={handleDeleteTicket}
      />

      {/* Ticket Create/Edit Dialog */}
      <TicketDialog
        ticketDialog={ticketDialog}
        setTicketDialog={setTicketDialog}
        agents={ticketDialog.source === 'archive' ? allExistingAgents : agents}
        tickets={tickets}
        ticketFormDataRef={ticketFormDataRef}
        originalFormDataRef={originalFormDataRef}
        hasUnsavedChangesRef={hasUnsavedChangesRef}
        handleCreateTicket={handleCreateTicket}
        handleUpdateTicket={handleUpdateTicket}
        getCurrentTicketIndex={getCurrentTicketIndex}
        navigateWithUnsavedCheck={navigateWithUnsavedCheck}
        setUnsavedChangesModal={setUnsavedChangesModal}
        setSaveAsMacroDialog={setSaveAsMacroDialog}
        routerNavigate={navigate}
      />

      {/* Bug Report Floating Button */}
      <BugReportButton getAuthHeaders={getAuthHeaders} />
    </motion.div>
  );
};

// View Ticket Dialog Component
const ViewTicketDialog = ({
  viewDialog,
  setViewDialog,
  tickets,
  user,
  setSaveAsMacroDialog,
  getCurrentTicketIndex,
  navigateToTicket,
  routerNavigate
}) => {
  const [rightPanelMode, setRightPanelMode] = useState('ai');

  const ticket = viewDialog.ticket;
  // Determine the source page - default to 'tickets' if not specified
  const source = viewDialog.source || 'tickets';
  const basePath = source === 'archive' ? '/qa-manager/archive' : '/qa-manager/tickets';

  const currentIndex = ticket ? getCurrentTicketIndex(ticket._id) : -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < tickets.length - 1;

  // Close dialog and navigate back
  const handleClose = () => {
    setViewDialog({ open: false, ticket: null, source: null });
    routerNavigate(basePath);
  };

  // Navigate to edit
  const handleEditClick = () => {
    setViewDialog({ open: false, ticket: null, source: null });
    routerNavigate(`${basePath}/${ticket._id}/edit`);
  };

  // Navigate to ticket with URL update
  const handleNavigateTicket = (direction) => {
    const newTicket = navigateToTicket(direction, ticket._id, 'view');
    if (newTicket && routerNavigate) {
      routerNavigate(`${basePath}/${newTicket._id}`);
    }
  };

  useEffect(() => {
    if (!ticket) return;

    const handleKeyDown = (e) => {
      if (e.altKey) {
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
  }, [ticket?._id, canGoPrev, canGoNext, navigateToTicket, routerNavigate]);

  if (!ticket) return null;

  const adminEmails = ['filipkozomara@mebit.io', 'neven@mebit.io'];
  const isCreator = ticket.createdBy === user?._id || ticket.createdBy?._id === user?._id;
  const isAdmin = adminEmails.includes(user?.email);
  const canEdit = !ticket.isArchived || isCreator || isAdmin;

  return (
    <Dialog open={viewDialog.open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent hideCloseButton overlayClassName="z-[60]" className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col z-[60]">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
              Ticket Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {ticket.feedback && ticket.feedback.trim() && (
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => {
                    const agentPosition = ticket.agent?.position || null;
                    setSaveAsMacroDialog({
                      open: true,
                      feedback: ticket.feedback,
                      categories: ticket.categories || [],
                      scorecardData: agentPosition && ticket.scorecardValues && Object.keys(ticket.scorecardValues).length > 0
                        ? { [agentPosition]: { values: ticket.scorecardValues, variant: ticket.scorecardVariant || null } }
                        : {},
                      agentPosition
                    });
                  }}
                >
                  <Hash className="w-4 h-4 mr-1.5" />
                  Save as Macro
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="glass"
                  onClick={handleEditClick}
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit Ticket
                </Button>
              )}
              {ticket.ticketId && (
                <button
                  type="button"
                  onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${ticket.ticketId}`, '_blank')}
                  className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Open in Intercom"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNavigateTicket('prev')}
                  disabled={!canGoPrev}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous ticket"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavigateTicket('next')}
                  disabled={!canGoNext}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next ticket"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700" />
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - 60/40 Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDE - Ticket Information */}
          <div className="w-3/5 flex flex-col border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Section: Agent, Ticket ID, Date Entered */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Agent</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.agent?.name || ticket.agentName || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Ticket ID</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{ticket.ticketId}</p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Date Entered</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(ticket.dateEntered || ticket.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800 min-h-[120px]">
                  {ticket.notes ? (
                    <TicketContentDisplay
                      content={ticket.notes}
                      className="text-sm text-gray-700 dark:text-neutral-300"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-neutral-500 italic">No notes available</p>
                  )}
                </div>
              </div>

              {/* Divider */}
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

              {/* Scorecard Values (readonly) */}
              {ticket.agent?.position && hasScorecard(ticket.agent.position) && ticket.scorecardValues && Object.keys(ticket.scorecardValues).length > 0 && (
                <ScorecardEditor
                  agentPosition={ticket.agent.position}
                  variant={ticket.scorecardVariant}
                  onVariantChange={() => {}}
                  values={ticket.scorecardValues || {}}
                  onChange={() => {}}
                  disabled={true}
                />
              )}

              {/* Bottom Section: Status, Quality Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">Status</p>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">Quality Score</p>
                  <QualityScoreBadge score={ticket.qualityScorePercent} />
                </div>
              </div>

              {/* Feedback Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800 min-h-[120px]">
                  {ticket.feedback ? (
                    <TicketContentDisplay
                      content={ticket.feedback}
                      className="text-sm text-gray-700 dark:text-neutral-300"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-neutral-500 italic">No feedback available</p>
                  )}
                </div>
              </div>

              {/* Additional Metadata */}
              {((ticket.categories && ticket.categories.length > 0) || ticket.createdBy || (ticket.isArchived && ticket.archivedDate) || ticket.gradedDate) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                  {ticket.categories && ticket.categories.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {ticket.categories.map(cat => (
                          <span key={cat} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ticket.createdBy && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Created By</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {ticket.createdBy.name || ticket.createdBy.email}
                      </p>
                    </div>
                  )}
                  {ticket.gradedDate && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Graded Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(ticket.gradedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {ticket.isArchived && ticket.archivedDate && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Archived Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(ticket.archivedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - AI/Related Toggle Panel */}
          <div className="w-2/5 flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />

            {/* Toggle Header */}
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

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden relative z-10">
              {rightPanelMode === 'ai' ? (
                <SimilarFeedbacksPanel
                  notes={ticket.notes}
                  ticketId={ticket._id}
                  categories={ticket.categories || []}
                />
              ) : (
                <RelatedTicketsPanel
                  agentId={ticket.agent?._id || ticket.agent}
                  categories={ticket.categories || []}
                  currentTicketId={ticket._id}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog Component
const DeleteDialog = ({ deleteDialog, setDeleteDialog, handleDeleteAgent, handleDeleteTicket }) => {
  const handleDelete = () => {
    if (deleteDialog.type === 'agent') {
      handleDeleteAgent(deleteDialog.id);
    } else {
      handleDeleteTicket(deleteDialog.id);
    }
  };

  return (
    <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
      <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {deleteDialog.type === 'agent' ? 'Remove from Grading List' : 'Confirm Delete'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          {deleteDialog.type === 'agent' ? (
            <>
              Are you sure you want to remove <strong className="text-gray-900 dark:text-white">{deleteDialog.name}</strong> from your grading list?
              The agent and their tickets will remain in the system.
            </>
          ) : (
            <>
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteDialog.name}</strong>? This action cannot be undone.
            </>
          )}
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: '' })}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {deleteDialog.type === 'agent' ? 'Remove' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Wrapper component that provides the context
const QAManagerLayout = () => {
  return (
    <QAManagerProvider>
      <QAManagerLayoutInner />
    </QAManagerProvider>
  );
};

export default QAManagerLayout;
