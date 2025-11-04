import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, Link as LinkIcon, Folder, ExternalLink, Copy,
  Search, X, Check, AlertCircle, FolderOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const QuickLinks = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '', categoryId: null });

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState('copy');

  // Edit states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editLinkName, setEditLinkName] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkType, setEditLinkType] = useState('copy');

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

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/category`,
        { categoryName: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategories([...categories, response.data]);
      setNewCategoryName('');
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
        { categoryName: editCategoryName },
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
      setShowAddLinkModal(false);
      toast.success('Link added successfully');
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
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

  // Handle link click (copy or open)
  const handleLinkClick = async (link) => {
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

  // Open edit category modal
  const openEditCategoryModal = (category, e) => {
    e.stopPropagation();
    setEditingCategory(category);
    setEditCategoryName(category.categoryName);
    setShowEditCategoryModal(true);
  };

  // Open edit link modal
  const openEditLinkModal = (link, e) => {
    e.stopPropagation();
    setEditingLink(link);
    setEditLinkName(link.name);
    setEditLinkUrl(link.url);
    setEditLinkType(link.type || 'copy');
    setShowEditLinkModal(true);
  };

  // Filter links by search query
  const filteredLinks = selectedCategory?.links.filter(link =>
    link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
    </div>
  );

  // Empty State
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

  // Delete Confirmation Dialog
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Categories */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Categories</CardTitle>
                  <button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {categories.length === 0 ? (
                  <EmptyState
                    icon={Folder}
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
                  <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-360px)]">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group border-l-4 ${
                          selectedCategory?._id === category._id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600'
                            : 'bg-card border-transparent hover:bg-muted/50 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${
                            selectedCategory?._id === category._id
                              ? 'bg-blue-100 dark:bg-blue-900/40'
                              : 'bg-muted/50'
                          }`}>
                            <Folder className={`w-4 h-4 ${
                              selectedCategory?._id === category._id
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {category.categoryName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {category.links.length} {category.links.length === 1 ? 'link' : 'links'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => openEditCategoryModal(category, e)}
                            className="p-1.5 text-muted-foreground hover:bg-accent rounded-md transition-colors"
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({
                                open: true,
                                type: 'category',
                                id: category._id,
                                name: category.categoryName,
                                categoryId: null
                              });
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <Badge variant="outline" className="text-xs">
                        {filteredLinks.length} {filteredLinks.length === 1 ? 'link' : 'links'}
                      </Badge>
                    )}
                  </div>
                  {selectedCategory && (
                    <button
                      onClick={() => setShowAddLinkModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
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
              <CardContent className="p-4">
                {!selectedCategory ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="No category selected"
                    description="Select a category from the left panel to view its links"
                    action={null}
                  />
                ) : filteredLinks.length === 0 ? (
                  <EmptyState
                    icon={LinkIcon}
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
                  <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-420px)]">
                    {filteredLinks.map((link) => (
                      <div
                        key={link._id}
                        className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                      >
                        <button
                          onClick={() => handleLinkClick(link)}
                          className="flex-1 text-left flex items-center gap-3 min-w-0"
                          title={link.url}
                        >
                          <div className="p-2 bg-muted/50 rounded-lg flex-shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                            {link.type === 'open' ? (
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {link.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {link.url}
                            </p>
                          </div>
                          {copiedLinkId === link._id ? (
                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 flex-shrink-0">
                              <Check className="w-4 h-4" />
                              <span className="text-xs font-medium">Copied!</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              {link.type === 'open' ? 'Open' : 'Copy'}
                            </Badge>
                          )}
                        </button>
                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => openEditLinkModal(link, e)}
                            className="p-1.5 text-muted-foreground hover:bg-accent rounded-md transition-colors"
                            title="Edit link"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({
                              open: true,
                              type: 'link',
                              id: link._id,
                              name: link.name,
                              categoryId: selectedCategory._id
                            })}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="max-w-md">
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
                placeholder="e.g., Stake Support Links"
                required
                className="w-full"
                autoFocus
              />
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
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
        <DialogContent className="max-w-md">
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
                placeholder="e.g., Stake Support Links"
                required
                className="w-full"
                autoFocus
              />
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryName('');
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
                placeholder="e.g., VIP Progress Guide"
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
                placeholder="e.g., VIP Progress Guide"
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

      {/* Delete Confirmation Dialog */}
      <DeleteDialogComponent />
    </div>
  );
};

export default QuickLinks;
