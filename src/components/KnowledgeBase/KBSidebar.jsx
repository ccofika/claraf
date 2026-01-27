import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, ChevronLeft, Search,
  Book, Settings, Menu, X, Plus, MoreHorizontal,
  Edit, Trash2, GripVertical, Home
} from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import { toast } from 'sonner';

// Context Menu Portal Component
const ContextMenu = ({ position, onClose, onEdit, onDelete, isSection }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
        rounded-lg shadow-xl py-1 min-w-36"
      style={{ top: position.y, left: position.x }}
    >
      {!isSection && (
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300
            hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <Edit size={14} />
          Edit Page
        </button>
      )}
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600
          hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 size={14} />
        Delete {isSection ? 'Section' : 'Page'}
      </button>
    </div>,
    document.body
  );
};

// Section Header Component (not a page, just a label)
const SectionHeader = ({ section, onAddPage, onDelete, onRename, onDrop, onDragEnter, onDragLeave, isDropTarget, isAdmin }) => {
  const [menuPosition, setMenuPosition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editName.trim() && editName !== section.name) {
      onRename(section.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    onDragEnter?.(section.id);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    onDragLeave?.();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(section.id);
  };

  return (
    <div
      className={`group mt-6 mb-2 first:mt-2 transition-colors ${isDropTarget ? 'bg-blue-50 dark:bg-blue-900/20 rounded-md' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 px-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setEditName(section.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wider
              bg-transparent border-b border-blue-500 focus:outline-none
              text-gray-500 dark:text-neutral-400"
          />
        ) : (
          <span
            className="flex-1 text-[11px] font-semibold uppercase tracking-wider
              text-gray-400 dark:text-neutral-500 cursor-default"
            onDoubleClick={() => isAdmin && setIsEditing(true)}
          >
            {section.name}
          </span>
        )}

        {isAdmin && !isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => onAddPage(section.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-400 hover:text-green-600"
              title="Add page to section"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({ x: rect.right - 140, y: rect.bottom + 4 });
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-400"
            >
              <MoreHorizontal size={12} />
            </button>
          </div>
        )}
      </div>

      {menuPosition && (
        <ContextMenu
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
          onEdit={() => {
            setMenuPosition(null);
            setIsEditing(true);
          }}
          onDelete={() => {
            setMenuPosition(null);
            onDelete(section.id);
          }}
          isSection={true}
        />
      )}
    </div>
  );
};

// Page Item Component
const PageItem = ({
  page,
  level = 0,
  currentSlug,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  draggingId,
  dropTargetId,
  isAdmin,
  expandedNodes,
  toggleNode
}) => {
  const navigate = useNavigate();
  const [menuPosition, setMenuPosition] = useState(null);
  const isActive = currentSlug === page.slug;
  const isDragging = draggingId === page._id;
  const isDropTarget = dropTargetId === page._id;
  const hasChildren = page.children && page.children.length > 0;
  const isExpanded = expandedNodes.has(page._id);

  return (
    <div>
      <div
        draggable={isAdmin}
        onDragStart={(e) => isAdmin && onDragStart(e, page)}
        onDragOver={(e) => isAdmin && onDragOver(e, page)}
        onDragLeave={(e) => isAdmin && onDragLeave(e)}
        onDrop={(e) => isAdmin && onDrop(e, page)}
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all
          ${isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-neutral-300'
          }
          ${isDragging ? 'opacity-40' : ''}
          ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {/* Drag Handle */}
        {isAdmin && (
          <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0 -ml-1">
            <GripVertical size={12} className="text-gray-300 dark:text-neutral-600" />
          </div>
        )}

        {/* Expand/Collapse for nested pages */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(page._id);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded flex-shrink-0"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* Icon & Title */}
        <span className="text-base flex-shrink-0">{page.icon || '📄'}</span>
        <span
          className="text-[13px] truncate flex-1 font-medium"
          onClick={() => navigate(`/knowledge-base/${page.slug}`)}
        >
          {page.title}
        </span>

        {/* Actions */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPosition({ x: Math.min(rect.right, window.innerWidth - 150), y: rect.bottom + 4 });
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded text-gray-400"
          >
            <MoreHorizontal size={12} />
          </button>
        )}
      </div>

      {/* Context Menu */}
      {menuPosition && (
        <ContextMenu
          position={menuPosition}
          onClose={() => setMenuPosition(null)}
          onEdit={() => {
            setMenuPosition(null);
            onEdit(page._id);
          }}
          onDelete={() => {
            setMenuPosition(null);
            onDelete(page._id, page.title);
          }}
          isSection={false}
        />
      )}

      {/* Nested pages */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {page.children.map(child => (
              <PageItem
                key={child._id}
                page={child}
                level={level + 1}
                currentSlug={currentSlug}
                onEdit={onEdit}
                onDelete={onDelete}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                draggingId={draggingId}
                dropTargetId={dropTargetId}
                isAdmin={isAdmin}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const KBSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    pageTree,
    isAdmin,
    loading,
    sidebarCollapsed,
    setSidebarCollapsed,
    createPage,
    deletePage,
    reorderPage,
    updatePageSection,
    fetchPageTree,
    sections,
    setSections,
    addSection,
    removeSection,
    renameSection
  } = useKnowledgeBase();

  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageIcon, setNewPageIcon] = useState('📄');
  const [newPageSection, setNewPageSection] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropSectionId, setDropSectionId] = useState(null);

  const currentSlug = location.pathname.replace('/knowledge-base/', '').replace('/knowledge-base', '');

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // Filter pages by search
  const filterTree = useMemo(() => {
    const filter = (nodes, query) => {
      if (!query) return nodes;
      return nodes.filter(node => {
        const matches = node.title.toLowerCase().includes(query.toLowerCase());
        const filteredChildren = node.children ? filter(node.children, query) : [];
        return matches || filteredChildren.length > 0;
      }).map(node => ({
        ...node,
        children: node.children ? filter(node.children, query) : []
      }));
    };
    return filter(pageTree, searchQuery);
  }, [pageTree, searchQuery]);

  // Group pages by section
  const groupedPages = useMemo(() => {
    const result = {
      unsectioned: [],
      sections: {}
    };

    // Initialize sections
    (sections || []).forEach(s => {
      result.sections[s.id] = { ...s, pages: [] };
    });

    // Group pages
    filterTree.forEach(page => {
      if (page.sectionId && result.sections[page.sectionId]) {
        result.sections[page.sectionId].pages.push(page);
      } else {
        result.unsectioned.push(page);
      }
    });

    return result;
  }, [filterTree, sections]);

  // Create page handler
  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setCreating(true);
      const page = await createPage({
        title: newPageTitle.trim(),
        icon: newPageIcon,
        sectionId: newPageSection,
        blocks: [],
        dropdowns: []
      });
      toast.success('Page created');
      setShowCreateModal(false);
      setNewPageTitle('');
      setNewPageIcon('📄');
      setNewPageSection(null);
      navigate(`/knowledge-base/${page.slug}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (pageId, pageTitle) => {
    if (!window.confirm(`Delete "${pageTitle}"?`)) return;
    try {
      await deletePage(pageId);
      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (pageId) => {
    navigate(`/knowledge-base/admin?edit=${pageId}`);
  };

  const handleAddSection = () => {
    const name = prompt('Section name:');
    if (name?.trim()) {
      addSection(name.trim());
    }
  };

  const handleDeleteSection = (sectionId) => {
    if (window.confirm('Delete this section? Pages will be moved to unsectioned.')) {
      removeSection(sectionId);
    }
  };

  const handleAddPageToSection = (sectionId) => {
    setNewPageSection(sectionId);
    setShowCreateModal(true);
  };

  // Drag handlers
  const handleDragStart = (e, node) => {
    if (!node || !isAdmin) return;
    setDraggingNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetNode) => {
    e.preventDefault();
    if (!draggingNode || !isAdmin || draggingNode._id === targetNode._id) return;
    setDropTargetId(targetNode._id);
  };

  const handleDragLeave = () => setDropTargetId(null);

  const handleDrop = async (e, targetNode) => {
    e.preventDefault();
    if (!draggingNode || !isAdmin || draggingNode._id === targetNode._id) {
      setDraggingNode(null);
      setDropTargetId(null);
      return;
    }

    try {
      await reorderPage(draggingNode._id, 0, targetNode._id);
      setExpandedNodes(prev => new Set([...prev, targetNode._id]));
      toast.success('Moved');
      await fetchPageTree();
    } catch (error) {
      toast.error('Failed to move');
    }

    setDraggingNode(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggingNode(null);
    setDropTargetId(null);
    setDropSectionId(null);
  };

  const handleDropOnSection = async (sectionId) => {
    if (!draggingNode || !isAdmin) return;

    try {
      await updatePageSection(draggingNode._id, sectionId);
      toast.success('Page moved to section');
    } catch (error) {
      toast.error('Failed to move page');
    }

    setDraggingNode(null);
    setDropTargetId(null);
    setDropSectionId(null);
  };

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-neutral-800/50">
        {!sidebarCollapsed && (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/knowledge-base')}
          >
            <Book size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              Knowledge Base
            </span>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400"
        >
          <ChevronLeft size={16} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {!sidebarCollapsed && (
        <>
          {/* Home */}
          <div className="px-3 pt-3">
            <button
              onClick={() => navigate('/knowledge-base')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-[13px] font-medium transition-colors
                ${!currentSlug || currentSlug === '/'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/50'
                }`}
            >
              <Home size={16} />
              Home
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-neutral-900
                  border border-gray-200 dark:border-neutral-800 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="px-3 pb-3 flex gap-2">
              <button
                onClick={() => {
                  setNewPageSection(null);
                  setShowCreateModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                  bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-medium transition-colors"
              >
                <Plus size={14} />
                New Page
              </button>
              <button
                onClick={handleAddSection}
                className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700
                  text-gray-700 dark:text-neutral-300 rounded-lg text-[13px] font-medium transition-colors"
                title="Add section header"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Pages */}
      <div className="flex-1 overflow-y-auto px-3 pb-3" onDragEnd={handleDragEnd}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : sidebarCollapsed ? (
          <div className="space-y-1 pt-2">
            <button
              onClick={() => navigate('/knowledge-base')}
              className={`w-full p-2 rounded-lg transition-colors ${
                !currentSlug ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Home size={18} className="mx-auto text-gray-600 dark:text-neutral-400" />
            </button>
            {pageTree.slice(0, 8).map(node => (
              <button
                key={node._id}
                onClick={() => navigate(`/knowledge-base/${node.slug}`)}
                className={`w-full p-2 rounded-lg transition-colors ${
                  currentSlug === node.slug
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
                title={node.title}
              >
                <span className="text-lg">{node.icon || '📄'}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Unsectioned pages first */}
            {groupedPages.unsectioned.length > 0 && (
              <div className="space-y-0.5">
                {groupedPages.unsectioned.map(page => (
                  <PageItem
                    key={page._id}
                    page={page}
                    currentSlug={currentSlug}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    draggingId={draggingNode?._id}
                    dropTargetId={dropTargetId}
                    isAdmin={isAdmin}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                  />
                ))}
              </div>
            )}

            {/* Sections with their pages */}
            {Object.values(groupedPages.sections).map(section => (
              <div key={section.id}>
                <SectionHeader
                  section={section}
                  onAddPage={handleAddPageToSection}
                  onDelete={handleDeleteSection}
                  onRename={renameSection}
                  onDrop={handleDropOnSection}
                  onDragEnter={draggingNode ? setDropSectionId : undefined}
                  onDragLeave={draggingNode ? () => setDropSectionId(null) : undefined}
                  isDropTarget={dropSectionId === section.id && draggingNode}
                  isAdmin={isAdmin}
                />
                <div className="space-y-0.5">
                  {section.pages.map(page => (
                    <PageItem
                      key={page._id}
                      page={page}
                      currentSlug={currentSlug}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      draggingId={draggingNode?._id}
                      dropTargetId={dropTargetId}
                      isAdmin={isAdmin}
                      expandedNodes={expandedNodes}
                      toggleNode={toggleNode}
                    />
                  ))}
                  {section.pages.length === 0 && (
                    <div className="px-2 py-2 text-[12px] text-gray-400 dark:text-neutral-600 italic">
                      No pages in this section
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filterTree.length === 0 && Object.keys(groupedPages.sections).length === 0 && (
              <div className="text-center py-8 text-[13px] text-gray-400 dark:text-neutral-500">
                {searchQuery ? 'No pages found' : 'No pages yet'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Link */}
      {isAdmin && !sidebarCollapsed && (
        <div className="p-3 border-t border-gray-100 dark:border-neutral-800/50">
          <button
            onClick={() => navigate('/knowledge-base/admin')}
            className="flex items-center gap-2 w-full px-2 py-2 text-[13px] text-gray-500 dark:text-neutral-400
              hover:bg-gray-100 dark:hover:bg-neutral-800/50 rounded-lg transition-colors"
          >
            <Settings size={14} />
            Admin Panel
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-lg
          border border-gray-200 dark:border-neutral-700 md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-950
                border-r border-gray-200 dark:border-neutral-800 md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block h-full border-r border-gray-100 dark:border-neutral-800/50
          bg-gray-50/50 dark:bg-neutral-950 transition-all duration-200
          ${sidebarCollapsed ? 'w-14' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Create Page Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowCreateModal(false);
              setNewPageTitle('');
              setNewPageSection(null);
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Create New Page
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
              Add a new page to your knowledge base
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={newPageIcon}
                    onChange={(e) => setNewPageIcon(e.target.value)}
                    className="w-14 h-12 text-2xl text-center bg-gray-50 dark:bg-neutral-800
                      border border-gray-200 dark:border-neutral-700 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Page title..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800
                      border border-gray-200 dark:border-neutral-700 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPageTitle.trim()) handleCreatePage();
                      if (e.key === 'Escape') {
                        setShowCreateModal(false);
                        setNewPageTitle('');
                      }
                    }}
                  />
                </div>
              </div>

              {sections && sections.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                    Section (optional)
                  </label>
                  <select
                    value={newPageSection || ''}
                    onChange={(e) => setNewPageSection(e.target.value || null)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800
                      border border-gray-200 dark:border-neutral-700 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
                  >
                    <option value="">No section</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPageTitle('');
                  setNewPageSection(null);
                }}
                className="px-5 py-2.5 text-gray-600 dark:text-neutral-400 hover:bg-gray-100
                  dark:hover:bg-neutral-800 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePage}
                disabled={creating || !newPageTitle.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                  font-medium disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Page'}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
};

export default KBSidebar;
