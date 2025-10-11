import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import DeleteBookmarkDialog from './DeleteBookmarkDialog';
import PendingInvites from './PendingInvites';
import {
  Home,
  Calculator,
  Search as SearchIcon,
  Link as LinkIcon,
  ChevronDown as ChevronDownIcon,
  AddLarge,
  User as UserIcon,
  Logout,
  Edit,
  TrashCan,
  Bookmark as BookmarkIcon,
  Checkmark,
  Close,
  Settings,
} from '@carbon/icons-react';

const softSpringEasing = 'cubic-bezier(0.25, 1.1, 0.4, 1)';

/* ------------------------------ Avatar -------------------------------- */
function AvatarCircle({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-full shrink-0 size-8 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-center size-8">
        <UserIcon size={16} className="text-gray-700 dark:text-neutral-300" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-gray-300 dark:border-neutral-700 pointer-events-none"
      />
    </button>
  );
}

/* ---------------------------- Left Icon Nav -------------------------- */
function IconNavButton({ children, isActive = false, onClick }) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center rounded-lg size-10 min-w-10 transition-colors duration-500
        ${isActive ? 'bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-neutral-50' : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50'}`}
      style={{ transitionTimingFunction: softSpringEasing }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconNavigation({ activeSection, onSectionChange, onOpenProfile }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'workspaces', icon: <Home size={16} className="text-gray-900 dark:text-neutral-50" />, label: 'Workspaces' },
    { id: 'vip-calculator', icon: <Calculator size={16} className="text-gray-900 dark:text-neutral-50" />, label: 'VIP Progress Calculator' },
    { id: 'hash-explorer', icon: <SearchIcon size={16} className="text-gray-900 dark:text-neutral-50" />, label: 'Hash Explorer Finder' },
    { id: 'quick-links', icon: <LinkIcon size={16} className="text-gray-900 dark:text-neutral-50" />, label: 'Quick Links' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="bg-white dark:bg-black flex flex-col gap-2 items-center p-4 w-16 h-screen border-r border-gray-200 dark:border-neutral-800">
      {/* Navigation Icons */}
      <div className="flex flex-col gap-2 w-full items-center">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>
      <div className="flex-1" />
      {/* Bottom section */}
      <div className="flex flex-col gap-2 w-full items-center">
        <IconNavButton onClick={handleLogout}>
          <Logout size={16} className="text-gray-900 dark:text-neutral-50" />
        </IconNavButton>
        <div className="size-8">
          <AvatarCircle onClick={onOpenProfile} />
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------ Right Sidebar ----------------------------- */
function SectionTitle({ title, onToggleCollapse, isCollapsed }) {
  if (isCollapsed) {
    return (
      <div
        className="w-full flex justify-center transition-all duration-500"
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50"
          style={{ transitionTimingFunction: softSpringEasing }}
          aria-label="Expand sidebar"
        >
          <span className="inline-block rotate-180">
            <ChevronDownIcon size={16} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-hidden transition-all duration-500"
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center h-10">
          <div className="px-2 py-1">
            <div className="font-semibold text-lg text-gray-900 dark:text-neutral-50">{title}</div>
          </div>
        </div>
        <div className="pr-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50"
            style={{ transitionTimingFunction: softSpringEasing }}
            aria-label="Collapse sidebar"
          >
            <ChevronDownIcon size={16} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ item, isExpanded, onToggle, onItemClick, isCollapsed, onEdit, onDelete, onSettings, isBookmark, isEditing, editValue, onEditChange, onSaveEdit, onCancelEdit }) {
  const handleClick = (e) => {
    if (isEditing) return; // Don't navigate when editing
    if (item.hasDropdown && onToggle) onToggle();
    else onItemClick?.();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleSettings = (e) => {
    e.stopPropagation();
    onSettings?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSaveEdit?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit?.();
    }
  };

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? 'w-full flex justify-center' : 'w-full'
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`rounded-lg cursor-pointer transition-all duration-500 flex items-center relative ${
          item.isActive ? 'bg-gray-200 dark:bg-neutral-800' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
        } ${isCollapsed ? 'w-10 min-w-10 h-10 justify-center p-4' : isBookmark ? 'w-full min-h-[72px] px-4 py-2.5' : 'w-full h-10 px-4 py-2'}`}
        style={{ transitionTimingFunction: softSpringEasing }}
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center justify-center shrink-0">{item.icon}</div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? 'opacity-0 w-0' : 'opacity-100 ml-3'
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => onEditChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-blue-500 dark:border-blue-400 rounded text-gray-900 dark:text-neutral-50 focus:outline-none"
            />
          ) : isBookmark && item.preview ? (
            <div className="flex flex-col gap-1">
              {/* Bookmark Custom Name (editable) */}
              <div className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">{item.label}</div>
              {/* Element Preview and Details */}
              <div className="flex flex-col gap-0.5">
                <div className="text-xs text-gray-600 dark:text-neutral-400 truncate">{item.preview}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-neutral-500">{item.typeLabel}</span>
                  {item.workspaceIcon && (
                    <>
                      <span className="text-gray-400 dark:text-neutral-600">•</span>
                      <div className="flex items-center gap-1">
                        {item.workspaceIcon}
                        <span className="text-xs text-gray-500 dark:text-neutral-500">{item.workspaceName}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-900 dark:text-neutral-50 truncate">{item.label}</div>
          )}
        </div>

        {/* Settings, Edit and Delete buttons */}
        {!isCollapsed && !isEditing && item.canSettings && (
          <button
            onClick={handleSettings}
            className="ml-2 p-1 rounded hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
            title="Workspace settings"
          >
            <Settings size={16} className="text-gray-700 dark:text-neutral-300" />
          </button>
        )}

        {!isCollapsed && !isEditing && item.canEdit && (
          <button
            onClick={handleEdit}
            className="ml-1 p-1 rounded hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
            title={isBookmark ? "Edit bookmark" : "Edit workspace"}
          >
            <Edit size={16} className="text-gray-700 dark:text-neutral-300" />
          </button>
        )}

        {!isCollapsed && !isEditing && item.canDelete && (
          <button
            onClick={handleDelete}
            className="ml-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title={isBookmark ? "Delete bookmark" : "Delete workspace"}
          >
            <TrashCan size={16} className="text-red-600 dark:text-red-400" />
          </button>
        )}

        {/* Save and Cancel buttons when editing */}
        {!isCollapsed && isEditing && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit?.();
              }}
              className="ml-2 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              title="Save"
            >
              <Checkmark size={16} className="text-green-600 dark:text-green-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit?.();
              }}
              className="ml-1 p-1 rounded hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
              title="Cancel"
            >
              <Close size={16} className="text-gray-700 dark:text-neutral-300" />
            </button>
          </>
        )}

        {item.hasDropdown && (
          <div
            className={`flex items-center justify-center shrink-0 transition-opacity duration-500 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100 ml-2'
            }`}
            style={{ transitionTimingFunction: softSpringEasing }}
          >
            <ChevronDownIcon
              size={16}
              className="text-gray-900 dark:text-neutral-50 transition-transform duration-500"
              style={{
                transitionTimingFunction: softSpringEasing,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuSection({ section, expandedItems, onToggleExpanded, isCollapsed, onEditWorkspace, onDeleteWorkspace, onSettingsWorkspace, onEditBookmark, onDeleteBookmark, editingBookmark, bookmarkName, onBookmarkNameChange, onSaveBookmark, onCancelBookmark }) {
  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative shrink-0 w-full transition-all duration-500 overflow-hidden ${
          isCollapsed ? 'h-0 opacity-0' : 'h-10 opacity-100'
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div className="flex items-center h-10 px-4">
          <div className="text-sm text-gray-600 dark:text-neutral-400">{section.title}</div>
        </div>
      </div>
      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        const isEditingThisBookmark = item.bookmarkId && editingBookmark === item.bookmarkId;

        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={item.onClick}
              isCollapsed={isCollapsed}
              onSettings={item.workspaceId && item.canSettings ? () => onSettingsWorkspace(item.workspaceId) : undefined}
              onEdit={item.workspaceId ? () => onEditWorkspace(item.workspaceId) : item.bookmarkId ? () => onEditBookmark(item.bookmarkId) : undefined}
              onDelete={item.workspaceId ? () => onDeleteWorkspace(item.workspaceId) : item.bookmarkId ? () => onDeleteBookmark(item.bookmarkId) : undefined}
              isBookmark={item.isBookmark || !!item.bookmarkId}
              isEditing={isEditingThisBookmark}
              editValue={bookmarkName}
              onEditChange={onBookmarkNameChange}
              onSaveEdit={() => onSaveBookmark(item.bookmarkId)}
              onCancelEdit={onCancelBookmark}
            />
          </div>
        );
      })}
    </div>
  );
}

