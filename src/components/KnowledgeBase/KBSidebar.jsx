import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, ChevronLeft, Search,
  Book, Settings, Menu, X, Plus, MoreHorizontal,
  Edit, Trash2, GripVertical, Home, Star, Clock, Tag,
  FilePlus, ArrowUpToLine
} from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import { toast } from 'sonner';

// Helper: Get the depth of the deepest descendant in a node's subtree
const getSubtreeDepth = (node) => {
  if (!node?.children || node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(getSubtreeDepth));
};

// Helper: Check if nodeId is a descendant of ancestorId in the tree
const isNodeDescendant = (tree, nodeId, ancestorId) => {
  const findNode = (nodes, id) => {
    for (const n of nodes) {
      if (n._id === id) return n;
      if (n.children) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  const checkDescendants = (node, targetId) => {
    if (!node.children) return false;
    for (const child of node.children) {
      if (child._id === targetId) return true;
      if (checkDescendants(child, targetId)) return true;
    }
    return false;
  };
  const ancestor = findNode(tree, ancestorId);
  return ancestor ? checkDescendants(ancestor, nodeId) : false;
};

// Context Menu Portal Component
const ContextMenu = ({ position, onClose, onEdit, onDelete, onAddSubPage, onMoveToRoot, isSection, hasParent }) => {
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
        rounded-lg shadow-xl py-1 min-w-44"
      style={{ top: position.y, left: position.x }}
    >
      {!isSection && (
        <>
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300
              hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <Edit size={14} />
            Edit Page
          </button>
          <button
            onClick={onAddSubPage}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300
              hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <FilePlus size={14} />
            Add Sub-page
          </button>
          {hasParent && (
            <button
              onClick={onMoveToRoot}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300
                hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              <ArrowUpToLine size={14} />
              Move to Root
            </button>
          )}
          <div className="my-1 border-t border-gray-100 dark:border-neutral-800" />
        </>
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

// Page Item Component with position-based drop zones
const PageItem = ({
  page,
  level = 0,
  currentSlug,
  onEdit,
  onDelete,
  onAddSubPage,
  onMoveToRoot,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  draggingId,
  dropTargetId,
  dropPosition,
  maxInsideLevel,
  maxBesideLevel,
  isAdmin,
  expandedNodes,
  toggleNode
}) => {
  const navigate = useNavigate();
  const [menuPosition, setMenuPosition] = useState(null);
  const isActive = currentSlug === page.slug;
  const isDragging = draggingId === page._id;
  const isDropAbove = dropTargetId === page._id && dropPosition === 'above';
  const isDropInside = dropTargetId === page._id && dropPosition === 'inside';
  const isDropBelow = dropTargetId === page._id && dropPosition === 'below';
  const hasChildren = page.children && page.children.length > 0;
  const isExpanded = expandedNodes.has(page._id);

  const canInside = level <= maxInsideLevel;
  const canBeside = level <= maxBesideLevel;

  const handleDragOverLocal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position;
    if (canInside) {
      // Three zones: top 25% = above, middle 50% = inside, bottom 25% = below
      if (y < height * 0.25) position = 'above';
      else if (y > height * 0.75) position = 'below';
      else position = 'inside';
    } else {
      // Can't nest inside - split into above/below at 50%
      position = y < height * 0.5 ? 'above' : 'below';
    }

    if ((position === 'above' || position === 'below') && !canBeside) return;

    // Parent's handleDragOver uses refs to check dragging node (avoids React timing issues)
    onDragOver(e, page, position);
  };

  return (
    <div>
      <div
        draggable={isAdmin ? "true" : undefined}
        onDragStart={(e) => { if (isAdmin) onDragStart(e, page); }}
        onDragOver={handleDragOverLocal}
        onDragLeave={(e) => { if (isAdmin) onDragLeave(e); }}
        onDrop={(e) => { if (isAdmin) onDrop(e, page); }}
        className={`group relative flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all
          ${isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-neutral-300'
          }
          ${isDragging ? 'opacity-40' : ''}
          ${isDropInside ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {/* Drop indicator: above */}
        {isDropAbove && (
          <div
            className="absolute top-0 right-0 h-0.5 bg-blue-500 rounded-full pointer-events-none z-10"
            style={{ left: `${8 + level * 16}px` }}
          />
        )}
        {/* Drop indicator: below */}
        {isDropBelow && (
          <div
            className="absolute bottom-0 right-0 h-0.5 bg-blue-500 rounded-full pointer-events-none z-10"
            style={{ left: `${8 + level * 16}px` }}
          />
        )}

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
          onAddSubPage={() => {
            setMenuPosition(null);
            onAddSubPage?.(page._id);
          }}
          onMoveToRoot={() => {
            setMenuPosition(null);
            onMoveToRoot?.(page._id);
          }}
          isSection={false}
          hasParent={!!page.parentPage}
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
                onAddSubPage={onAddSubPage}
                onMoveToRoot={onMoveToRoot}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                draggingId={draggingId}
                dropTargetId={dropTargetId}
                dropPosition={dropPosition}
                maxInsideLevel={maxInsideLevel}
                maxBesideLevel={maxBesideLevel}
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
    sections,
    setSections,
    addSection,
    removeSection,
    renameSection,
    favorites,
    recentPages,
    allTags,
    fetchAllTags
  } = useKnowledgeBase();

  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageIcon, setNewPageIcon] = useState('📄');
  const [newPageSection, setNewPageSection] = useState(null);
  const [newPageParent, setNewPageParent] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draggingNode, setDraggingNode] = useState(null);
  const draggingRef = useRef(null); // Ref for immediate access (avoids React batching delay)
  const dropPositionRef = useRef(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'above' | 'inside' | 'below'
  const [dropSectionId, setDropSectionId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showTags, setShowTags] = useState(false);

  // Depth constraints for drag-and-drop (max 3 levels: root=0, sub=1, sub-sub=2)
  const dragSubtreeDepth = useMemo(() => {
    return draggingNode ? getSubtreeDepth(draggingNode) : 0;
  }, [draggingNode]);
  const maxInsideLevel = 1 - dragSubtreeDepth;  // target level must be <= this for "inside" drops
  const maxBesideLevel = 2 - dragSubtreeDepth;  // target level must be <= this for "above"/"below" drops

  const currentSlug = location.pathname.replace('/knowledge-base/', '').replace('/knowledge-base', '');

  // Fetch all tags for filtering
  useEffect(() => {
    if (fetchAllTags) fetchAllTags();
  }, [fetchAllTags]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // Filter pages by search and tag
  const filterTree = useMemo(() => {
    const filter = (nodes, query, tag) => {
      if (!query && !tag) return nodes;
      return nodes.filter(node => {
        const matchesSearch = !query || node.title.toLowerCase().includes(query.toLowerCase());
        const matchesTag = !tag || (node.tags && node.tags.includes(tag));
        const filteredChildren = node.children ? filter(node.children, query, tag) : [];
        return (matchesSearch && matchesTag) || filteredChildren.length > 0;
      }).map(node => ({
        ...node,
        children: node.children ? filter(node.children, query, tag) : []
      }));
    };
    return filter(pageTree, searchQuery, selectedTag);
  }, [pageTree, searchQuery, selectedTag]);

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
        parentPage: newPageParent || null,
        blocks: [],
        dropdowns: []
      });
      toast.success('Page created');
      setShowCreateModal(false);
      setNewPageTitle('');
      setNewPageIcon('📄');
      setNewPageSection(null);
      setNewPageParent(null);
      if (newPageParent) {
        setExpandedNodes(prev => new Set([...prev, newPageParent]));
      }
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

  const handleAddSubPage = (parentId) => {
    setNewPageParent(parentId);
    setNewPageSection(null);
    setShowCreateModal(true);
  };

  const handleMoveToRoot = async (pageId) => {
    try {
      await reorderPage(pageId, -1, null, null);
      toast.success('Moved to root');
    } catch (error) {
      toast.error('Failed to move');
    }
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
    setNewPageParent(null);
    setShowCreateModal(true);
  };

  // Drag helpers
  const resetDragState = () => {
    draggingRef.current = null;
    dropPositionRef.current = null;
    setDraggingNode(null);
    setDropTargetId(null);
    setDropPosition(null);
    setDropSectionId(null);
  };

  // Drag handlers (use refs for immediate access, state for React re-renders/visuals)
  const handleDragStart = (e, node) => {
    if (!node || !isAdmin) return;
    draggingRef.current = node;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node._id);
    // Delay state update so DOM doesn't change during dragstart (would cancel the drag)
    requestAnimationFrame(() => {
      setDraggingNode(node);
    });
  };

  const handleDragOver = (e, targetNode, position) => {
    e.preventDefault();
    const dragging = draggingRef.current;
    if (!dragging || !isAdmin || dragging._id === targetNode._id) return;
    // Prevent dropping on own descendants (would create cycle)
    if (isNodeDescendant(pageTree, targetNode._id, dragging._id)) return;
    dropPositionRef.current = position;
    setDropTargetId(targetNode._id);
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleDrop = async (e, targetNode) => {
    e.preventDefault();
    e.stopPropagation();
    const dragging = draggingRef.current;
    const pos = dropPositionRef.current || 'inside'; // fallback to old behavior
    if (!dragging || !isAdmin || dragging._id === targetNode._id) {
      resetDragState();
      return;
    }
    // Prevent dropping on own descendants
    if (isNodeDescendant(pageTree, targetNode._id, dragging._id)) {
      resetDragState();
      return;
    }

    try {
      let newParentPage, newOrder, newSectionId;

      if (pos === 'inside') {
        // Make it a child of the target
        newParentPage = targetNode._id;
        newOrder = -1; // append at end
        newSectionId = null;
        setExpandedNodes(prev => new Set([...prev, targetNode._id]));
      } else {
        // 'above' or 'below' — insert at same level as target
        newParentPage = targetNode.parentPage || null;

        // Adjust order for same-parent moves (remove-then-insert)
        const dragParent = dragging.parentPage ? String(dragging.parentPage) : null;
        const targetParent = targetNode.parentPage ? String(targetNode.parentPage) : null;
        const sameParent = dragParent === targetParent;
        const draggedBefore = sameParent && dragging.order < targetNode.order;

        if (pos === 'above') {
          newOrder = draggedBefore ? targetNode.order - 1 : targetNode.order;
        } else {
          newOrder = draggedBefore ? targetNode.order : targetNode.order + 1;
        }

        // Section handling: root-level pages inherit target's section
        if (newParentPage) {
          newSectionId = null; // sub-pages don't need section
        } else {
          newSectionId = targetNode.sectionId || null;
        }
      }

      await reorderPage(dragging._id, newOrder, newParentPage, newSectionId);
      toast.success('Moved');
    } catch (error) {
      toast.error('Failed to move');
    }

    resetDragState();
  };

  const handleDragEnd = () => resetDragState();

  const handleDropOnSection = async (sectionId) => {
    const dragging = draggingRef.current;
    if (!dragging || !isAdmin) return;

    try {
      // Move to root level and assign section (also un-nests sub-pages)
      await reorderPage(dragging._id, -1, null, sectionId);
      toast.success('Page moved to section');
    } catch (error) {
      toast.error('Failed to move page');
    }

    resetDragState();
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

          {/* Search - opens floating search bar */}
          <div className="px-3 py-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('focus-kb-search'))}
              className="w-full flex items-center gap-2 pl-2.5 pr-3 py-2 text-[13px]
                bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800
                rounded-lg text-gray-400 hover:text-gray-500 dark:hover:text-gray-300
                hover:border-gray-300 dark:hover:border-neutral-700 transition-colors text-left"
            >
              <Search size={14} className="shrink-0" />
              <span className="flex-1">Search...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded font-mono">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="px-3 pb-3 flex gap-2">
              <button
                onClick={() => {
                  setNewPageSection(null);
                  setNewPageParent(null);
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

      {/* Tag Filter */}
      {!sidebarCollapsed && allTags?.length > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1.5 px-1 py-1 text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-medium w-full"
          >
            <Tag size={10} />
            Tags
            <ChevronRight size={10} className={`ml-auto transition-transform ${showTags ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {showTags && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 py-1.5">
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="px-2 py-0.5 text-[11px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
                        border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  {allTags.slice(0, 20).map(tag => {
                    const tagName = typeof tag === 'string' ? tag : tag.name || tag._id;
                    const isActive = selectedTag === tagName;
                    return (
                      <button
                        key={tagName}
                        onClick={() => setSelectedTag(isActive ? null : tagName)}
                        className={`px-2 py-0.5 text-[11px] rounded-md transition-colors border ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {tagName}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Favorites & Recent - only when expanded */}
      {!sidebarCollapsed && (favorites?.length > 0 || recentPages?.length > 0) && (
        <div className="px-3 pb-2 space-y-2 border-b border-gray-100 dark:border-neutral-800/50 mb-1">
          {/* Favorites */}
          {favorites?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-medium">
                <Star size={10} />
                Favorites
              </div>
              <div className="space-y-0.5">
                {favorites.slice(0, 5).map(fav => (
                  <button
                    key={fav._id}
                    onClick={() => navigate(`/knowledge-base/${fav.slug}`)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors truncate
                      ${currentSlug === fav.slug
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/50'
                      }`}
                  >
                    <span className="text-sm">{fav.icon || '📄'}</span>
                    <span className="truncate">{fav.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Pages */}
          {recentPages?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-medium">
                <Clock size={10} />
                Recent
              </div>
              <div className="space-y-0.5">
                {recentPages.slice(0, 4).map(item => {
                  const page = item.page || item;
                  return (
                    <button
                      key={page._id}
                      onClick={() => navigate(`/knowledge-base/${page.slug}`)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors truncate
                        ${currentSlug === page.slug
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/50'
                        }`}
                    >
                      <span className="text-sm">{page.icon || '📄'}</span>
                      <span className="truncate">{page.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('focus-kb-search'))}
              className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search size={18} className="mx-auto text-gray-600 dark:text-neutral-400" />
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
            {/* Root Drop Zone - drag pages here to move to root level (no section) */}
            {isAdmin && draggingNode && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDropTargetId('__root__'); }}
                onDragLeave={() => { setDropTargetId(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragging = draggingRef.current;
                  if (dragging) {
                    reorderPage(dragging._id, -1, null, null)
                      .then(() => toast.success('Moved to root'))
                      .catch(() => toast.error('Failed to move'));
                  }
                  resetDragState();
                }}
                className={`mb-2 px-3 py-2 rounded-lg border-2 border-dashed text-center text-[12px] transition-colors ${
                  dropTargetId === '__root__'
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-neutral-500'
                }`}
              >
                Drop here to move to root level
              </div>
            )}

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
                    onAddSubPage={handleAddSubPage}
                    onMoveToRoot={handleMoveToRoot}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    draggingId={draggingNode?._id}
                    dropTargetId={dropTargetId}
                    dropPosition={dropPosition}
                    maxInsideLevel={maxInsideLevel}
                    maxBesideLevel={maxBesideLevel}
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
                      onAddSubPage={handleAddSubPage}
                      onMoveToRoot={handleMoveToRoot}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      draggingId={draggingNode?._id}
                      dropTargetId={dropTargetId}
                      dropPosition={dropPosition}
                      maxInsideLevel={maxInsideLevel}
                      maxBesideLevel={maxBesideLevel}
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
                {selectedTag ? 'No pages found' : 'No pages yet'}
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
              setNewPageParent(null);
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {newPageParent ? 'Create Sub-page' : 'Create New Page'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
              {newPageParent
                ? 'Add a nested sub-page under the selected parent'
                : 'Add a new page to your knowledge base'}
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
                        setNewPageParent(null);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Parent Page selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                  Parent Page (optional)
                </label>
                <select
                  value={newPageParent || ''}
                  onChange={(e) => setNewPageParent(e.target.value || null)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800
                    border border-gray-200 dark:border-neutral-700 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]"
                >
                  <option value="">No parent (root level)</option>
                  {(() => {
                    const flatList = [];
                    const flatten = (nodes, depth = 0) => {
                      if (!nodes) return;
                      for (const n of nodes) {
                        flatList.push({ _id: n._id, title: n.title, icon: n.icon, depth });
                        if (n.children) flatten(n.children, depth + 1);
                      }
                    };
                    flatten(pageTree);
                    return flatList.map(p => (
                      <option key={p._id} value={p._id}>
                        {'  '.repeat(p.depth)}{p.icon || '📄'} {p.title}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {sections && sections.length > 0 && !newPageParent && (
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
                  setNewPageParent(null);
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
                {creating ? 'Creating...' : newPageParent ? 'Create Sub-page' : 'Create Page'}
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
