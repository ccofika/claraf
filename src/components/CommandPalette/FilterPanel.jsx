import React, { useState } from 'react';
import {
  FileText,
  AlignLeft,
  Box,
  Lightbulb,
  Type,
  CreditCard,
  StickyNote,
  Package,
  Image as ImageIcon,
  Link as LinkIcon,
  Home,
  Calendar,
  X
} from 'lucide-react';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import FilterGroup from './FilterGroup';

const FilterPanel = ({ workspaces = [] }) => {
  const {
    activeFilters,
    toggleElementType,
    toggleWorkspace,
    setDateRange,
    clearAllFilters
  } = useCommandPalette();

  // Element type definitions
  const elementTypes = [
    { id: 'title', label: 'Title', icon: FileText },
    { id: 'description', label: 'Description', icon: AlignLeft },
    { id: 'macro', label: 'Macro', icon: Box },
    { id: 'example', label: 'Example', icon: Lightbulb },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'sticky-note', label: 'Sticky Note', icon: StickyNote },
    { id: 'wrapper', label: 'Wrapper', icon: Package },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'link', label: 'Link', icon: LinkIcon }
  ];

  // Date range presets
  const datePresets = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 days' },
    { id: 'month', label: 'Last 30 days' },
    { id: 'this-month', label: 'This month' }
  ];

  const [selectedDatePreset, setSelectedDatePreset] = useState(null);

  const handleDatePresetClick = (presetId) => {
    const now = new Date();
    let dateRange = null;

    switch (presetId) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateRange = { from: today.toISOString(), to: now.toISOString() };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateRange = { from: weekAgo.toISOString(), to: now.toISOString() };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateRange = { from: monthAgo.toISOString(), to: now.toISOString() };
        break;
      case 'this-month':
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        dateRange = { from: firstDay.toISOString(), to: now.toISOString() };
        break;
      default:
        break;
    }

    if (dateRange) {
      setDateRange(dateRange);
      setSelectedDatePreset(presetId);
    }
  };

  const handleClearDateFilter = () => {
    setDateRange(null);
    setSelectedDatePreset(null);
  };

  // Group workspaces
  const announcements = workspaces.find(w => w.type === 'announcements');
  const personalWorkspaces = workspaces.filter(w => w.type === 'personal');
  const sharedWorkspaces = workspaces.filter(w => w.type !== 'announcements' && w.type !== 'personal');

  const hasActiveFilters =
    activeFilters.elementTypes.length > 0 ||
    activeFilters.workspaceIds.length > 0 ||
    activeFilters.dateRange !== null;

  return (
    <div className="border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 max-h-[40vh] overflow-y-auto shrink-0">
      {/* Header with Clear All */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-neutral-900/50 border-b border-gray-200 dark:border-neutral-800 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
          Filters
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Element Types Filter */}
      <FilterGroup title="Element Types" defaultExpanded={true}>
        <div className="grid grid-cols-3 gap-1.5">
          {elementTypes.map(({ id, label, icon: Icon }) => {
            const isActive = activeFilters.elementTypes.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleElementType(id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Workspaces Filter */}
      <FilterGroup title="Workspaces" defaultExpanded={true}>
        <div className="space-y-2">
          {/* Announcements */}
          {announcements && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 dark:text-neutral-500 mb-2">
                System
              </div>
              <button
                onClick={() => toggleWorkspace(announcements._id)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeFilters.workspaceIds.includes(announcements._id)
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <Home size={14} />
                <span>{announcements.name}</span>
                {activeFilters.workspaceIds.includes(announcements._id) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                )}
              </button>
            </div>
          )}

          {/* Personal Workspaces */}
          {personalWorkspaces.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 dark:text-neutral-500 mb-2">
                Personal
              </div>
              <div className="space-y-1.5">
                {personalWorkspaces.map(workspace => {
                  const isActive = activeFilters.workspaceIds.includes(workspace._id);
                  return (
                    <button
                      key={workspace._id}
                      onClick={() => toggleWorkspace(workspace._id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                          : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                    >
                      <Home size={14} />
                      <span className="truncate">{workspace.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared Workspaces */}
          {sharedWorkspaces.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-neutral-500 mb-2">
                Shared
              </div>
              <div className="space-y-1.5">
                {sharedWorkspaces.map(workspace => {
                  const isActive = activeFilters.workspaceIds.includes(workspace._id);
                  return (
                    <button
                      key={workspace._id}
                      onClick={() => toggleWorkspace(workspace._id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                          : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <Home size={14} />
                      <span className="truncate">{workspace.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FilterGroup>

      {/* Date Range Filter */}
      <FilterGroup title="Date Range" defaultExpanded={true}>
        <div className="space-y-2">
          {/* Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            {datePresets.map(({ id, label }) => {
              const isActive = selectedDatePreset === id;
              return (
                <button
                  key={id}
                  onClick={() => handleDatePresetClick(id)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <Calendar size={14} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Clear Date Filter */}
          {activeFilters.dateRange && (
            <button
              onClick={handleClearDateFilter}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <X size={14} />
              <span>Clear date filter</span>
            </button>
          )}
        </div>
      </FilterGroup>
    </div>
  );
};

export default FilterPanel;
