import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  FolderOpen,
  Check,
  ArrowLeft,
  Sparkles,
  // Crypto & Finance
  Bitcoin, Wallet, Coins, Landmark, CreditCard, Banknote, CircleDollarSign, PiggyBank, Receipt, TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, ArrowUpDown, ArrowRightLeft, DollarSign, Euro, PoundSterling, BadgeDollarSign, HandCoins,
  // Rewards & Achievements
  Gift, Award, Trophy, Star, Medal, Crown, Gem, Target, Zap, PartyPopper, Cake, Heart, ThumbsUp, Flame,
  // Security & Verification
  Shield, ShieldCheck, ShieldAlert, Lock, Unlock, Key, KeyRound, Fingerprint, Eye, EyeOff, ScanFace, BadgeCheck, CircleCheck, CheckCircle2, UserCheck, FileCheck, ClipboardCheck,
  // Documents & Files
  File, FileText, Files, Folder, FolderClosed, Archive, FileBox, ClipboardList, ScrollText, Newspaper, BookOpen, Book, Library, FileSignature, FileBadge,
  // Communication
  MessageSquare, MessageCircle, Mail, MailOpen, Send, Inbox, AtSign, Phone, PhoneCall, Video, Headphones, Mic, Radio, Bell, BellRing, Megaphone,
  // Users & People
  User, Users, UserPlus, UserMinus, UserCog, UserCircle, Contact, UsersRound, CircleUser, PersonStanding, Baby, Accessibility,
  // Time & Scheduling
  Clock, Timer, TimerOff, Hourglass, Calendar, CalendarDays, CalendarCheck, CalendarClock, AlarmClock, Watch, History, RotateCcw,
  // Status & Alerts
  AlertTriangle, AlertCircle, AlertOctagon, Info, HelpCircle, Ban, XCircle, CheckCircle, CircleDot, Circle, Loader, RefreshCw, RefreshCcw,
  // Navigation & UI
  Home, Settings, Cog, Sliders, SlidersHorizontal, Menu, MoreHorizontal, MoreVertical, Grid, List, LayoutGrid, LayoutList, Columns, Rows, Table,
  // Actions
  Minus, Edit, Edit2, Edit3, Pencil, PenTool, Trash, Trash2, Copy, Clipboard, Download, Upload, Share, Share2, ExternalLink, Link, Link2, Unlink,
  // Arrows & Direction
  ArrowUp, ArrowDown, ChevronUp, ChevronsUp, ChevronsDown, MoveUp, MoveDown,
  // Media
  Image, Images, Camera, Film, Play, Pause, Square, Volume2, VolumeX, Music, Mic2,
  // Tags & Labels
  Tag, Tags, Bookmark, BookmarkCheck, Flag, Hash, Asterisk,
  // Tools & Work
  Wrench, Hammer, Paintbrush, Scissors, Ruler, Compass, Calculator, Terminal, Code, CodeXml, Bug, Puzzle, Lightbulb,
  // Nature & Weather
  Sun, Moon, Cloud, CloudRain, Snowflake, Wind, Leaf, Flower2, Mountain, Waves,
  // Objects
  Box, Package, Briefcase, ShoppingBag, ShoppingCart, Store, Building, Building2, Factory, Warehouse, Car, Plane, Ship, Truck,
  // Gaming & Fun
  Gamepad2, Dice5, Ghost, Skull, Bomb, Rocket, Swords, ShieldQuestion,
  // Misc
  Globe, Map, MapPin, Navigation, Anchor, Wifi, Signal, Battery, Power, Plug, Cpu, HardDrive, Database, Server, CloudUpload, CloudDownload
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import CategoryIconPicker from './CategoryIconPicker';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * CategoryPicker - A comprehensive category selection and creation component
 * Features:
 * - Hierarchical category browsing
 * - Category search
 * - Quick category creation
 * - Icon and color selection
 * - Breadcrumb navigation
 */
