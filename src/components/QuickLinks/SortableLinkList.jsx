import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Copy, Edit, Trash2, GripVertical, Star, Check, BarChart3 } from 'lucide-react';
import { Badge } from '../ui/badge';

const SortableLink = ({
  link,
  onLinkClick,
  onEdit,
  onDelete,
  onTogglePin,
  copiedLinkId,
  selectionMode,
  isChecked,
  onCheck,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Selection Checkbox */}
        {selectionMode && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              e.stopPropagation();
              onCheck(link._id);
            }}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        )}

        {/* Drag Handle */}
        {!selectionMode && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
          </div>
        )}

        {/* Link Button */}
        <button
          onClick={() => onLinkClick(link)}
          className="flex-1 text-left flex items-center gap-3 min-w-0"
          title={link.url}
        >
          {/* Favicon or Icon */}
          <div className="flex-shrink-0">
            {link.customIcon ? (
              <img
                src={link.customIcon}
                alt=""
                className="w-8 h-8 rounded object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : link.favicon ? (
              <img
                src={link.favicon}
                alt=""
                className="w-6 h-6"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="p-2 bg-muted/50 rounded-lg flex-shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors"
              style={{ display: link.customIcon || link.favicon ? 'none' : 'flex' }}
            >
              {link.type === 'open' ? (
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              )}
            </div>
          </div>

          {/* Link Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-foreground truncate">
                {link.name}
              </p>
              {link.isPinned && (
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground truncate">
                {link.url}
              </p>
              {link.clicks > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BarChart3 className="w-3 h-3" />
                    <span>{link.clicks}</span>
                  </div>
                </>
              )}
            </div>
            {link.description && (
              <p className="text-xs text-muted-foreground/80 mt-1 truncate">
                {link.description}
              </p>
            )}
            {link.tags && link.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                {link.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Copied Indicator */}
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
      </div>

      {/* Action Buttons */}
      {!selectionMode && (
        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(link);
            }}
            className={`p-1.5 rounded-md transition-colors ${
              link.isPinned
                ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                : 'text-muted-foreground hover:bg-accent'
            }`}
            title={link.isPinned ? 'Unpin link' : 'Pin link'}
          >
            <Star className={`w-4 h-4 ${link.isPinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(link);
            }}
            className="p-1.5 text-muted-foreground hover:bg-accent rounded-md transition-colors"
            title="Edit link"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(link);
            }}
            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete link"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SortableLinkList = ({
  links,
  onLinkClick,
  onEditLink,
  onDeleteLink,
  onTogglePin,
  onReorder,
  copiedLinkId,
  selectionMode = false,
  selectedItems = [],
  onToggleSelection,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link._id === active.id);
      const newIndex = links.findIndex((link) => link._id === over.id);

      const newLinks = arrayMove(links, oldIndex, newIndex);

      // Create order mapping
      const linkOrders = newLinks.map((link, index) => ({
        linkId: link._id,
        order: index,
      }));

      onReorder(linkOrders);
    }
  };

  // Sort links: pinned first, then by order
  const sortedLinks = [...links].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedLinks.map((link) => link._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sortedLinks.map((link) => (
            <SortableLink
              key={link._id}
              link={link}
              onLinkClick={onLinkClick}
              onEdit={onEditLink}
              onDelete={onDeleteLink}
              onTogglePin={onTogglePin}
              copiedLinkId={copiedLinkId}
              selectionMode={selectionMode}
              isChecked={selectedItems.includes(link._id)}
              onCheck={onToggleSelection}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableLinkList;
