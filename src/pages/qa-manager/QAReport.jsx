import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, Loader2, Plus, Trash2, Pencil, Play, ChevronLeft, ChevronRight,
  ArrowLeft, X, Tag, Users, UserRound, Globe, MessageSquare, Calendar,
  Filter, Copy, FileText, Ticket, Clock, ChevronDown, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useQAManager } from '../../context/QAManagerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DatePicker } from '../../components/ui/date-picker';
import { Button } from './components';
import ConversationPanel from '../../components/ConversationPanel';
import { staggerContainer, staggerItem } from '../../utils/animations';

const API_URL = process.env.REACT_APP_API_URL;

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================

const SearchableDropdown = ({ items, selected, onSelect, onRemove, placeholder, labelKey = 'name', idKey = 'id', multi = true }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown when focus leaves the container entirely
  const handleBlur = useCallback((e) => {
    requestAnimationFrame(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) {
        setOpen(false);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => (i[labelKey] || '').toLowerCase().includes(q));
  }, [items, search, labelKey]);

  const selectedIds = new Set((selected || []).map(s => s[idKey] || s));

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <div
        className="min-h-[36px] flex flex-wrap gap-1 items-center px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 cursor-text transition-colors"
        onClick={() => setOpen(true)}
      >
        {(selected || []).map(s => (
          <span key={s[idKey] || s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-xs text-gray-700 dark:text-white/80">
            {s[labelKey] || s}
            <X className="w-3 h-3 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); onRemove(s); }} />
          </span>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          placeholder={selected?.length ? '' : placeholder}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-900 dark:text-white/90 outline-none placeholder:text-gray-400 dark:placeholder:text-white/30"
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg dark:shadow-xl">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-white/40">No results</div>
          )}
          {filtered.slice(0, 100).map(item => {
            const isSelected = selectedIds.has(item[idKey]);
            return (
              <button
                key={item[idKey]}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 ${isSelected ? 'text-gray-400 dark:text-white/40' : 'text-gray-700 dark:text-white/80'}`}
                onClick={() => {
                  if (isSelected) {
                    onRemove(item);
                  } else {
                    onSelect(item);
                    if (!multi) setOpen(false);
                  }
                  setSearch('');
                }}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {item[labelKey]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// CHIP INPUT (for Topics — free text)
// ============================================

const ChipInput = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const addChip = () => {
    const val = input.trim();
    if (val && !values.includes(val)) {
      onChange([...values, val]);
    }
    setInput('');
  };

  return (
    <div className="min-h-[36px] flex flex-wrap gap-1 items-center px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 transition-colors">
      {values.map(v => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-xs text-gray-700 dark:text-white/80">
          {v}
          <X className="w-3 h-3 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => onChange(values.filter(x => x !== v))} />
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } if (e.key === ',' ) { e.preventDefault(); addChip(); } }}
        onBlur={addChip}
        placeholder={values.length ? '' : placeholder}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-900 dark:text-white/90 outline-none placeholder:text-gray-400 dark:placeholder:text-white/30"
      />
    </div>
  );
};

// ============================================
// OPERATOR TOGGLE (is / is_not)
// ============================================

const OperatorToggle = ({ value, onChange }) => (
  <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 text-xs">
    <button
      className={`px-2.5 py-1 transition-colors ${value === 'is' ? 'bg-gray-100 dark:bg-white/15 text-gray-900 dark:text-white' : 'bg-white dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'}`}
      onClick={() => onChange('is')}
    >
      is
    </button>
    <button
      className={`px-2.5 py-1 transition-colors ${value === 'is_not' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300' : 'bg-white dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'}`}
      onClick={() => onChange('is_not')}
    >
      is not
    </button>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const QAReport = () => {
  const { getAuthHeaders, agents, openTicketDialog } = useQAManager();

  // Views: 'templates' | 'drill-in'
  const [view, setView] = useState('templates');

  // Template state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editorName, setEditorName] = useState('');
  const [editorFilters, setEditorFilters] = useState({});
  const [saving, setSaving] = useState(false);

  // Reference data
  const [refData, setRefData] = useState({ admins: [], teams: [], tags: [] });
  const [loadingRefData, setLoadingRefData] = useState(false);

  // Report results (drill-in)
  const [reportResults, setReportResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [conversationMeta, setConversationMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState('');

  // Deleting state
  const [deletingId, setDeletingId] = useState(null);

  // ============================================
  // FETCH TEMPLATES
  // ============================================

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const { data } = await axios.get(`${API_URL}/api/qa/intercom-report/templates`, getAuthHeaders());
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ============================================
  // FETCH REFERENCE DATA
  // ============================================

  const fetchRefData = useCallback(async () => {
    if (refData.admins.length > 0) return; // Already loaded
    try {
      setLoadingRefData(true);
      const { data } = await axios.get(`${API_URL}/api/qa/intercom-report/reference-data`, getAuthHeaders());
      setRefData(data);
    } catch (err) {
      toast.error('Failed to load Intercom data');
    } finally {
      setLoadingRefData(false);
    }
  }, [getAuthHeaders, refData.admins.length]);

  // ============================================
  // TEMPLATE CRUD
  // ============================================

  const handleSaveTemplate = useCallback(async (andDrillIn = false) => {
    if (!editorName.trim()) {
      toast.error('Template name is required');
      return;
    }
    try {
      setSaving(true);
      let saved;
      if (editingTemplate) {
        const { data } = await axios.put(
          `${API_URL}/api/qa/intercom-report/templates/${editingTemplate._id}`,
          { name: editorName.trim(), filters: editorFilters },
          getAuthHeaders()
        );
        saved = data;
        setTemplates(prev => prev.map(t => t._id === saved._id ? saved : t));
        toast.success('Template updated');
      } else {
        const { data } = await axios.post(
          `${API_URL}/api/qa/intercom-report/templates`,
          { name: editorName.trim(), filters: editorFilters },
          getAuthHeaders()
        );
        saved = data;
        setTemplates(prev => [saved, ...prev]);
        toast.success('Template created');
      }
      setEditorOpen(false);
      if (andDrillIn) {
        executeReport(saved.filters, saved.name);
      }
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [editorName, editorFilters, editingTemplate, getAuthHeaders]);

  const handleDeleteTemplate = useCallback(async (id) => {
    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/api/qa/intercom-report/templates/${id}`, getAuthHeaders());
      setTemplates(prev => prev.filter(t => t._id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  }, [getAuthHeaders]);

  // ============================================
  // OPEN EDITOR
  // ============================================

  const openEditor = useCallback((template = null) => {
    fetchRefData();
    if (template) {
      setEditingTemplate(template);
      setEditorName(template.name);
      setEditorFilters(template.filters || {});
    } else {
      setEditingTemplate(null);
      setEditorName('');
      setEditorFilters({});
    }
    setEditorOpen(true);
  }, [fetchRefData]);

  // ============================================
  // EXECUTE REPORT
  // ============================================

  const executeReport = useCallback(async (filters, templateName, cursor = null) => {
    try {
      if (!cursor) {
        setExecuting(true);
        setReportResults([]);
        setCurrentIndex(0);
        setTotalCount(0);
        setActiveFilters(filters);
        setActiveTemplateName(templateName || 'Report');

        // Fast count call first (per_page: 1, just gets total)
        const countResp = await axios.post(
          `${API_URL}/api/qa/intercom-report/count`,
          { filters },
          getAuthHeaders()
        );
        setTotalCount(countResp.data.totalCount || 0);
      } else {
        setLoadingMore(true);
      }

      const { data } = await axios.post(
        `${API_URL}/api/qa/intercom-report/execute`,
        { filters, cursor },
        getAuthHeaders()
      );

      if (cursor) {
        setReportResults(prev => [...prev, ...data.conversations]);
      } else {
        setReportResults(data.conversations);
        setView('drill-in');
      }
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error('Execute report error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to execute report');
    } finally {
      setExecuting(false);
      setLoadingMore(false);
    }
  }, [getAuthHeaders]);

  // ============================================
  // FETCH CONVERSATION META
  // ============================================

  const fetchConversationMeta = useCallback(async (convId) => {
    try {
      setLoadingMeta(true);
      const { data } = await axios.get(
        `${API_URL}/api/qa/intercom-report/conversation/${convId}`,
        getAuthHeaders()
      );
      setConversationMeta(data);
    } catch (err) {
      setConversationMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  }, [getAuthHeaders]);

  // Fetch meta when currentIndex changes
  useEffect(() => {
    if (view === 'drill-in' && reportResults[currentIndex]) {
      fetchConversationMeta(reportResults[currentIndex].id);
    }
  }, [view, currentIndex, reportResults, fetchConversationMeta]);

  // Auto-load more when reaching end
  useEffect(() => {
    if (view === 'drill-in' && currentIndex >= reportResults.length - 3 && hasMore && !loadingMore && activeFilters) {
      executeReport(activeFilters, activeTemplateName, nextCursor);
    }
  }, [currentIndex, reportResults.length, hasMore, loadingMore, activeFilters, nextCursor, view, activeTemplateName, executeReport]);

  // ============================================
  // KEYBOARD NAV (drill-in)
  // ============================================

  useEffect(() => {
    if (view !== 'drill-in') return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && currentIndex < reportResults.length - 1) {
        setCurrentIndex(i => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(i => i - 1);
      } else if (e.key === 'Escape') {
        setView('templates');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentIndex, reportResults.length]);

  // ============================================
  // CREATE TICKET FROM DRILL-IN
  // ============================================

  const handleCreateTicket = useCallback(() => {
    const conv = reportResults[currentIndex];
    if (!conv) return;

    // Try matching Intercom admin to QA agent by name
    let matchedAgentId = null;
    if (conv.adminAssigneeId && refData.admins.length > 0) {
      const admin = refData.admins.find(a => a.id === String(conv.adminAssigneeId));
      if (admin) {
        const matched = agents.find(a => a.name.toLowerCase() === admin.name.toLowerCase());
        if (matched) matchedAgentId = matched._id;
      }
    }

    openTicketDialog('create', null, 'report', matchedAgentId, {
      ticketId: String(conv.id),
      dateEntered: new Date().toISOString().split('T')[0]
    });
  }, [reportResults, currentIndex, refData.admins, agents, openTicketDialog]);

  // ============================================
  // FILTER SUMMARY HELPER
  // ============================================

  const getFilterSummary = (filters) => {
    if (!filters) return 'No filters';
    const parts = [];
    if (filters.adminAssigneeIds?.length) parts.push(`${filters.adminAssigneeOperator === 'is_not' ? '!' : ''}Admins: ${filters.adminAssigneeIds.length}`);
    if (filters.teamAssigneeIds?.length) parts.push(`${filters.teamAssigneeOperator === 'is_not' ? '!' : ''}Teams: ${filters.teamAssigneeIds.length}`);
    if (filters.tagIds?.length) parts.push(`${filters.tagOperator === 'is_not' ? '!' : ''}Tags: ${filters.tagIds.length}`);
    if (filters.topics?.length) parts.push(`${filters.topicOperator === 'is_not' ? '!' : ''}Topics: ${filters.topics.length}`);
    if (filters.kycCountries?.length) parts.push(`${filters.kycCountryOperator === 'is_not' ? '!' : ''}Countries: ${filters.kycCountries.length}`);
    if (filters.dateFrom || filters.dateTo) parts.push('Date range');
    if (filters.state) parts.push(`State: ${filters.state}`);
    return parts.length ? parts.join(' · ') : 'No filters';
  };

  // ============================================
  // UPDATE FILTER HELPER
  // ============================================

  const updateFilter = useCallback((key, value) => {
    setEditorFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // ============================================
  // RENDER: TEMPLATES VIEW
  // ============================================

  if (view === 'templates') {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-8 lg:px-12 py-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Templates</h2>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">Create Intercom search templates and browse matching conversations</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm font-medium text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {/* Template List */}
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 dark:text-white/40" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-white/40">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No templates yet</p>
            <button onClick={() => openEditor()} className="mt-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
              Create your first template
            </button>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3">
            {templates.map(template => (
              <motion.div
                key={template._id}
                variants={staggerItem}
                className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">{template.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/35 mt-1 truncate">{getFilterSummary(template.filters)}</p>
                  <p className="text-xs text-gray-400 dark:text-white/25 mt-0.5">
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditor(template)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    disabled={deletingId === template._id}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    {deletingId === template._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      fetchRefData();
                      executeReport(template.filters, template.name);
                    }}
                    disabled={executing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Execute & Drill In"
                  >
                    {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Drill In
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* TEMPLATE EDITOR DIALOG */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-900 border-gray-200 dark:border-white/10">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">Template Name</label>
                <input
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  placeholder="e.g. GordanR Weekly Review"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 text-sm text-gray-900 dark:text-white/90 outline-none focus:border-gray-300 dark:focus:border-white/20 placeholder:text-gray-400 dark:placeholder:text-white/25"
                />
              </div>

              {loadingRefData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-white/40" />
                  <span className="ml-2 text-sm text-gray-400 dark:text-white/40">Loading Intercom data...</span>
                </div>
              ) : (
                <>
                  {/* Teammate replied to */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <UserRound className="w-3.5 h-3.5" /> Teammate
                      </label>
                      <OperatorToggle
                        value={editorFilters.adminAssigneeOperator || 'is'}
                        onChange={(v) => updateFilter('adminAssigneeOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={refData.admins}
                      selected={editorFilters.adminAssigneeIds || []}
                      onSelect={(item) => updateFilter('adminAssigneeIds', [...(editorFilters.adminAssigneeIds || []), { id: item.id, name: item.name }])}
                      onRemove={(item) => updateFilter('adminAssigneeIds', (editorFilters.adminAssigneeIds || []).filter(a => a.id !== item.id))}
                      placeholder="Search teammates..."
                    />
                  </div>

                  {/* Topics */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Topics
                      </label>
                      <OperatorToggle
                        value={editorFilters.topicOperator || 'is'}
                        onChange={(v) => updateFilter('topicOperator', v)}
                      />
                    </div>
                    <ChipInput
                      values={editorFilters.topics || []}
                      onChange={(v) => updateFilter('topics', v)}
                      placeholder="Type topic and press Enter..."
                    />
                  </div>

                  {/* Conversation Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> Conversation Tags
                      </label>
                      <OperatorToggle
                        value={editorFilters.tagOperator || 'is'}
                        onChange={(v) => updateFilter('tagOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={refData.tags}
                      selected={editorFilters.tagIds || []}
                      onSelect={(item) => updateFilter('tagIds', [...(editorFilters.tagIds || []), { id: item.id, name: item.name }])}
                      onRemove={(item) => updateFilter('tagIds', (editorFilters.tagIds || []).filter(t => t.id !== item.id))}
                      placeholder="Search tags..."
                    />
                  </div>

                  {/* KYC Country */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> KYC Country
                      </label>
                      <OperatorToggle
                        value={editorFilters.kycCountryOperator || 'is'}
                        onChange={(v) => updateFilter('kycCountryOperator', v)}
                      />
                    </div>
                    <ChipInput
                      values={editorFilters.kycCountries || []}
                      onChange={(v) => updateFilter('kycCountries', v)}
                      placeholder="Country codes (e.g. IN, NG)..."
                    />
                  </div>

                  {/* Team */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Team
                      </label>
                      <OperatorToggle
                        value={editorFilters.teamAssigneeOperator || 'is'}
                        onChange={(v) => updateFilter('teamAssigneeOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={refData.teams}
                      selected={editorFilters.teamAssigneeIds || []}
                      onSelect={(item) => updateFilter('teamAssigneeIds', [...(editorFilters.teamAssigneeIds || []), { id: item.id, name: item.name }])}
                      onRemove={(item) => updateFilter('teamAssigneeIds', (editorFilters.teamAssigneeIds || []).filter(t => t.id !== item.id))}
                      placeholder="Search teams..."
                    />
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <DatePicker
                          value={editorFilters.dateFrom || ''}
                          onChange={(d) => updateFilter('dateFrom', d || null)}
                          placeholder="From"
                          disablePortal
                        />
                      </div>
                      <span className="text-gray-400 dark:text-white/30 text-xs">to</span>
                      <div className="flex-1">
                        <DatePicker
                          value={editorFilters.dateTo || ''}
                          onChange={(d) => updateFilter('dateTo', d || null)}
                          placeholder="To"
                          disablePortal
                        />
                      </div>
                    </div>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">State</label>
                    <select
                      value={editorFilters.state || ''}
                      onChange={(e) => updateFilter('state', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 text-sm text-gray-900 dark:text-white/90 outline-none"
                    >
                      <option value="">Any</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="snoozed">Snoozed</option>
                    </select>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveTemplate(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
                <button
                  onClick={() => handleSaveTemplate(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3.5 h-3.5" /> Save & Drill In</>}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================
  // RENDER: DRILL-IN VIEW
  // ============================================

  const currentConv = reportResults[currentIndex];

  const navControls = (
    <>
      <button
        onClick={() => setView('templates')}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        title="Back to templates"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>
      <span className="mx-0.5 h-3 w-px bg-gray-200 dark:bg-neutral-700" />
      <span className="text-[9px] text-gray-400 dark:text-neutral-600 truncate max-w-[80px]" title={activeTemplateName}>
        {activeTemplateName}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-neutral-500 tabular-nums px-0.5 ml-auto">
        {reportResults.length > 0 ? `${currentIndex + 1}/${totalCount}` : '0'}
      </span>
      <button
        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
        disabled={currentIndex === 0}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setCurrentIndex(i => Math.min(reportResults.length - 1, i + 1))}
        disabled={currentIndex >= reportResults.length - 1}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      {executing ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-white/20" />
        </div>
      ) : reportResults.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-gray-400 dark:text-white/25">No conversations match</p>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* LEFT 30% — Chat */}
          <div className="w-[30%] min-w-[320px] border-r border-gray-200 dark:border-white/[0.04] overflow-y-auto">
            {currentConv && (
              <ConversationPanel key={currentConv.id} ticketId={currentConv.id} headerExtra={navControls} />
            )}
          </div>

          {/* RIGHT 70% — Metadata strip + ACP area + Create Ticket */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Metadata strip — ultra-compact */}
            {currentConv && (() => {
              const stateVal = conversationMeta?.state || currentConv.state;
              return (
                <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02]">
                  {/* Row 1: Key identifiers */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => { navigator.clipboard.writeText(currentConv.id); toast.success('Copied'); }}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                      title="Copy conversation ID"
                    >
                      <span className="text-gray-300 dark:text-white/20">#</span>{currentConv.id}
                      <Copy className="w-2.5 h-2.5" />
                    </button>

                    {(conversationMeta?.contactExternalId || currentConv.contactExternalId) && (
                      <span className="text-[10px] font-mono text-gray-400 dark:text-white/30" title="Contact External ID">
                        <span className="text-gray-300 dark:text-white/15">ext:</span> {conversationMeta?.contactExternalId || currentConv.contactExternalId}
                      </span>
                    )}

                    {conversationMeta?.kycCountry && (
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400/70 bg-amber-50 dark:bg-amber-400/[0.08] px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-400/10" title="KYC Country">
                        {conversationMeta.kycCountry}
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1 text-[10px] capitalize px-1.5 py-0.5 rounded border ${
                      stateVal === 'open'
                        ? 'text-emerald-700 dark:text-emerald-400/70 bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-200/60 dark:border-emerald-500/10'
                        : stateVal === 'snoozed'
                        ? 'text-amber-700 dark:text-amber-400/70 bg-amber-50 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/10'
                        : 'text-gray-500 dark:text-white/30 bg-gray-100 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.05]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        stateVal === 'open' ? 'bg-emerald-500' :
                        stateVal === 'snoozed' ? 'bg-amber-400' :
                        'bg-gray-400 dark:bg-neutral-500'
                      }`} />
                      {stateVal}
                    </span>

                    {(conversationMeta?.aiTitle || currentConv.aiTitle) && (
                      <span className="text-[10px] text-gray-500 dark:text-white/40 truncate max-w-[300px] italic" title={conversationMeta?.aiTitle || currentConv.aiTitle}>
                        {conversationMeta?.aiTitle || currentConv.aiTitle}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Topics + Tags as inline chips */}
                  {((conversationMeta?.topics || currentConv.topics)?.length > 0 || (conversationMeta?.tags || currentConv.tags)?.length > 0) && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {(conversationMeta?.topics || currentConv.topics || []).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 dark:bg-blue-500/[0.08] text-blue-600 dark:text-blue-300/70 border border-blue-100 dark:border-blue-500/[0.08]">
                          {t}
                        </span>
                      ))}
                      {(conversationMeta?.tags || currentConv.tags || []).map(t => (
                        <span key={t.id || t} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 border border-gray-200 dark:border-white/[0.05]">
                          {t.name || t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ACP Data Area — fills all remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="h-full rounded-lg border border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-center bg-gray-50/30 dark:bg-transparent">
                <span className="text-[11px] text-gray-300 dark:text-white/15 select-none tracking-widest uppercase">ACP</span>
              </div>
            </div>

            {/* Create Ticket — pinned bottom */}
            <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.04]">
              <button
                onClick={handleCreateTicket}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-all shadow-sm hover:shadow"
              >
                <Ticket className="w-3.5 h-3.5" /> Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAReport;