const CategoryPicker = ({
  isOpen,
  onClose,
  onSelect,
  currentCategoryId = null,
  elementId = null,
  position = 'modal' // 'modal' | 'dropdown'
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null); // null = root
  const [mode, setMode] = useState('browse'); // 'browse' | 'create' | 'search' | 'edit'

  // Create mode state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('folder');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [createUnderCategory, setCreateUnderCategory] = useState(null);
  const [creating, setCreating] = useState(false);

  // Edit mode state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryIcon, setEditCategoryIcon] = useState('folder');
  const [editCategoryColor, setEditCategoryColor] = useState('#6366f1');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Fetch categories tree
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search categories
  const searchCategories = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setMode('browse');
      return;
    }

    setIsSearching(true);
    setMode('search');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/categories/search`, {
        params: { query, limit: 20 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching categories:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      searchCategories(query);
    }, 300);
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/categories`,
        {
          name: newCategoryName.trim(),
          parent: createUnderCategory?._id || null,
          icon: newCategoryIcon,
          color: newCategoryColor,
          description: newCategoryDescription.trim() || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh categories
      await fetchCategories();

      // Auto-select the new category
      setSelectedCategory(response.data);

      // Reset create form
      setNewCategoryName('');
      setNewCategoryIcon('folder');
      setNewCategoryColor('#6366f1');
      setNewCategoryDescription('');
      setCreateUnderCategory(null);
      setMode('browse');
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  // Start editing a category
  const startEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryIcon(category.icon || 'folder');
    setEditCategoryColor(category.color || '#6366f1');
    setEditCategoryDescription(category.description || '');
    setMode('edit');
  };

  // Save edited category
  const handleSaveCategory = async () => {
    if (!editCategoryName.trim() || !editingCategory) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/categories/${editingCategory._id}`,
        {
          name: editCategoryName.trim(),
          icon: editCategoryIcon,
          color: editCategoryColor,
          description: editCategoryDescription.trim() || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh categories
      await fetchCategories();

      // Reset edit form
      setEditingCategory(null);
      setMode('browse');
    } catch (error) {
      console.error('Error updating category:', error);
      alert(error.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!editingCategory) return;

    if (!window.confirm(`Are you sure you want to delete "${editingCategory.name}"? This will also delete all subcategories.`)) {
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/categories/${editingCategory._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh categories
      await fetchCategories();

      // Reset
      setEditingCategory(null);
      setSelectedCategory(null);
      setMode('browse');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle category expansion
  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Navigate into a category level
  const navigateToCategory = (category) => {
    setBreadcrumbs(prev => [...prev, category]);
    setCurrentLevel(category);
  };

  // Navigate back via breadcrumb
  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentLevel(null);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentLevel(newBreadcrumbs[newBreadcrumbs.length - 1]);
    }
  };

  // Handle category selection
  const handleSelect = async (category) => {
    setSelectedCategory(category);

    // If elementId is provided, assign category to element
    if (elementId && category) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_URL}/api/categories/assign`,
          { elementId, categoryId: category._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Error assigning category:', error);
      }
    }

    onSelect?.(category);
    onClose?.();
  };

  // Remove category from element
  const handleRemoveCategory = async () => {
    if (elementId) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_URL}/api/categories/assign`,
          { elementId, categoryId: null },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Error removing category:', error);
      }
    }

    setSelectedCategory(null);
    onSelect?.(null);
    onClose?.();
  };

  // Get current level categories
  const getCurrentCategories = () => {
    if (mode === 'search') {
      return searchResults;
    }

    if (!currentLevel) {
      return categories;
    }

    return currentLevel.children || [];
  };

  // Initialize
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSearchQuery('');
      setMode('browse');
      setBreadcrumbs([]);
      setCurrentLevel(null);
    }
  }, [isOpen, fetchCategories]);

  // Find and set selected category from currentCategoryId
  useEffect(() => {
    if (currentCategoryId && categories.length > 0) {
      const findCategory = (cats, id) => {
        for (const cat of cats) {
          if (cat._id === id) return cat;
          if (cat.children) {
            const found = findCategory(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findCategory(categories, currentCategoryId);
      if (found) setSelectedCategory(found);
    }
  }, [currentCategoryId, categories]);

  if (!isOpen) return null;

  const currentCategories = getCurrentCategories();

  // Color presets
  const colorPresets = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#78716c', '#71717a', '#64748b'
  ];

  const renderCategoryItem = (category, isSearchResult = false, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category._id);
    const isSelected = selectedCategory?._id === category._id;

    return (
      <div key={category._id} className="relative group">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
            transition-all duration-150
            ${isSelected
              ? isDarkMode
                ? 'bg-blue-600/30 border border-blue-500/50'
                : 'bg-blue-100 border border-blue-300'
              : isDarkMode
                ? 'hover:bg-white/5'
                : 'hover:bg-gray-100'
            }
          `}
          onClick={() => handleSelect(category)}
        >
          {/* Expand/Collapse for tree view */}
          {!isSearchResult && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category._id);
              }}
              className={`p-0.5 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
            </button>
          )}

          {/* Spacer if no children */}
          {!isSearchResult && !hasChildren && <div className="w-5" />}

          {/* Icon */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            <CategoryIcon name={category.icon} size={14} />
          </div>

          {/* Name */}
          <span className={`flex-1 text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {category.name}
          </span>

          {/* Path for search results */}
          {isSearchResult && category.fullPath && category.fullPath.length > 1 && (
            <span className="text-xs text-gray-500 truncate max-w-[150px]">
              {category.fullPath.slice(0, -1).join(' / ')}
            </span>
          )}

          {/* Edit button - shows on hover */}
          {!isSearchResult && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditCategory(category);
              }}
              className={`
                p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}
              `}
              title={`Edit ${category.name}`}
            >
              <Pencil size={14} />
            </button>
          )}

          {/* Add subcategory button - shows on hover */}
          {!isSearchResult && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCreateUnderCategory(category);
                setMode('create');
              }}
              className={`
                p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}
              `}
              title={`Add subcategory to ${category.name}`}
            >
              <Plus size={14} />
            </button>
          )}

          {/* Navigate into button */}
          {hasChildren && !isSearchResult && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToCategory(category);
              }}
              className={`p-1 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
              title="View subcategories"
            >
              <ChevronRight size={14} />
            </button>
          )}

          {/* Selected indicator */}
          {isSelected && (
            <Check size={16} className="text-blue-500 flex-shrink-0" />
          )}
        </div>

        {/* Expanded children */}
        {!isSearchResult && isExpanded && hasChildren && (
          <div className="ml-6 mt-1 space-y-1">
            {category.children.map(child => renderCategoryItem(child))}
          </div>
        )}
      </div>
    );
  };

  // Use Portal to render outside parent DOM hierarchy (fixes issues with parent transforms)
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-lg max-h-[80vh] rounded-xl shadow-2xl overflow-hidden
        ${isDarkMode ? 'bg-neutral-900 border border-white/10' : 'bg-white border border-gray-200'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between px-4 py-3 border-b
          ${isDarkMode ? 'border-white/10' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'create' ? 'Create Category' : mode === 'edit' ? 'Edit Category' : 'Select Category'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        {mode !== 'create' && mode !== 'edit' && (
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}
            `}>
              <Search size={16} className="text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search categories..."
                className={`
                  flex-1 bg-transparent outline-none text-sm
                  ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
                `}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setMode('browse');
                  }}
                  className="p-0.5 rounded hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        {mode === 'browse' && breadcrumbs.length > 0 && (
          <div className={`
            flex items-center gap-1 px-4 py-2 overflow-x-auto
            ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}
          `}>
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}
              `}
            >
              <ArrowLeft size={12} />
              Root
            </button>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb._id}>
                <ChevronRight size={12} className="text-gray-400" />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`
                    px-2 py-1 rounded text-xs font-medium truncate max-w-[100px]
                    ${index === breadcrumbs.length - 1
                      ? isDarkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                      : isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                    }
                  `}
                  title={crumb.name}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[400px]">
          {mode === 'create' ? (
            /* Create Category Form */
            <div className="p-4 space-y-4">
              {/* Creating under indicator */}
              {createUnderCategory && (
                <div className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}
                `}>
                  <span className="text-xs text-gray-500">Creating under:</span>
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${createUnderCategory.color}20`, color: createUnderCategory.color }}
                  >
                    <CategoryIcon name={createUnderCategory.icon} size={12} />
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {createUnderCategory.name}
                  </span>
                  <button
                    onClick={() => setCreateUnderCategory(null)}
                    className="ml-auto p-0.5 rounded hover:bg-white/10"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Name input */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Crypto Deposits"
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                  autoFocus
                />
              </div>

              {/* Icon and Color */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Icon
                  </label>
                  <button
                    onClick={() => setShowIconPicker(true)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg border
                      ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${newCategoryColor}20`, color: newCategoryColor }}
                    >
                      <CategoryIcon name={newCategoryIcon} size={14} />
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Change icon
                    </span>
                  </button>
                </div>

                {/* Color */}
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {colorPresets.slice(0, 10).map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={`
                          w-6 h-6 rounded-md transition-all
                          ${newCategoryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                          ${isDarkMode ? 'ring-offset-neutral-900' : 'ring-offset-white'}
                        `}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (optional)
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={2}
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm resize-none
                    ${isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                />
              </div>

              {/* Create button */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setMode('browse')}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    ${isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                  `}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || creating}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-blue-600 hover:bg-blue-700 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : mode === 'edit' && editingCategory ? (
            /* Edit Category Form */
            <div className="p-4 space-y-4">
              {/* Editing indicator */}
              <div className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}
              `}>
                <span className="text-xs text-gray-500">Editing:</span>
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${editCategoryColor}20`, color: editCategoryColor }}
                >
                  <CategoryIcon name={editCategoryIcon} size={12} />
                </div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingCategory.name}
                </span>
              </div>

              {/* Name input */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="e.g., Crypto Deposits"
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm
                    ${isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                  autoFocus
                />
              </div>

              {/* Icon and Color */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Icon
                  </label>
                  <button
                    onClick={() => setShowIconPicker(true)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg border
                      ${isDarkMode
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${editCategoryColor}20`, color: editCategoryColor }}
                    >
                      <CategoryIcon name={editCategoryIcon} size={14} />
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Change icon
                    </span>
                  </button>
                </div>

                {/* Color */}
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {colorPresets.slice(0, 10).map(color => (
                      <button
                        key={color}
                        onClick={() => setEditCategoryColor(color)}
                        className={`
                          w-6 h-6 rounded-md transition-all
                          ${editCategoryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                          ${isDarkMode ? 'ring-offset-neutral-900' : 'ring-offset-white'}
                        `}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (optional)
                </label>
                <textarea
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={2}
                  className={`
                    w-full px-3 py-2 rounded-lg border text-sm resize-none
                    ${isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  `}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setMode('browse');
                  }}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    ${isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                  `}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={deleting}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    ${isDarkMode
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                      : 'bg-red-50 hover:bg-red-100 text-red-600'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash size={14} />
                  )}
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!editCategoryName.trim() || saving}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    bg-blue-600 hover:bg-blue-700 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : loading ? (
            /* Loading state */
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : currentCategories.length === 0 ? (
            /* Empty state */
            <div className="text-center py-12 px-4">
              <FolderOpen size={40} className="mx-auto mb-3 text-gray-400" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {mode === 'search'
                  ? 'No categories found'
                  : breadcrumbs.length > 0
                    ? 'No subcategories here'
                    : 'No categories yet'}
              </p>
              {mode !== 'search' && (
                <button
                  onClick={() => {
                    setCreateUnderCategory(currentLevel);
                    setMode('create');
                  }}
                  className="mt-3 text-sm text-blue-500 hover:text-blue-400"
                >
                  Create first category
                </button>
              )}
            </div>
          ) : (
            /* Category list */
            <div className="p-2 space-y-1">
              {currentCategories.map(category =>
                renderCategoryItem(category, mode === 'search')
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode !== 'create' && mode !== 'edit' && (
          <div className={`
            flex items-center justify-between px-4 py-3 border-t
            ${isDarkMode ? 'border-white/10' : 'border-gray-200'}
          `}>
            <div className="flex gap-2">
              {selectedCategory && (
                <button
                  onClick={handleRemoveCategory}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium
                    ${isDarkMode
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                      : 'bg-red-50 hover:bg-red-100 text-red-600'}
                  `}
                >
                  Remove Category
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setCreateUnderCategory(currentLevel);
                setMode('create');
              }}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                ${isDarkMode
                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}
              `}
            >
              <Plus size={14} />
              New Category
            </button>
          </div>
        )}
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <CategoryIconPicker
          isOpen={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          onSelect={(icon) => {
            if (mode === 'edit') {
              setEditCategoryIcon(icon);
            } else {
              setNewCategoryIcon(icon);
            }
            setShowIconPicker(false);
          }}
          currentIcon={mode === 'edit' ? editCategoryIcon : newCategoryIcon}
          color={mode === 'edit' ? editCategoryColor : newCategoryColor}
        />
      )}
    </div>,
    document.body
  );
};

// Category Icon Component - Clean SVG icons from Lucide
const CategoryIcon = ({ name, size = 16 }) => {
  // Use Lucide icons - synchronized with CategoryIconPicker
  const lucideIcons = {
    // Crypto & Finance
    'bitcoin': Bitcoin,
    'wallet': Wallet,
    'coins': Coins,
    'landmark': Landmark,
    'credit-card': CreditCard,
    'banknote': Banknote,
    'dollar-sign': CircleDollarSign,
    'piggy-bank': PiggyBank,
    'receipt': Receipt,
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'bar-chart': BarChart3,
    'line-chart': LineChart,
    'pie-chart': PieChart,
    'arrow-up-down': ArrowUpDown,
    'exchange': ArrowRightLeft,
    'dollar': DollarSign,
    'euro': Euro,
    'pound': PoundSterling,
    'badge-dollar': BadgeDollarSign,
    'hand-coins': HandCoins,
    // Rewards & Achievements
    'gift': Gift,
    'award': Award,
    'trophy': Trophy,
    'star': Star,
    'medal': Medal,
    'crown': Crown,
    'gem': Gem,
    'target': Target,
    'zap': Zap,
    'sparkles': Sparkles,
    'party': PartyPopper,
    'cake': Cake,
    'heart': Heart,
    'thumbs-up': ThumbsUp,
    'flame': Flame,
    // Security & Verification
    'shield': Shield,
    'shield-check': ShieldCheck,
    'shield-alert': ShieldAlert,
    'lock': Lock,
    'unlock': Unlock,
    'key': Key,
    'key-round': KeyRound,
    'fingerprint': Fingerprint,
    'eye': Eye,
    'eye-off': EyeOff,
    'scan-face': ScanFace,
    'badge-check': BadgeCheck,
    'circle-check': CircleCheck,
    'check-circle': CheckCircle2,
    'user-check': UserCheck,
    'file-check': FileCheck,
    'clipboard-check': ClipboardCheck,
    // Documents & Files
    'file': File,
    'file-text': FileText,
    'files': Files,
    'folder': Folder,
    'folder-open': FolderOpen,
    'folder-closed': FolderClosed,
    'archive': Archive,
    'file-box': FileBox,
    'clipboard-list': ClipboardList,
    'scroll': ScrollText,
    'newspaper': Newspaper,
    'book-open': BookOpen,
    'book': Book,
    'library': Library,
    'file-signature': FileSignature,
    'file-badge': FileBadge,
    // Communication
    'message-square': MessageSquare,
    'message-circle': MessageCircle,
    'mail': Mail,
    'mail-open': MailOpen,
    'send': Send,
    'inbox': Inbox,
    'at-sign': AtSign,
    'phone': Phone,
    'phone-call': PhoneCall,
    'video': Video,
    'headphones': Headphones,
    'mic': Mic,
    'radio': Radio,
    'bell': Bell,
    'bell-ring': BellRing,
    'megaphone': Megaphone,
    // Users & People
    'user': User,
    'users': Users,
    'user-plus': UserPlus,
    'user-minus': UserMinus,
    'user-cog': UserCog,
    'user-circle': UserCircle,
    'contact': Contact,
    'users-round': UsersRound,
    'circle-user': CircleUser,
    'person': PersonStanding,
    'baby': Baby,
    'accessibility': Accessibility,
    // Time & Scheduling
    'clock': Clock,
    'timer': Timer,
    'timer-off': TimerOff,
    'hourglass': Hourglass,
    'calendar': Calendar,
    'calendar-days': CalendarDays,
    'calendar-check': CalendarCheck,
    'calendar-clock': CalendarClock,
    'alarm': AlarmClock,
    'watch': Watch,
    'history': History,
    'rotate': RotateCcw,
    // Status & Alerts
    'alert-triangle': AlertTriangle,
    'alert-circle': AlertCircle,
    'alert-octagon': AlertOctagon,
    'info': Info,
    'help': HelpCircle,
    'ban': Ban,
    'x-circle': XCircle,
    'check': CheckCircle,
    'circle-dot': CircleDot,
    'circle': Circle,
    'loader': Loader,
    'refresh': RefreshCw,
    'refresh-ccw': RefreshCcw,
    // Navigation & UI
    'home': Home,
    'settings': Settings,
    'cog': Cog,
    'sliders': Sliders,
    'sliders-h': SlidersHorizontal,
    'menu': Menu,
    'more-h': MoreHorizontal,
    'more-v': MoreVertical,
    'grid': Grid,
    'list': List,
    'layout-grid': LayoutGrid,
    'layout-list': LayoutList,
    'columns': Columns,
    'rows': Rows,
    'table': Table,
    // Actions
    'plus': Plus,
    'minus': Minus,
    'edit': Edit,
    'edit-2': Edit2,
    'edit-3': Edit3,
    'pencil': Pencil,
    'pen': PenTool,
    'trash': Trash,
    'trash-2': Trash2,
    'copy': Copy,
    'clipboard': Clipboard,
    'download': Download,
    'upload': Upload,
    'share': Share,
    'share-2': Share2,
    'external-link': ExternalLink,
    'link': Link,
    'link-2': Link2,
    'unlink': Unlink,
    // Arrows
    'arrow-up': ArrowUp,
    'arrow-down': ArrowDown,
    'chevron-up': ChevronUp,
    'chevrons-up': ChevronsUp,
    'chevrons-down': ChevronsDown,
    'move-up': MoveUp,
    'move-down': MoveDown,
    // Media
    'image': Image,
    'images': Images,
    'camera': Camera,
    'film': Film,
    'play': Play,
    'pause': Pause,
    'stop': Square,
    'volume': Volume2,
    'mute': VolumeX,
    'music': Music,
    'mic-2': Mic2,
    // Tags & Labels
    'tag': Tag,
    'tags': Tags,
    'bookmark': Bookmark,
    'bookmark-check': BookmarkCheck,
    'flag': Flag,
    'hash': Hash,
    'asterisk': Asterisk,
    // Tools & Work
    'wrench': Wrench,
    'hammer': Hammer,
    'paintbrush': Paintbrush,
    'scissors': Scissors,
    'ruler': Ruler,
    'compass': Compass,
    'calculator': Calculator,
    'terminal': Terminal,
    'code': Code,
    'code-xml': CodeXml,
    'bug': Bug,
    'puzzle': Puzzle,
    'lightbulb': Lightbulb,
    // Nature & Weather
    'sun': Sun,
    'moon': Moon,
    'cloud': Cloud,
    'rain': CloudRain,
    'snow': Snowflake,
    'wind': Wind,
    'leaf': Leaf,
    'flower': Flower2,
    'mountain': Mountain,
    'waves': Waves,
    // Objects
    'box': Box,
    'package': Package,
    'briefcase': Briefcase,
    'shopping-bag': ShoppingBag,
    'shopping-cart': ShoppingCart,
    'store': Store,
    'building': Building,
    'building-2': Building2,
    'factory': Factory,
    'warehouse': Warehouse,
    'car': Car,
    'plane': Plane,
    'ship': Ship,
    'truck': Truck,
    // Gaming & Fun
    'gamepad': Gamepad2,
    'dice': Dice5,
    'ghost': Ghost,
    'skull': Skull,
    'bomb': Bomb,
    'rocket': Rocket,
    'swords': Swords,
    'shield-question': ShieldQuestion,
    // Misc
    'globe': Globe,
    'map': Map,
    'map-pin': MapPin,
    'navigation': Navigation,
    'anchor': Anchor,
    'wifi': Wifi,
    'signal': Signal,
    'battery': Battery,
    'power': Power,
    'plug': Plug,
    'cpu': Cpu,
    'hard-drive': HardDrive,
    'database': Database,
    'server': Server,
    'cloud-storage': Cloud,
    'cloud-upload': CloudUpload,
    'cloud-download': CloudDownload,
  };

  const IconComponent = lucideIcons[name];
  if (IconComponent) {
    return <IconComponent size={size} strokeWidth={1.5} />;
  }

  // Fallback to folder icon
  return <Folder size={size} strokeWidth={1.5} />;
};

export { CategoryIcon };
export default CategoryPicker;
