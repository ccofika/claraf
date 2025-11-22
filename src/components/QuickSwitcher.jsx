import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Home, Star, Clock } from 'lucide-react';
import axios from 'axios';

const QuickSwitcher = ({ currentWorkspaceId }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState([]);
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Keyboard shortcut listener (Cmd/Ctrl + J)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+J (Mac) or Ctrl+J (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch workspaces when opened
  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setSearchQuery('');
      setSelectedIndex(0);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch all workspaces
      const workspacesRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkspaces(workspacesRes.data);

      // Fetch recent workspaces
      const recentRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/user/recent/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecentWorkspaces(recentRes.data);

      // Fetch favorite workspaces
      const favoritesRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/user/favorites/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavoriteWorkspaces(favoritesRes.data);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  // Fuzzy search workspaces
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) {
      return workspaces;
    }

    const query = searchQuery.toLowerCase();
    return workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(query)
    ).sort((a, b) => {
      // Prioritize workspaces that start with the query
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [workspaces, searchQuery]);

  // Group workspaces for display
  const workspaceGroups = useMemo(() => {
    const groups = [];

    if (!searchQuery.trim()) {
      // Show recent workspaces (excluding current)
      const recents = recentWorkspaces
        .filter(w => w._id !== currentWorkspaceId)
        .slice(0, 5);

      if (recents.length > 0) {
        groups.push({
          title: 'Recent',
          icon: <Clock size={14} />,
          workspaces: recents
        });
      }

      // Show favorite workspaces (excluding current)
      const favorites = favoriteWorkspaces
        .filter(w => w._id !== currentWorkspaceId);

      if (favorites.length > 0) {
        groups.push({
          title: 'Favorites',
          icon: <Star size={14} />,
          workspaces: favorites
        });
      }

      // Show all other workspaces
      const others = workspaces.filter(w =>
        w._id !== currentWorkspaceId &&
        !recents.some(r => r._id === w._id) &&
        !favorites.some(f => f._id === w._id)
      );

      if (others.length > 0) {
        groups.push({
          title: 'All Workspaces',
          icon: <Home size={14} />,
          workspaces: others
        });
      }
    } else {
      // Show filtered results
      const filtered = filteredWorkspaces.filter(w => w._id !== currentWorkspaceId);
      if (filtered.length > 0) {
        groups.push({
          title: 'Search Results',
          icon: <Search size={14} />,
          workspaces: filtered
        });
      }
    }

    return groups;
  }, [searchQuery, workspaces, recentWorkspaces, favoriteWorkspaces, filteredWorkspaces, currentWorkspaceId]);

  // Flatten workspaces for keyboard navigation
  const flatWorkspaces = useMemo(() => {
    return workspaceGroups.flatMap(group => group.workspaces);
  }, [workspaceGroups]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!flatWorkspaces.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < flatWorkspaces.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatWorkspaces.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatWorkspaces[selectedIndex]) {
          handleWorkspaceSelect(flatWorkspaces[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const handleWorkspaceSelect = (workspace) => {
    setIsOpen(false);
    navigate(`/workspace/${workspace._id}`);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl mx-4 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl animate-scaleIn overflow-hidden border border-gray-200 dark:border-neutral-800 flex flex-col max-h-[60vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <Search size={20} className="text-gray-400 dark:text-neutral-500 shrink-0" />

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Switch to workspace... (Cmd/Ctrl+J)"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 outline-none text-base"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              title="Clear search"
            >
              <X size={16} className="text-gray-400 dark:text-neutral-500" />
            </button>
          )}

          <div className="text-xs text-gray-400 dark:text-neutral-500 shrink-0">
            ESC
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          {flatWorkspaces.length === 0 && (
            <div className="py-12 px-4 text-center">
              <p className="text-gray-500 dark:text-neutral-400 text-sm">
                {searchQuery ? `No workspaces found for "${searchQuery}"` : 'No workspaces available'}
              </p>
            </div>
          )}

          {workspaceGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              {/* Group Header */}
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                {group.icon}
                {group.title}
              </div>

              {/* Workspace Items */}
              <div className="space-y-0.5">
                {group.workspaces.map((workspace) => {
                  const isSelected = currentIndex === selectedIndex;
                  const index = currentIndex++;

                  return (
                    <div
                      key={workspace._id}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <Home size={16} className="shrink-0 opacity-70" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{workspace.name}</div>
                        {workspace.type && (
                          <div className="text-xs text-gray-500 dark:text-neutral-400 capitalize">
                            {workspace.type === 'announcements' ? 'Announcements' : workspace.type}
                          </div>
                        )}
                      </div>
                      {favoriteWorkspaces.some(f => f._id === workspace._id) && (
                        <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-xs">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-xs">↵</kbd>
                Select
              </span>
            </div>
            {flatWorkspaces.length > 0 && (
              <span>{flatWorkspaces.length} workspace{flatWorkspaces.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSwitcher;
