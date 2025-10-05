import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
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

function MenuItem({ item, isExpanded, onToggle, onItemClick, isCollapsed, onEdit, onDelete }) {
  const handleClick = (e) => {
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
        } ${isCollapsed ? 'w-10 min-w-10 h-10 justify-center p-4' : 'w-full h-10 px-4 py-2'}`}
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
          <div className="text-sm text-gray-900 dark:text-neutral-50 truncate">{item.label}</div>
        </div>

        {/* Edit and Delete buttons */}
        {!isCollapsed && item.canEdit && (
          <button
            onClick={handleEdit}
            className="ml-2 p-1 rounded hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
            title="Edit workspace"
          >
            <Edit size={16} className="text-gray-700 dark:text-neutral-300" />
          </button>
        )}

        {!isCollapsed && item.canDelete && (
          <button
            onClick={handleDelete}
            className="ml-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Delete workspace"
          >
            <TrashCan size={16} className="text-red-600 dark:text-red-400" />
          </button>
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

function MenuSection({ section, expandedItems, onToggleExpanded, isCollapsed, onEditWorkspace, onDeleteWorkspace }) {
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
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={item.onClick}
              isCollapsed={isCollapsed}
              onEdit={item.workspaceId ? () => onEditWorkspace(item.workspaceId) : undefined}
              onDelete={item.workspaceId ? () => onDeleteWorkspace(item.workspaceId) : undefined}
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
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onWorkspaceClick
}) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (itemKey) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

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
        workspaceItems.push({
          icon: <Home size={16} className="text-gray-900 dark:text-neutral-50" />,
          label: workspace.name,
          isActive: currentWorkspace?._id === workspace._id,
          onClick: () => onWorkspaceClick(workspace._id),
          workspaceId: workspace._id,
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

      return {
        title: 'Workspaces',
        sections: [
          {
            title: 'All Workspaces',
            items: workspaceItems,
          },
        ],
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
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
            onEditWorkspace={onEditWorkspace}
            onDeleteWorkspace={onDeleteWorkspace}
          />
        ))}
      </div>
    </aside>
  );
}

export default function AppSidebar({
  currentWorkspace,
  workspaces,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onWorkspaceClick,
  activeSection,
  onSectionChange
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
          onAddWorkspace={onAddWorkspace}
          onEditWorkspace={onEditWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          onWorkspaceClick={onWorkspaceClick}
        />
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
