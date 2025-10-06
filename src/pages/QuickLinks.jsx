import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import logoBlack from '../assets/images/LOGO-MAIN-BLACK.png';
import logoWhite from '../assets/images/LOGO-MAIN-WHITE.png';
import {
  AddLarge,
  TrashCan,
  Checkmark,
  Close,
  Link as LinkIcon,
  Folder,
  Edit,
  Launch,
} from '@carbon/icons-react';

const QuickLinks = () => {
  const { theme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/quicklinks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);

      // Auto-select first category if none selected
      if (response.data.length > 0 && !selectedCategory) {
        setSelectedCategory(response.data[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

      // Auto-select newly created category
      setSelectedCategory(response.data);
    } catch (error) {
      console.error('Error adding category:', error);
      alert(error.response?.data?.message || 'Failed to add category');
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
    } catch (error) {
      console.error('Error editing category:', error);
      alert(error.response?.data?.message || 'Failed to edit category');
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category and all its links?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/quicklinks/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedCategories = categories.filter((cat) => cat._id !== categoryId);
      setCategories(updatedCategories);

      // Select another category if current was deleted
      if (selectedCategory?._id === categoryId) {
        setSelectedCategory(updatedCategories[0] || null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
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

      // Update categories with new link
      const updatedCategories = categories.map((cat) =>
        cat._id === selectedCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);
      setSelectedCategory(response.data);

      setNewLinkName('');
      setNewLinkUrl('');
      setNewLinkType('copy');
      setShowAddLinkModal(false);
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link');
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
    } catch (error) {
      console.error('Error editing link:', error);
      alert('Failed to edit link');
    }
  };

  // Delete link
  const handleDeleteLink = async (categoryId, linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/link/${categoryId}/${linkId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update categories
      const updatedCategories = categories.map((cat) =>
        cat._id === categoryId ? response.data : cat
      );
      setCategories(updatedCategories);

      // Update selected category
      if (selectedCategory?._id === categoryId) {
        setSelectedCategory(response.data);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link');
    }
  };

  // Truncate URL to max length
  const truncateUrl = (url, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  // Handle link click (copy or open)
  const handleLinkClick = async (link) => {
    if (link.type === 'open') {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(link.url);
        setCopiedLinkId(link._id);
        setTimeout(() => setCopiedLinkId(null), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-xl text-gray-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8 relative">
      {/* Logo in top left corner */}
      <div className="absolute top-8 left-8 z-10">
        <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Logo" className="h-8" />
      </div>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl flex gap-6">
          {/* Left Panel - Categories */}
          <div className="flex-1 space-y-8">

            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-[calc(100vh-160px)] flex flex-col">
              <div className="mb-6 flex justify-between items-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50">Categories</h2>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <AddLarge size={16} />
                  <span className="text-sm font-medium">Add Category</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-neutral-400">
                  <Folder size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">No categories yet. Create your first category!</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors group ${
                        selectedCategory?._id === category._id
                          ? 'bg-gray-200 dark:bg-neutral-800'
                          : 'hover:bg-gray-100 dark:hover:bg-neutral-900'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        <Folder size={20} className="text-gray-900 dark:text-neutral-50" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">
                            {category.categoryName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-neutral-400">
                            {category.links.length} link{category.links.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => openEditCategoryModal(category, e)}
                          className="p-2 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category._id);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <TrashCan size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Links */}
          <div className="flex-1">
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-[calc(100vh-160px)] flex flex-col">
              <div className="mb-6 flex justify-between items-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
                  {selectedCategory ? selectedCategory.categoryName : 'Quick Links'}
                </h2>
                {selectedCategory && (
                  <button
                    onClick={() => setShowAddLinkModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    <AddLarge size={16} />
                    <span className="text-sm font-medium">Add Link</span>
                  </button>
                )}
              </div>

              {!selectedCategory ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-neutral-400">
                  <LinkIcon size={64} className="mb-4 opacity-50" />
                  <p className="text-sm">Select a category to view links</p>
                </div>
              ) : selectedCategory.links.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-neutral-400">
                  <LinkIcon size={64} className="mb-4 opacity-50" />
                  <p className="text-sm">No links in this category. Add your first link!</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {selectedCategory.links.map((link) => (
                    <div
                      key={link._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group"
                    >
                      <button
                        onClick={() => handleLinkClick(link)}
                        className="flex-1 text-left flex items-center gap-3"
                        title={link.url}
                      >
                        {link.type === 'open' ? (
                          <Launch size={20} className="text-gray-900 dark:text-neutral-50 flex-shrink-0" />
                        ) : (
                          <LinkIcon size={20} className="text-gray-900 dark:text-neutral-50 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">
                            {link.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-neutral-400">
                            {truncateUrl(link.url)}
                          </p>
                        </div>
                        {copiedLinkId === link._id ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 flex-shrink-0">
                            <Checkmark size={16} />
                            <span className="text-xs font-medium">Copied!</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 whitespace-nowrap">
                            {link.type === 'open' ? 'Click to open' : 'Click to copy'}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => openEditLinkModal(link, e)}
                          className="p-2 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(selectedCategory._id, link._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <TrashCan size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-50">Add Category</h3>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Close size={20} className="text-gray-900 dark:text-neutral-50" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  Category Name
                </label>
                <input
                  id="categoryName"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., Stake Support Links"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors font-medium"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-50 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-50">Add Link</h3>
              <button
                onClick={() => {
                  setShowAddLinkModal(false);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Close size={20} className="text-gray-900 dark:text-neutral-50" />
              </button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label htmlFor="linkName" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  Link Name
                </label>
                <input
                  id="linkName"
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., VIP Progress Guide"
                  required
                />
              </div>
              <div>
                <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  URL
                </label>
                <input
                  id="linkUrl"
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label htmlFor="linkType" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  Link Type
                </label>
                <select
                  id="linkType"
                  value={newLinkType}
                  onChange={(e) => setNewLinkType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="copy">Copy to Clipboard</option>
                  <option value="open">Open in New Tab</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors font-medium"
                >
                  Add Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLinkModal(false);
                    setNewLinkName('');
                    setNewLinkUrl('');
                    setNewLinkType('copy');
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-50 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-50">Edit Category</h3>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryName('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Close size={20} className="text-gray-900 dark:text-neutral-50" />
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  Category Name
                </label>
                <input
                  id="editCategoryName"
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., Stake Support Links"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                    setEditCategoryName('');
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-50 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {showEditLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-50">Edit Link</h3>
              <button
                onClick={() => {
                  setShowEditLinkModal(false);
                  setEditingLink(null);
                  setEditLinkName('');
                  setEditLinkUrl('');
                  setEditLinkType('copy');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Close size={20} className="text-gray-900 dark:text-neutral-50" />
              </button>
            </div>
            <form onSubmit={handleEditLink} className="space-y-4">
              <div>
                <label htmlFor="editLinkName" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  Link Name
                </label>
                <input
                  id="editLinkName"
                  type="text"
                  value={editLinkName}
                  onChange={(e) => setEditLinkName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., VIP Progress Guide"
                  required
                />
              </div>
              <div>
                <label htmlFor="editLinkUrl" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  URL
                </label>
                <input
                  id="editLinkUrl"
                  type="url"
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label htmlFor="editLinkType" className="block text-sm font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  Link Type
                </label>
                <select
                  id="editLinkType"
                  value={editLinkType}
                  onChange={(e) => setEditLinkType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="copy">Copy to Clipboard</option>
                  <option value="open">Open in New Tab</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLinkModal(false);
                    setEditingLink(null);
                    setEditLinkName('');
                    setEditLinkUrl('');
                    setEditLinkType('copy');
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-50 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickLinks;