function DetailSidebar({
  activeSection,
  currentWorkspace,
  workspaces,
  bookmarks,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onSettingsWorkspace,
  onWorkspaceClick,
  onBookmarkClick,
  onBookmarkUpdate,
  onBookmarkDelete,
  onCollapsedChange,
  onRefreshWorkspaces
}) {
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bookmarkName, setBookmarkName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState(null);

  const toggleExpanded = (itemKey) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  // Notify parent when collapsed state changes
  React.useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  const handleEditBookmark = (bookmarkId) => {
    const bookmark = bookmarks?.find(b => b._id === bookmarkId);
    if (bookmark) {
      setEditingBookmark(bookmarkId);
      setBookmarkName(bookmark.customName || '');
    }
  };

  const handleSaveBookmarkName = (bookmarkId) => {
    if (bookmarkName.trim()) {
      onBookmarkUpdate(bookmarkId, bookmarkName.trim());
    }
    setEditingBookmark(null);
    setBookmarkName('');
  };

  const handleCancelBookmarkEdit = () => {
    setEditingBookmark(null);
    setBookmarkName('');
  };

  const handleDeleteBookmarkClick = (bookmarkId) => {
    const bookmark = bookmarks?.find(b => b._id === bookmarkId);
    setBookmarkToDelete(bookmark);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBookmark = () => {
    if (bookmarkToDelete) {
      onBookmarkDelete(bookmarkToDelete._id);
      setBookmarkToDelete(null);
    }
  };

  const getElementTypeLabel = (type) => {
    const labels = {
      title: 'Title',
      description: 'Description',
      macro: 'Macro',
      example: 'Example',
      text: 'Text',
      card: 'Card',
      'sticky-note': 'Note'
    };
    return labels[type] || type;
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getElementPreview = (element) => {
    if (!element) return 'No content';

    if (element.type === 'title') {
      const text = stripHtml(element.content?.value || '');
      return text.substring(0, 50) || 'No content';
    }
    if (element.type === 'description') {
      const text = stripHtml(element.content?.value || '');
      const words = text.split(' ').slice(0, 6).join(' ');
      return words || 'No content';
    }
    if (element.type === 'macro') {
      const title = stripHtml(element.content?.title || '');
      return title.substring(0, 50) || stripHtml(element.content?.description || '').substring(0, 50) || 'No content';
    }
    if (element.type === 'example') {
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      const title = stripHtml(currentExample?.title || '');
      return title.substring(0, 50) || 'No content';
    }
    return element.content?.text || element.content?.title || 'No content';
  };

  const getSectionContent = () => {
    if (activeSection === 'workspaces') {
      // Separate announcements and other workspaces
      const announcements = workspaces?.find(w => w.type === 'announcements');
      const otherWorkspaces = workspaces?.filter(w => w.type !== 'announcements') || [];

      const workspaceItems = [];

      // Add Announcements first
      if (announcements) {
        workspaceItems.push({
          icon: <Home size={16} className="text-gray-900 dark:text-neutral-50" />,
          label: announcements.name,
          isActive: currentWorkspace?._id === announcements._id,
          onClick: () => onWorkspaceClick(announcements._id),
          workspaceId: announcements._id,
          canEdit: announcements.permissions?.canEdit,
          canDelete: false, // Never allow deleting announcements
        });
      }

      // Add other workspaces
      otherWorkspaces.forEach(workspace => {
        // Check if current user is the owner of this workspace
        const isOwner = workspace.owner && user && (
          (workspace.owner._id || workspace.owner) === user._id
        );

        workspaceItems.push({
          icon: <Home size={16} className="text-gray-900 dark:text-neutral-50" />,
          label: workspace.name,
          isActive: currentWorkspace?._id === workspace._id,
          onClick: () => onWorkspaceClick(workspace._id),
          workspaceId: workspace._id,
          canSettings: isOwner && workspace.type === 'personal', // Only owner of personal workspaces can access settings
          canEdit: workspace.permissions?.canEdit,
          canDelete: workspace.permissions?.canDelete,
        });
      });

      // Add "Add New Workspace" button
      workspaceItems.push({
        icon: <AddLarge size={16} className="text-gray-900 dark:text-neutral-50" />,
        label: 'Add New Workspace',
        onClick: onAddWorkspace,
      });

      // Prepare bookmarks items
      const bookmarkItems = (bookmarks || []).map((bookmark) => {
        const preview = getElementPreview(bookmark.element);
        const typeLabel = getElementTypeLabel(bookmark.element?.type);
        const workspaceName = bookmark.workspace?.name || 'Unknown';

        return {
          icon: <BookmarkIcon size={16} className="text-gray-900 dark:text-neutral-50" />,
          label: bookmark.customName || 'Untitled Bookmark',
          preview: preview,
          typeLabel: typeLabel,
          workspaceIcon: <Home size={12} className="text-gray-600 dark:text-neutral-400" />,
          workspaceName: workspaceName,
          onClick: () => onBookmarkClick(bookmark),
          bookmarkId: bookmark._id,
          canEdit: true,
          canDelete: true,
          isBookmark: true,
        };
      });

      const sections = [
        {
          title: 'All Workspaces',
          items: workspaceItems,
        },
      ];

      // Add bookmarks section if there are any bookmarks
      if (bookmarkItems.length > 0) {
        sections.push({
          title: 'All Bookmarks',
          items: bookmarkItems,
        });
      }

      return {
        title: 'Workspaces',
        sections,
      };
    }

    return {
      title: activeSection === 'vip-calculator'
        ? 'VIP Progress Calculator'
        : activeSection === 'hash-explorer'
        ? 'Hash Explorer Finder'
        : 'Quick Links',
      sections: [],
    };
  };

  const content = getSectionContent();

  return (
    <aside
      className={`bg-white dark:bg-black flex flex-col gap-4 items-start p-4 transition-all duration-500 h-screen border-r border-gray-200 dark:border-neutral-800 ${
        isCollapsed ? 'w-16 min-w-16 !px-0 justify-center' : 'w-80'
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />

      <div
        className={`flex flex-col w-full overflow-y-auto transition-all duration-500 ${
          isCollapsed ? 'gap-2 items-center' : 'gap-4 items-start'
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {/* Pending Invites - Only show in workspaces section and when not collapsed */}
        {activeSection === 'workspaces' && !isCollapsed && (
          <PendingInvites onInviteResponse={onRefreshWorkspaces} />
        )}

        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
            onEditWorkspace={onEditWorkspace}
            onDeleteWorkspace={onDeleteWorkspace}
            onSettingsWorkspace={onSettingsWorkspace}
            onEditBookmark={handleEditBookmark}
            onDeleteBookmark={handleDeleteBookmarkClick}
            editingBookmark={editingBookmark}
            bookmarkName={bookmarkName}
            onBookmarkNameChange={setBookmarkName}
            onSaveBookmark={handleSaveBookmarkName}
            onCancelBookmark={handleCancelBookmarkEdit}
          />
        ))}
      </div>

      {/* Delete Bookmark Dialog */}
      <DeleteBookmarkDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setBookmarkToDelete(null);
        }}
        onConfirm={confirmDeleteBookmark}
        bookmarkName={bookmarkToDelete?.customName || 'this bookmark'}
      />
    </aside>
  );
}

export default function AppSidebar({
  currentWorkspace,
  workspaces,
  bookmarks,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onSettingsWorkspace,
  onWorkspaceClick,
  onBookmarkClick,
  onBookmarkUpdate,
  onBookmarkDelete,
  activeSection,
  onSectionChange,
  onCollapsedChange,
  onRefreshWorkspaces
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <div className="flex flex-row h-screen">
        <IconNavigation
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        <DetailSidebar
          activeSection={activeSection}
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          bookmarks={bookmarks}
          onAddWorkspace={onAddWorkspace}
          onEditWorkspace={onEditWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          onSettingsWorkspace={onSettingsWorkspace}
          onWorkspaceClick={onWorkspaceClick}
          onBookmarkClick={onBookmarkClick}
          onBookmarkUpdate={onBookmarkUpdate}
          onBookmarkDelete={onBookmarkDelete}
          onCollapsedChange={onCollapsedChange}
          onRefreshWorkspaces={onRefreshWorkspaces}
        />
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
