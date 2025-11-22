import React, { useState } from 'react';
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
import { Edit, Trash2, GripVertical, Lock, Users } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Badge } from '../ui/badge';

const SortableCategory = ({ category, isSelected, onSelect, onEdit, onDelete, selectionMode, isChecked, onCheck }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id });

  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get the icon component
  const IconComponent = Icons[category.icon] || Icons.Folder;

  const categoryColor = category.color || '#3B82F6';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `4px solid ${isSelected || isHovered ? categoryColor : 'transparent'}`,
        backgroundColor: isSelected ? `${categoryColor}10` : undefined
      }}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group ${
        isSelected
          ? ''
          : 'bg-card hover:bg-muted/50'
      } ${isDragging ? 'shadow-lg z-50' : ''}`}
      onClick={() => !selectionMode && onSelect(category)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Selection Checkbox */}
        {selectionMode && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              e.stopPropagation();
              onCheck(category._id);
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

        {/* Category Icon */}
        <div
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: isSelected
              ? `${category.color}20`
              : 'rgba(0, 0, 0, 0.05)',
            borderLeft: `3px solid ${category.color || '#3B82F6'}`
          }}
        >
          <IconComponent
            className="w-4 h-4 transition-colors"
            style={{ color: category.color || '#3B82F6' }}
          />
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {category.categoryName}
            </p>
            {!category.isPrivate && (
              <Users className="w-3 h-3 text-muted-foreground" title="Shared" />
            )}
            {category.isPrivate && category.sharedWith?.length > 0 && (
              <Lock className="w-3 h-3 text-muted-foreground" title="Private with sharing" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {category.links.length} {category.links.length === 1 ? 'link' : 'links'}
            </Badge>
            {category.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {category.description}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!selectionMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="p-1.5 text-muted-foreground hover:bg-accent rounded-md transition-colors"
            title="Edit category"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SortableCategoryList = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onReorder,
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
      const oldIndex = categories.findIndex((cat) => cat._id === active.id);
      const newIndex = categories.findIndex((cat) => cat._id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);

      // Create order mapping
      const categoryOrders = newCategories.map((cat, index) => ({
        categoryId: cat._id,
        order: index,
      }));

      onReorder(categoryOrders);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((cat) => cat._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {categories.map((category) => (
            <SortableCategory
              key={category._id}
              category={category}
              isSelected={selectedCategory?._id === category._id}
              onSelect={onSelectCategory}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
              selectionMode={selectionMode}
              isChecked={selectedItems.includes(category._id)}
              onCheck={onToggleSelection}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableCategoryList;
