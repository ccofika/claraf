import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X,
  Loader2, BookOpen, FolderOpen, FileText, Tag, AlertCircle,
  ArrowLeft, Image as ImageIcon, Upload, Star, Shield, AlertTriangle,
  CheckCircle, XCircle, List, Zap, Eye, Copy, Search, Filter
} from 'lucide-react';
import { uploadTicketImage, deleteImageFromCloudinary } from '../utils/imageUpload';

const API_URL = process.env.REACT_APP_API_URL;

// View modes
const VIEW_MODES = {
  LIST: 'list',
  EDIT_CATEGORY: 'edit_category',
  EDIT_SUBCATEGORY: 'edit_subcategory',
  CATEGORY_RULES: 'category_rules',
  EDIT_RULE: 'edit_rule'
};

// Severity options
const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'red', description: 'Serious violation, regulatory issue' },
  { value: 'high', label: 'High', color: 'orange', description: 'Clear violation of procedure' },
  { value: 'medium', label: 'Medium', color: 'yellow', description: 'Suboptimal but not critical' },
  { value: 'low', label: 'Low', color: 'gray', description: 'Minor improvement suggestion' }
];

const QAKnowledgeBase = ({ isAdmin }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  // View state
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/knowledge/categories`,
        getAuthHeaders()
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Delete category
  const handleDeleteCategory = async (categoryId, isBasicKnowledge) => {
    if (isBasicKnowledge) {
      toast.error('Cannot delete Basic Knowledge category');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category and all its rules?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/qa/knowledge/categories/${categoryId}`,
        getAuthHeaders()
      );
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  // Delete subcategory
  const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/qa/knowledge/categories/${categoryId}/subcategories/${subcategoryId}`,
        getAuthHeaders()
      );
      toast.success('Subcategory deleted');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error(error.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  // Open edit category
  const openEditCategory = (category) => {
    setEditingCategory(category);
    setViewMode(VIEW_MODES.EDIT_CATEGORY);
  };

  // Open add category
  const openAddCategory = () => {
    setEditingCategory(null);
    setViewMode(VIEW_MODES.EDIT_CATEGORY);
  };

  // Open add subcategory
  const openAddSubcategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory(null);
    setViewMode(VIEW_MODES.EDIT_SUBCATEGORY);
  };

  // Open edit subcategory
  const openEditSubcategory = (categoryId, subcategory) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory(subcategory);
    setViewMode(VIEW_MODES.EDIT_SUBCATEGORY);
  };

  // Open category rules view
  const openCategoryRules = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setViewMode(VIEW_MODES.CATEGORY_RULES);
  };

  // Open add rule
  const openAddRule = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setEditingRule(null);
    setViewMode(VIEW_MODES.EDIT_RULE);
  };

  // Open edit rule
  const openEditRule = (categoryId, rule) => {
    setSelectedCategoryId(categoryId);
    setEditingRule(rule);
    setViewMode(VIEW_MODES.EDIT_RULE);
  };

  // Go back to list
  const goBackToList = () => {
    setViewMode(VIEW_MODES.LIST);
    setEditingCategory(null);
    setEditingSubcategory(null);
    setEditingRule(null);
    setSelectedCategoryId(null);
    fetchCategories();
  };

  // Go back to category rules
  const goBackToCategoryRules = () => {
    setViewMode(VIEW_MODES.CATEGORY_RULES);
    setEditingRule(null);
  };

  if (loading && viewMode === VIEW_MODES.LIST) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Render Category Editor
  if (viewMode === VIEW_MODES.EDIT_CATEGORY) {
    return (
      <CategoryEditor
        category={editingCategory}
        onBack={goBackToList}
        onSuccess={goBackToList}
      />
    );
  }

  // Render Subcategory Editor
  if (viewMode === VIEW_MODES.EDIT_SUBCATEGORY) {
    const parentCategory = categories.find(c => c._id === selectedCategoryId);
    return (
      <SubcategoryEditor
        categoryId={selectedCategoryId}
        categoryName={parentCategory?.name || 'Category'}
        subcategory={editingSubcategory}
        onBack={goBackToList}
        onSuccess={goBackToList}
      />
    );
  }

  // Render Category Rules List
  if (viewMode === VIEW_MODES.CATEGORY_RULES) {
    const selectedCategory = categories.find(c => c._id === selectedCategoryId);
    return (
      <RulesList
        category={selectedCategory}
        isAdmin={isAdmin}
        onBack={goBackToList}
        onAddRule={() => openAddRule(selectedCategoryId)}
        onEditRule={(rule) => openEditRule(selectedCategoryId, rule)}
      />
    );
  }

  // Render Rule Editor
  if (viewMode === VIEW_MODES.EDIT_RULE) {
    const selectedCategory = categories.find(c => c._id === selectedCategoryId);
    return (
      <RuleEditor
        categoryId={selectedCategoryId}
        categoryName={selectedCategory?.name || 'Category'}
        rule={editingRule}
        onBack={goBackToCategoryRules}
        onSuccess={goBackToCategoryRules}
      />
    );
  }

  // Render Categories List
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Knowledge Base
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Manage categories and rules for AI ticket evaluation
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddCategory}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Not admin notice */}
      {!isAdmin && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                View Only Mode
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You can view the knowledge base but cannot edit it. Contact an admin for changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Categories Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6 text-center max-w-md">
            Create categories to organize knowledge for AI ticket evaluation.
          </p>
          {isAdmin && (
            <button
              onClick={openAddCategory}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          {categories.map((category) => (
            <div key={category._id} className="border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                <button
                  onClick={() => toggleCategory(category._id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {expandedCategories[category._id] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  {category.isBasicKnowledge ? (
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ) : (
                    <FolderOpen className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      {category.isBasicKnowledge && (
                        <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                          Always sent to AI
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                </button>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCategoryRules(category._id);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View Rules"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddRule(category._id);
                      }}
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Add Rule"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCategory(category);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!category.isBasicKnowledge && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category._id, category.isBasicKnowledge);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {expandedCategories[category._id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-12 pr-4 pb-4 space-y-3">
                      {/* Quick stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400">
                        <button
                          onClick={() => openCategoryRules(category._id)}
                          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span>View all rules</span>
                        </button>
                      </div>

                      {/* Keywords preview */}
                      {category.keywords?.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="w-3 h-3 text-gray-400" />
                          {category.keywords.slice(0, 8).map((keyword, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {category.keywords.length > 8 && (
                            <span className="text-xs text-gray-400">
                              +{category.keywords.length - 8} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Subcategories */}
                      {category.subcategories?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                            Subcategories
                          </p>
                          {category.subcategories.map((sub) => (
                            <div
                              key={sub._id}
                              className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800/50 rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-gray-700 dark:text-neutral-300">
                                  {sub.name}
                                </span>
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditSubcategory(category._id, sub)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(category._id, sub._id)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add subcategory button */}
                      {isAdmin && (
                        <button
                          onClick={() => openAddSubcategory(category._id)}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add subcategory
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// RULES LIST - Show rules for a category
// ==========================================
const RulesList = ({ category, isAdmin, onBack, onAddRule, onEditRule }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    if (category?._id) {
      fetchRules();
    }
  }, [category]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/rules/category/${category._id}`,
        getAuthHeaders()
      );
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/qa/rules/${ruleId}`,
        getAuthHeaders()
      );
      toast.success('Rule deleted');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchTerm ||
      rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.intent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = !severityFilter || rule.severity_default === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity) => {
    const config = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300'
    };
    return config[severity] || config.medium;
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Category</p>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                {category?.name} - Rules
              </h1>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={onAddRule}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rules..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Rules list */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Shield className="w-12 h-12 text-gray-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {rules.length === 0 ? 'No Rules Yet' : 'No Matching Rules'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
              {rules.length === 0
                ? 'Add your first rule to define evaluation criteria.'
                : 'Try adjusting your search or filters.'}
            </p>
            {isAdmin && rules.length === 0 && (
              <button
                onClick={onAddRule}
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add First Rule
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => (
              <div
                key={rule._id}
                className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {rule.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getSeverityBadge(rule.severity_default)}`}>
                        {rule.severity_default}
                      </span>
                      {rule.subcategory && (
                        <span className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                          {rule.subcategory}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1 line-clamp-2">
                      {rule.intent}
                    </p>
                    {rule.tags?.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {rule.tags.slice(0, 5).map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {rule.tags.length > 5 && (
                          <span className="text-xs text-gray-400">+{rule.tags.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditRule(rule)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// RULE EDITOR - Full Page Component
// ==========================================
const RuleEditor = ({ categoryId, categoryName, rule, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    subcategory: '',
    title: '',
    intent: '',
    rule_text: '',
    steps: [],
    allowed_actions: [],
    disallowed_actions: [],
    conditions: [],
    exceptions: [],
    examples_good: [],
    examples_bad: [],
    tags: '',
    severity_default: 'medium',
    evidence_requirements: '',
    verification_checks: [],
    source_location: {
      source_name: '',
      section: '',
      page: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        subcategory: rule.subcategory || '',
        title: rule.title || '',
        intent: rule.intent || '',
        rule_text: rule.rule_text || '',
        steps: rule.steps || [],
        allowed_actions: rule.allowed_actions || [],
        disallowed_actions: rule.disallowed_actions || [],
        conditions: rule.conditions || [],
        exceptions: rule.exceptions || [],
        examples_good: rule.examples_good || [],
        examples_bad: rule.examples_bad || [],
        tags: (rule.tags || []).join(', '),
        severity_default: rule.severity_default || 'medium',
        evidence_requirements: rule.evidence_requirements || '',
        verification_checks: rule.verification_checks || [],
        source_location: rule.source_location || { source_name: '', section: '', page: '' }
      });
    }
  }, [rule]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.intent.trim()) {
      toast.error('Intent is required');
      return;
    }
    if (!formData.rule_text.trim()) {
      toast.error('Rule text is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        category: categoryId,
        subcategory: formData.subcategory.trim(),
        title: formData.title.trim(),
        intent: formData.intent.trim(),
        rule_text: formData.rule_text.trim(),
        steps: formData.steps.filter(s => s.action?.trim()),
        allowed_actions: formData.allowed_actions.filter(a => a.trim()),
        disallowed_actions: formData.disallowed_actions.filter(a => a.trim()),
        conditions: formData.conditions.filter(c => c.then?.trim()),
        exceptions: formData.exceptions.filter(e => e.description?.trim()),
        examples_good: formData.examples_good.filter(e => e.trim()),
        examples_bad: formData.examples_bad.filter(e => e.trim()),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        severity_default: formData.severity_default,
        evidence_requirements: formData.evidence_requirements.trim(),
        verification_checks: formData.verification_checks.filter(v => v.trim()),
        source_location: formData.source_location
      };

      if (rule) {
        await axios.put(
          `${API_URL}/api/qa/rules/${rule._id}`,
          payload,
          getAuthHeaders()
        );
        toast.success('Rule updated');
      } else {
        await axios.post(
          `${API_URL}/api/qa/rules`,
          payload,
          getAuthHeaders()
        );
        toast.success('Rule created');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(error.response?.data?.message || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  // Array field handlers
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step_number: prev.steps.length + 1, action: '', note: '' }]
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 }))
    }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { if: [{ field: '', operator: '==', value: '' }], then: '', else: '', certainty: 'hard' }]
    }));
  };

  const updateCondition = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, ...updates } : c)
    }));
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addException = () => {
    setFormData(prev => ({
      ...prev,
      exceptions: [...prev.exceptions, { description: '', when: '' }]
    }));
  };

  const updateException = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exceptions: prev.exceptions.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }));
  };

  const removeException = (index) => {
    setFormData(prev => ({
      ...prev,
      exceptions: prev.exceptions.filter((_, i) => i !== index)
    }));
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'steps', label: 'Steps', icon: List },
    { id: 'actions', label: 'Actions', icon: Zap },
    { id: 'conditions', label: 'Conditions', icon: AlertTriangle },
    { id: 'examples', label: 'Examples', icon: Eye },
    { id: 'metadata', label: 'Metadata', icon: Tag }
  ];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">{categoryName}</p>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {rule ? 'Edit Rule' : 'New Rule'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {rule ? 'Save Changes' : 'Create Rule'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-8 py-8">
        {/* Basic Info Section */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., No Password Reset for Social Login Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Password Reset, Social Login"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Default Severity
                </label>
                <select
                  value={formData.severity_default}
                  onChange={(e) => setFormData({ ...formData, severity_default: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Intent <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="What is this rule trying to prevent or ensure? e.g., Prevent agents from sending password reset links to users who signed up via Google/Apple/Facebook."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Rule Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.rule_text}
                onChange={(e) => setFormData({ ...formData, rule_text: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
                placeholder="The complete rule description that AI will use to evaluate tickets..."
              />
            </div>
          </div>
        )}

        {/* Steps Section */}
        {activeSection === 'steps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Procedure Steps</h3>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Define the step-by-step procedure agents should follow</p>
              </div>
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>

            {formData.steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-neutral-400 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-lg">
                No steps defined. Click "Add Step" to add procedure steps.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-medium text-sm">
                      {step.step_number}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={step.action}
                        onChange={(e) => updateStep(index, 'action', e.target.value)}
                        placeholder="Action description..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={step.note || ''}
                        onChange={(e) => updateStep(index, 'note', e.target.value)}
                        placeholder="Optional note..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeStep(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Section */}
        {activeSection === 'actions' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allowed Actions</h3>
              </div>
              <div className="space-y-2">
                {formData.allowed_actions.map((action, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => {
                        const updated = [...formData.allowed_actions];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, allowed_actions: updated });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                      placeholder="Allowed action..."
                    />
                    <button
                      onClick={() => setFormData({ ...formData, allowed_actions: formData.allowed_actions.filter((_, i) => i !== index) })}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, allowed_actions: [...formData.allowed_actions, ''] })}
                  className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add allowed action
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Disallowed Actions</h3>
              </div>
              <div className="space-y-2">
                {formData.disallowed_actions.map((action, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => {
                        const updated = [...formData.disallowed_actions];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, disallowed_actions: updated });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                      placeholder="Disallowed action..."
                    />
                    <button
                      onClick={() => setFormData({ ...formData, disallowed_actions: formData.disallowed_actions.filter((_, i) => i !== index) })}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, disallowed_actions: [...formData.disallowed_actions, ''] })}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <Plus className="w-4 h-4" />
                  Add disallowed action
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conditions Section */}
        {activeSection === 'conditions' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Conditions</h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Define IF/THEN/ELSE logic for this rule</p>
                </div>
                <button
                  onClick={addCondition}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>

              {formData.conditions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  No conditions defined
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Condition {index + 1}</span>
                        <button onClick={() => removeCondition(index)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-neutral-400 w-12">IF</span>
                          <input
                            type="text"
                            value={condition.if?.[0]?.field || ''}
                            onChange={(e) => updateCondition(index, { if: [{ ...condition.if?.[0], field: e.target.value }] })}
                            placeholder="field name"
                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                          />
                          <select
                            value={condition.if?.[0]?.operator || '=='}
                            onChange={(e) => updateCondition(index, { if: [{ ...condition.if?.[0], operator: e.target.value }] })}
                            className="px-2 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                          >
                            <option value="==">=</option>
                            <option value="!=">!=</option>
                            <option value="contains">contains</option>
                            <option value="in">in</option>
                          </select>
                          <input
                            type="text"
                            value={condition.if?.[0]?.value || ''}
                            onChange={(e) => updateCondition(index, { if: [{ ...condition.if?.[0], value: e.target.value }] })}
                            placeholder="value"
                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-neutral-400 w-12">THEN</span>
                          <input
                            type="text"
                            value={condition.then || ''}
                            onChange={(e) => updateCondition(index, { then: e.target.value })}
                            placeholder="Action to take..."
                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-neutral-400 w-12">ELSE</span>
                          <input
                            type="text"
                            value={condition.else || ''}
                            onChange={(e) => updateCondition(index, { else: e.target.value })}
                            placeholder="Alternative action (optional)..."
                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Certainty:</span>
                          <select
                            value={condition.certainty || 'hard'}
                            onChange={(e) => updateCondition(index, { certainty: e.target.value })}
                            className="px-2 py-1 text-sm border rounded bg-white dark:bg-neutral-800"
                          >
                            <option value="hard">Hard (must always apply)</option>
                            <option value="soft">Soft (usually applies)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exceptions</h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">When does this rule NOT apply?</p>
                </div>
                <button
                  onClick={addException}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Exception
                </button>
              </div>

              <div className="space-y-3">
                {formData.exceptions.map((exception, index) => (
                  <div key={index} className="flex gap-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={exception.description || ''}
                        onChange={(e) => updateException(index, 'description', e.target.value)}
                        placeholder="Exception description..."
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                      />
                      <input
                        type="text"
                        value={exception.when || ''}
                        onChange={(e) => updateException(index, 'when', e.target.value)}
                        placeholder="When does this exception apply? (optional)"
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <button onClick={() => removeException(index)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Examples Section */}
        {activeSection === 'examples' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Good Examples</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-3">Examples of correct agent responses</p>
              <div className="space-y-2">
                {formData.examples_good.map((example, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={example}
                      onChange={(e) => {
                        const updated = [...formData.examples_good];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, examples_good: updated });
                      }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10 text-sm"
                      placeholder="Good example response..."
                    />
                    <button
                      onClick={() => setFormData({ ...formData, examples_good: formData.examples_good.filter((_, i) => i !== index) })}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, examples_good: [...formData.examples_good, ''] })}
                  className="flex items-center gap-2 text-sm text-green-600"
                >
                  <Plus className="w-4 h-4" />
                  Add good example
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bad Examples</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-3">Examples of incorrect agent responses</p>
              <div className="space-y-2">
                {formData.examples_bad.map((example, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={example}
                      onChange={(e) => {
                        const updated = [...formData.examples_bad];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, examples_bad: updated });
                      }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10 text-sm"
                      placeholder="Bad example response..."
                    />
                    <button
                      onClick={() => setFormData({ ...formData, examples_bad: formData.examples_bad.filter((_, i) => i !== index) })}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, examples_bad: [...formData.examples_bad, ''] })}
                  className="flex items-center gap-2 text-sm text-red-600"
                >
                  <Plus className="w-4 h-4" />
                  Add bad example
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        {activeSection === 'metadata' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Tags <span className="text-gray-400">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                placeholder="auth_google, social_login, no_password, password_reset"
              />
              <p className="text-xs text-gray-500 mt-1">Tags are used for mandatory rule retrieval based on ticket facts</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Evidence Requirements
              </label>
              <textarea
                value={formData.evidence_requirements}
                onChange={(e) => setFormData({ ...formData, evidence_requirements: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                placeholder="What evidence should AI look for to confirm a violation?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Verification Checks
              </label>
              <div className="space-y-2">
                {formData.verification_checks.map((check, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={check}
                      onChange={(e) => {
                        const updated = [...formData.verification_checks];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, verification_checks: updated });
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-sm"
                      placeholder="Verification check..."
                    />
                    <button
                      onClick={() => setFormData({ ...formData, verification_checks: formData.verification_checks.filter((_, i) => i !== index) })}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, verification_checks: [...formData.verification_checks, ''] })}
                  className="flex items-center gap-2 text-sm text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add verification check
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Source Name
                </label>
                <input
                  type="text"
                  value={formData.source_location.source_name}
                  onChange={(e) => setFormData({ ...formData, source_location: { ...formData.source_location, source_name: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-sm"
                  placeholder="e.g., Company SOP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  value={formData.source_location.section}
                  onChange={(e) => setFormData({ ...formData, source_location: { ...formData.source_location, section: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-sm"
                  placeholder="e.g., Authentication"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Page
                </label>
                <input
                  type="text"
                  value={formData.source_location.page}
                  onChange={(e) => setFormData({ ...formData, source_location: { ...formData.source_location, page: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-sm"
                  placeholder="e.g., 42"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// CATEGORY EDITOR - Full Page Component
// ==========================================
const CategoryEditor = ({ category, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    knowledge: '',
    keywords: '',
    evaluationCriteria: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        knowledge: category.knowledge || '',
        keywords: (category.keywords || []).join(', '),
        evaluationCriteria: category.evaluationCriteria || '',
        images: category.images || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        knowledge: '',
        keywords: '',
        evaluationCriteria: '',
        images: []
      });
    }
  }, [category]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      for (const file of files) {
        const imageData = await uploadTicketImage(file);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            url: imageData.url,
            publicId: imageData.publicId,
            filename: file.name,
            width: imageData.width,
            height: imageData.height,
            format: imageData.format,
            bytes: imageData.bytes
          }]
        }));
      }
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (index) => {
    const image = formData.images[index];

    if (image.publicId) {
      try {
        await deleteImageFromCloudinary(image.publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        knowledge: formData.knowledge.trim(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        evaluationCriteria: formData.evaluationCriteria.trim(),
        images: formData.images
      };

      if (category) {
        await axios.put(
          `${API_URL}/api/qa/knowledge/categories/${category._id}`,
          payload,
          getAuthHeaders()
        );
        toast.success('Category updated');
      } else {
        await axios.post(
          `${API_URL}/api/qa/knowledge/categories`,
          payload,
          getAuthHeaders()
        );
        toast.success('Category created');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {category ? 'Edit Category' : 'New Category'}
              </h1>
              {category?.isBasicKnowledge && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Basic Knowledge - Always sent to AI
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {category ? 'Save Changes' : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Basic Info Section */}
        <section className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            Basic Information
          </h2>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={category?.isBasicKnowledge}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Account Issues, Billing Questions, Technical Support"
              />
              {category?.isBasicKnowledge && (
                <p className="text-xs text-gray-500 mt-1">Basic Knowledge category name cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Brief description of what this category covers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Keywords
                <span className="font-normal text-gray-500 ml-2">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="account, login, password, access, authentication"
              />
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                Keywords help AI identify relevant tickets for this category
              </p>
            </div>
          </div>
        </section>

        {/* Knowledge Section */}
        <section className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            AI Knowledge
          </h2>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                Knowledge Content
              </label>
              <textarea
                value={formData.knowledge}
                onChange={(e) => setFormData({ ...formData, knowledge: e.target.value })}
                rows={12}
                className="w-full px-4 py-4 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm leading-relaxed"
                placeholder="Enter detailed knowledge that AI should use when evaluating tickets in this category..."
              />
              <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
                This knowledge will be provided to AI when evaluating tickets matching this category
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                Evaluation Criteria
              </label>
              <textarea
                value={formData.evaluationCriteria}
                onChange={(e) => setFormData({ ...formData, evaluationCriteria: e.target.value })}
                rows={8}
                className="w-full px-4 py-4 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
                placeholder="Define what makes a good vs bad response in this category..."
              />
              <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
                Criteria for AI to evaluate ticket responses - define what's good and what's problematic
              </p>
            </div>
          </div>
        </section>

        {/* Images Section */}
        <section className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            Reference Images
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              Add images that AI can reference when evaluating tickets (e.g., screenshots of UI, examples of correct responses)
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.filename || `Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-neutral-700"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {image.filename || 'Image'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// ==========================================
// SUBCATEGORY EDITOR - Full Page Component
// ==========================================
const SubcategoryEditor = ({ categoryId, categoryName, subcategory, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    knowledge: '',
    keywords: '',
    examples: '',
    evaluationCriteria: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name || '',
        description: subcategory.description || '',
        knowledge: subcategory.knowledge || '',
        keywords: (subcategory.keywords || []).join(', '),
        examples: (subcategory.examples || []).join('\n'),
        evaluationCriteria: subcategory.evaluationCriteria || '',
        images: subcategory.images || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        knowledge: '',
        keywords: '',
        examples: '',
        evaluationCriteria: '',
        images: []
      });
    }
  }, [subcategory]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      for (const file of files) {
        const imageData = await uploadTicketImage(file);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            url: imageData.url,
            publicId: imageData.publicId,
            filename: file.name,
            width: imageData.width,
            height: imageData.height,
            format: imageData.format,
            bytes: imageData.bytes
          }]
        }));
      }
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (index) => {
    const image = formData.images[index];

    if (image.publicId) {
      try {
        await deleteImageFromCloudinary(image.publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        knowledge: formData.knowledge.trim(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        examples: formData.examples.split('\n').map(e => e.trim()).filter(Boolean),
        evaluationCriteria: formData.evaluationCriteria.trim(),
        images: formData.images
      };

      if (subcategory) {
        await axios.put(
          `${API_URL}/api/qa/knowledge/categories/${categoryId}/subcategories/${subcategory._id}`,
          payload,
          getAuthHeaders()
        );
        toast.success('Subcategory updated');
      } else {
        await axios.post(
          `${API_URL}/api/qa/knowledge/categories/${categoryId}/subcategories`,
          payload,
          getAuthHeaders()
        );
        toast.success('Subcategory created');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast.error(error.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {categoryName}
              </p>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {subcategory ? 'Edit Subcategory' : 'New Subcategory'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {subcategory ? 'Save Changes' : 'Create Subcategory'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Basic Info Section */}
        <section className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Basic Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Subcategory Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Password Reset, Account Lockout, Two-Factor Authentication"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Brief description of what this subcategory covers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Keywords
                <span className="font-normal text-gray-500 ml-2">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="reset, forgot, change password, cannot login"
              />
            </div>
          </div>
        </section>

        {/* Knowledge Section */}
        <section className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            AI Knowledge
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Knowledge Content
              </label>
              <textarea
                value={formData.knowledge}
                onChange={(e) => setFormData({ ...formData, knowledge: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
                placeholder="Enter specific knowledge for this subcategory..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Evaluation Criteria
              </label>
              <textarea
                value={formData.evaluationCriteria}
                onChange={(e) => setFormData({ ...formData, evaluationCriteria: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="What makes a good vs bad response for this specific issue..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Example Responses
                <span className="font-normal text-gray-500 ml-2">(one per line)</span>
              </label>
              <textarea
                value={formData.examples}
                onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Example good response for this type of ticket"
              />
            </div>
          </div>
        </section>

        {/* Images Section */}
        <section className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            Reference Images
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              Add images specific to this subcategory (e.g., UI screenshots, workflow diagrams)
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.filename || `Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-neutral-700"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {image.filename || 'Image'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default QAKnowledgeBase;
