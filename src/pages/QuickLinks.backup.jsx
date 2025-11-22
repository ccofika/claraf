import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, Search, X, AlertCircle, FolderOpen, Download, Upload, Users,
  CheckSquare, Clock, ExternalLink as ExternalLinkIcon, Copy as CopyIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

// Import new components
import SortableCategoryList from '../components/QuickLinks/SortableCategoryList';
import SortableLinkList from '../components/QuickLinks/SortableLinkList';
import RecentLinks from '../components/QuickLinks/RecentLinks';
import ExportDialog from '../components/QuickLinks/ExportDialog';
import ImportDialog from '../components/QuickLinks/ImportDialog';
import ShareDialog from '../components/QuickLinks/ShareDialog';
import BulkActionsToolbar from '../components/QuickLinks/BulkActionsToolbar';
import ColorPicker from '../components/QuickLinks/ColorPicker';
import IconPicker from '../components/QuickLinks/IconPicker';

const QuickLinks = () => {
  const [categories, setCategories] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'recent'

  // Selection mode for bulk operations
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedLinkIds, setSelectedLinkIds] = useState([]);

  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showOpenAllConfirm, setShowOpenAllConfirm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '', categoryId: null });

  // Form states for category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');

  // Edit category states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('#3B82F6');
  const [editCategoryIcon, setEditCategoryIcon] = useState('Folder');

  // Form states for link
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState('copy');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [newLinkTags, setNewLinkTags] = useState('');

  // Edit link states
  const [editingLink, setEditingLink] = useState(null);
  const [editLinkName, setEditLinkName] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkType, setEditLinkType] = useState('copy');
  const [editLinkDescription, setEditLinkDescription] = useState('');
  const [editLinkTags, setEditLinkTags] = useState('');

  // Fetch all categories and links
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/quicklinks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);

      // Auto-select first category if none selected
      if (response.data.length > 0 && !selectedCategory) {
        setSelectedCategory(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent links
  const fetchRecentLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/quicklinks/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentLinks(response.data);
    } catch (error) {
      console.error('Error fetching recent links:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchRecentLinks();
  }, []);

  // Create new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category`,
        {
          categoryName: newCategoryName,
          description: newCategoryDescription,
          color: newCategoryColor,
          icon: newCategoryIcon,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories([...categories, response.data]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
      setNewCategoryIcon('Folder');
      setShowAddCategoryModal(false);
      setSelectedCategory(response.data);
      toast.success('Category created successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(error.response?.data?.message || 'Failed to add category');
    }
  };

  // Edit category
  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim() || !editingCategory) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${editingCategory._id}`,
        {
          categoryName: editCategoryName,
          description: editCategoryDescription,
          color: editCategoryColor,
          icon: editCategoryIcon,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCategories = categories.map((cat) =>
        cat._id === editingCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);

      if (selectedCategory?._id === editingCategory._id) {
        setSelectedCategory(response.data);
      }

      setShowEditCategoryModal(false);
      setEditingCategory(null);
      setEditCategoryName('');
      setEditCategoryDescription('');
      setEditCategoryColor('#3B82F6');
      setEditCategoryIcon('Folder');
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error editing category:', error);
      toast.error(error.response?.data?.message || 'Failed to edit category');
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    const categoryId = deleteDialog.id;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/quicklinks/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedCategories = categories.filter((cat) => cat._id !== categoryId);
      setCategories(updatedCategories);

      if (selectedCategory?._id === categoryId) {
        setSelectedCategory(updatedCategories[0] || null);
      }

      setDeleteDialog({ open: false, type: null, id: null, name: '', categoryId: null });
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Duplicate category
  const handleDuplicateCategory = async (category) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${category._id}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories([...categories, response.data]);
      toast.success('Category duplicated successfully');
    } catch (error) {
      console.error('Error duplicating category:', error);
      toast.error('Failed to duplicate category');
    }
  };

  // Reorder categories
  const handleReorderCategories = async (categoryOrders) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/reorder-categories`,
        { categoryOrders },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories(response.data);
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to reorder categories');
    }
  };

  // Add link to category
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim() || !selectedCategory) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/link`,
        {
          categoryId: selectedCategory._id,
          name: newLinkName,
          url: newLinkUrl,
          type: newLinkType,
          description: newLinkDescription,
          tags: newLinkTags ? newLinkTags.split(',').map(tag => tag.trim()) : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCategories = categories.map((cat) =>
        cat._id === selectedCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);
      setSelectedCategory(response.data);

      setNewLinkName('');
      setNewLinkUrl('');
      setNewLinkType('copy');
      setNewLinkDescription('');
      setNewLinkTags('');
      setShowAddLinkModal(false);
      toast.success('Link added successfully');
    } catch (error) {
      console.error('Error adding link:', error);
      if (error.response?.status === 400 && error.response?.data?.duplicateLink) {
        toast.error('This URL already exists in this category', {
          description: `Link: ${error.response.data.duplicateLink.name}`,
        });
      } else {
        toast.error('Failed to add link');
      }
    }
  };

  // Edit link
  const handleEditLink = async (e) => {
    e.preventDefault();
    if (!editLinkName.trim() || !editLinkUrl.trim() || !editingLink) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/link/${selectedCategory._id}/${editingLink._id}`,
        {
          name: editLinkName,
          url: editLinkUrl,
          type: editLinkType,
          description: editLinkDescription,
          tags: editLinkTags ? editLinkTags.split(',').map(tag => tag.trim()) : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCategories = categories.map((cat) =>
        cat._id === selectedCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);
      setSelectedCategory(response.data);

      setShowEditLinkModal(false);
      setEditingLink(null);
      setEditLinkName('');
      setEditLinkUrl('');
      setEditLinkType('copy');
      setEditLinkDescription('');
      setEditLinkTags('');
      toast.success('Link updated successfully');
    } catch (error) {
      console.error('Error editing link:', error);
      toast.error('Failed to edit link');
    }
  };

  // Delete link
  const handleDeleteLink = async () => {
    const { categoryId, id } = deleteDialog;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/link/${categoryId}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCategories = categories.map((cat) =>
        cat._id === categoryId ? response.data : cat
      );
      setCategories(updatedCategories);

      if (selectedCategory?._id === categoryId) {
        setSelectedCategory(response.data);
      }

      setDeleteDialog({ open: false, type: null, id: null, name: '', categoryId: null });
      toast.success('Link deleted successfully');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  };

  // Toggle pin status
  const handleTogglePin = async (link) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/link/${selectedCategory._id}/${link._id}/toggle-pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCategories = categories.map((cat) =>
        cat._id === selectedCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);
      setSelectedCategory(response.data);

      toast.success(response.data.links.find(l => l._id === link._id).isPinned ? 'Link pinned' : 'Link unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to toggle pin');
    }
  };

  // Handle link click (copy or open) + track click
  const handleLinkClick = async (link, categoryId = selectedCategory?._id) => {
    // Track click first
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/link/${categoryId}/${link._id}/track-click`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state with new click count
      const updatedCategories = categories.map((cat) => {
        if (cat._id === categoryId) {
          return {
            ...cat,
            links: cat.links.map(l => l._id === link._id ? {
              ...l, clicks: (l.clicks || 0) + 1, lastClicked: new Date()
            } : l)
          };
        }
        return cat;
      });
      setCategories(updatedCategories);

      if (selectedCategory?._id === categoryId) {
        const updated = updatedCategories.find(c => c._id === categoryId);
        setSelectedCategory(updated);
      }

      // Refresh recent links
      fetchRecentLinks();
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    // Perform action
    if (link.type === 'open') {
      window.open(link.url, '_blank', 'noopener,noreferrer');
      toast.success('Link opened in new tab');
    } else {
      try {
        await navigator.clipboard.writeText(link.url);
        setCopiedLinkId(link._id);
        setTimeout(() => setCopiedLinkId(null), 2000);
        toast.success('Link copied to clipboard');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy link');
      }
    }
  };

  // Reorder links
  const handleReorderLinks = async (linkOrders) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${selectedCategory._id}/reorder-links`,
        { linkOrders },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCategories = categories.map((cat) =>
        cat._id === selectedCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);
      setSelectedCategory(response.data);
    } catch (error) {
      console.error('Error reordering links:', error);
      toast.error('Failed to reorder links');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCategoryIds.length === 0 && selectedLinkIds.length === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const linkItems = selectedLinkIds.map(linkId => {
        // Find which category this link belongs to
        const category = categories.find(cat =>
          cat.links.some(link => link._id === linkId)
        );
        return { categoryId: category._id, linkId };
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/bulk-delete`,
        {
          categoryIds: selectedCategoryIds,
          linkItems,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories(response.data);

      // Update selected category if it still exists
      const stillExists = response.data.find(cat => cat._id === selectedCategory?._id);
      setSelectedCategory(stillExists || response.data[0] || null);

      // Exit selection mode
      setSelectionMode(false);
      setSelectedCategoryIds([]);
      setSelectedLinkIds([]);

      toast.success('Items deleted successfully');
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete items');
    }
  };

  // Open all links in category
  const handleOpenAllLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category/${selectedCategory._id}/all-links`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      response.data.urls.forEach(url => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });

      setShowOpenAllConfirm(false);

      if (response.data.total > response.data.count) {
        toast.success(`Opened ${response.data.count} links (limited to 20 for safety)`);
      } else {
        toast.success(`Opened ${response.data.count} ${response.data.count === 1 ? 'link' : 'links'}`);
      }
    } catch (error) {
      console.error('Error opening all links:', error);
      toast.error('Failed to open links');
    }
  };

  // Helper functions
  const openEditCategoryModal = (category, e) => {
    e?.stopPropagation();
    setEditingCategory(category);
    setEditCategoryName(category.categoryName);
    setEditCategoryDescription(category.description || '');
    setEditCategoryColor(category.color || '#3B82F6');
    setEditCategoryIcon(category.icon || 'Folder');
    setShowEditCategoryModal(true);
  };

  const openEditLinkModal = (link, e) => {
    e?.stopPropagation();
    setEditingLink(link);
    setEditLinkName(link.name);
    setEditLinkUrl(link.url);
    setEditLinkType(link.type || 'copy');
    setEditLinkDescription(link.description || '');
    setEditLinkTags(link.tags?.join(', ') || '');
    setShowEditLinkModal(true);
  };

  const toggleCategorySelection = (categoryId) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleLinkSelection = (linkId) => {
    setSelectedLinkIds(prev =>
      prev.includes(linkId) ? prev.filter(id => id !== linkId) : [...prev, linkId]
    );
  };

  const filteredLinks = selectedCategory?.links.filter(link =>
    link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
    </div>
  );

  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/70" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );

  const DeleteDialogComponent = () => (
    <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null, name: '', categoryId: null })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete {deleteDialog.type === 'category' ? 'Category' : 'Link'}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">This action cannot be undone</p>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-card-foreground">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold">{deleteDialog.name}</span>?
            {deleteDialog.type === 'category' && (
              <span className="block mt-2 text-red-600 dark:text-red-400">
                Warning: All links in this category will also be deleted.
              </span>
            )}
          </p>
        </div>
        <DialogFooter className="flex items-center gap-3">
          <button
            onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: '', categoryId: null })}
            className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (deleteDialog.type === 'category') {
                handleDeleteCategory();
              } else {
                handleDeleteLink();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete {deleteDialog.type === 'category' ? 'Category' : 'Link'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quick Links</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize and access your important links in one place
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg hover:bg-muted/50 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowExportDialog(true)}
              className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg hover:bg-muted/50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedCategoryIds([]);
                setSelectedLinkIds([]);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                selectionMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-input hover:bg-muted/50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              {selectionMode ? 'Cancel Selection' : 'Select'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Categories/Recent */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader className="border-b">
                {/* View Tabs */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setViewMode('categories')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'categories'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    Categories
                  </button>
                  <button
                    onClick={() => setViewMode('recent')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'recent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Recent
                  </button>
                </div>

                {viewMode === 'categories' && (
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Categories</CardTitle>
                    <button
                      onClick={() => setShowAddCategoryModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      disabled={selectionMode}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-360px)]">
                {viewMode === 'categories' ? (
                  categories.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title="No categories"
                      description="Create your first category to organize your links"
                      action={
                        <button
                          onClick={() => setShowAddCategoryModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create Category
                        </button>
                      }
                    />
                  ) : (
                    <SortableCategoryList
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                      onEditCategory={openEditCategoryModal}
                      onDeleteCategory={(category) =>
                        setDeleteDialog({
                          open: true,
                          type: 'category',
                          id: category._id,
                          name: category.categoryName,
                          categoryId: null
                        })
                      }
                      onReorder={handleReorderCategories}
                      selectionMode={selectionMode}
                      selectedItems={selectedCategoryIds}
                      onToggleSelection={toggleCategorySelection}
                    />
                  )
                ) : (
                  <RecentLinks
                    recentLinks={recentLinks}
                    onLinkClick={(link) => handleLinkClick(link, link.categoryId)}
                    onNavigateToCategory={(categoryId) => {
                      const cat = categories.find(c => c._id === categoryId);
                      if (cat) {
                        setSelectedCategory(cat);
                        setViewMode('categories');
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Links */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-semibold">
                      {selectedCategory ? selectedCategory.categoryName : 'Select a Category'}
                    </CardTitle>
                    {selectedCategory && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {filteredLinks.length} {filteredLinks.length === 1 ? 'link' : 'links'}
                        </Badge>
                        {selectedCategory.description && (
                          <span className="text-xs text-muted-foreground">
                            {selectedCategory.description}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {selectedCategory && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowShareDialog(true)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-input rounded-lg hover:bg-muted/50 transition-colors text-sm"
                        disabled={selectionMode}
                      >
                        <Users className="w-4 h-4" />
                        Share
                      </button>
                      {selectedCategory.links.length > 0 && (
                        <button
                          onClick={() => setShowOpenAllConfirm(true)}
                          className="flex items-center gap-2 px-3 py-1.5 border border-input rounded-lg hover:bg-muted/50 transition-colors text-sm"
                          disabled={selectionMode}
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                          Open All
                        </button>
                      )}
                      <button
                        onClick={() => setShowAddLinkModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        disabled={selectionMode}
                      >
                        <Plus className="w-4 h-4" />
                        Add Link
                      </button>
                    </div>
                  )}
                </div>
                {selectedCategory && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search links..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9 h-9 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-420px)]">
                {!selectedCategory ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="No category selected"
                    description="Select a category from the left panel to view its links"
                    action={null}
                  />
                ) : filteredLinks.length === 0 ? (
                  <EmptyState
                    icon={CopyIcon}
                    title={searchQuery ? "No links match your search" : "No links yet"}
                    description={searchQuery ? "Try adjusting your search query" : "Add your first link to this category"}
                    action={
                      searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          Clear Search
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAddLinkModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Link
                        </button>
                      )
                    }
                  />
                ) : (
                  <SortableLinkList
                    links={filteredLinks}
                    onLinkClick={handleLinkClick}
                    onEditLink={openEditLinkModal}
                    onDeleteLink={(link) =>
                      setDeleteDialog({
                        open: true,
                        type: 'link',
                        id: link._id,
                        name: link.name,
                        categoryId: selectedCategory._id
                      })
                    }
                    onTogglePin={handleTogglePin}
                    onReorder={handleReorderLinks}
                    copiedLinkId={copiedLinkId}
                    selectionMode={selectionMode}
                    selectedItems={selectedLinkIds}
                    onToggleSelection={toggleLinkSelection}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedCategoryIds.length + selectedLinkIds.length}
        onDelete={handleBulkDelete}
        onCancel={() => {
          setSelectionMode(false);
          setSelectedCategoryIds([]);
          setSelectedLinkIds([]);
        }}
      />

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4 py-4">
            <div>
              <Label htmlFor="categoryName" className="text-sm font-medium text-card-foreground mb-2 block">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Work Resources"
                required
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription" className="text-sm font-medium text-card-foreground mb-2 block">
                Description (Optional)
              </Label>
              <Input
                id="categoryDescription"
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="e.g., Important work-related links"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IconPicker
                value={newCategoryIcon}
                onChange={setNewCategoryIcon}
                label="Icon"
              />
              <ColorPicker
                value={newCategoryColor}
                onChange={setNewCategoryColor}
                label="Color"
              />
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                  setNewCategoryColor('#3B82F6');
                  setNewCategoryIcon('Folder');
                }}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Category
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditCategoryModal} onOpenChange={setShowEditCategoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-4 py-4">
            <div>
              <Label htmlFor="editCategoryName" className="text-sm font-medium text-card-foreground mb-2 block">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editCategoryName"
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="e.g., Work Resources"
                required
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="editCategoryDescription" className="text-sm font-medium text-card-foreground mb-2 block">
                Description (Optional)
              </Label>
              <Input
                id="editCategoryDescription"
                type="text"
                value={editCategoryDescription}
                onChange={(e) => setEditCategoryDescription(e.target.value)}
                placeholder="e.g., Important work-related links"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IconPicker
                value={editCategoryIcon}
                onChange={setEditCategoryIcon}
                label="Icon"
              />
              <ColorPicker
                value={editCategoryColor}
                onChange={setEditCategoryColor}
                label="Color"
              />
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryName('');
                  setEditCategoryDescription('');
                  setEditCategoryColor('#3B82F6');
                  setEditCategoryIcon('Folder');
                }}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Link Modal */}
      <Dialog open={showAddLinkModal} onOpenChange={setShowAddLinkModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLink} className="space-y-4 py-4">
            <div>
              <Label htmlFor="linkName" className="text-sm font-medium text-card-foreground mb-2 block">
                Link Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="linkName"
                type="text"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                placeholder="e.g., Project Documentation"
                required
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="linkUrl" className="text-sm font-medium text-card-foreground mb-2 block">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="linkUrl"
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="linkDescription" className="text-sm font-medium text-card-foreground mb-2 block">
                Description (Optional)
              </Label>
              <Input
                id="linkDescription"
                type="text"
                value={newLinkDescription}
                onChange={(e) => setNewLinkDescription(e.target.value)}
                placeholder="Brief description of the link"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="linkTags" className="text-sm font-medium text-card-foreground mb-2 block">
                Tags (Optional, comma-separated)
              </Label>
              <Input
                id="linkTags"
                type="text"
                value={newLinkTags}
                onChange={(e) => setNewLinkTags(e.target.value)}
                placeholder="e.g., documentation, guide, reference"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="linkType" className="text-sm font-medium text-card-foreground mb-2 block">
                Link Type
              </Label>
              <select
                id="linkType"
                value={newLinkType}
                onChange={(e) => setNewLinkType(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground"
              >
                <option value="copy">Copy to Clipboard</option>
                <option value="open">Open in New Tab</option>
              </select>
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddLinkModal(false);
                  setNewLinkName('');
                  setNewLinkUrl('');
                  setNewLinkType('copy');
                  setNewLinkDescription('');
                  setNewLinkTags('');
                }}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Link
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Link Modal */}
      <Dialog open={showEditLinkModal} onOpenChange={setShowEditLinkModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditLink} className="space-y-4 py-4">
            <div>
              <Label htmlFor="editLinkName" className="text-sm font-medium text-card-foreground mb-2 block">
                Link Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editLinkName"
                type="text"
                value={editLinkName}
                onChange={(e) => setEditLinkName(e.target.value)}
                placeholder="e.g., Project Documentation"
                required
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="editLinkUrl" className="text-sm font-medium text-card-foreground mb-2 block">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editLinkUrl"
                type="url"
                value={editLinkUrl}
                onChange={(e) => setEditLinkUrl(e.target.value)}
                placeholder="https://..."
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="editLinkDescription" className="text-sm font-medium text-card-foreground mb-2 block">
                Description (Optional)
              </Label>
              <Input
                id="editLinkDescription"
                type="text"
                value={editLinkDescription}
                onChange={(e) => setEditLinkDescription(e.target.value)}
                placeholder="Brief description of the link"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="editLinkTags" className="text-sm font-medium text-card-foreground mb-2 block">
                Tags (Optional, comma-separated)
              </Label>
              <Input
                id="editLinkTags"
                type="text"
                value={editLinkTags}
                onChange={(e) => setEditLinkTags(e.target.value)}
                placeholder="e.g., documentation, guide, reference"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="editLinkType" className="text-sm font-medium text-card-foreground mb-2 block">
                Link Type
              </Label>
              <select
                id="editLinkType"
                value={editLinkType}
                onChange={(e) => setEditLinkType(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground"
              >
                <option value="copy">Copy to Clipboard</option>
                <option value="open">Open in New Tab</option>
              </select>
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditLinkModal(false);
                  setEditingLink(null);
                  setEditLinkName('');
                  setEditLinkUrl('');
                  setEditLinkType('copy');
                  setEditLinkDescription('');
                  setEditLinkTags('');
                }}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Open All Confirmation */}
      <Dialog open={showOpenAllConfirm} onOpenChange={setShowOpenAllConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open All Links?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-card-foreground">
              This will open all {selectedCategory?.links.length} links in new tabs. Continue?
            </p>
            {selectedCategory?.links.length > 20 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                Note: Only the first 20 links will be opened for safety.
              </p>
            )}
          </div>
          <DialogFooter className="flex items-center gap-3">
            <button
              onClick={() => setShowOpenAllConfirm(false)}
              className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOpenAllLinks}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open All Links
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialogComponent />

      {/* Export Dialog */}
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={fetchCategories}
      />

      {/* Share Dialog */}
      {selectedCategory && (
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          category={selectedCategory}
          onUpdateCategory={(updatedCategory) => {
            const updatedCategories = categories.map((cat) =>
              cat._id === updatedCategory._id ? updatedCategory : cat
            );
            setCategories(updatedCategories);
            setSelectedCategory(updatedCategory);
          }}
        />
      )}
    </div>
  );
};

export default QuickLinks;
