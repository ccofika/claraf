import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TitleElement from './TitleElement';
import DescriptionElement from './DescriptionElement';
import MacroElement from './MacroElement';
import ExampleElement from './ExampleElement';

const CanvasElement = React.memo(({ element, canEdit = true, workspaceId, onUpdate, onDelete, onSettingsClick, isHighlighted = false, onBookmarkCreated, onMouseEnter, onMouseLeave }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element._id,
    disabled: element.locked || !canEdit, // Disable dragging if user can't edit
  });

  // Use TitleElement for title type
  if (element.type === 'title') {
    return (
      <TitleElement
        element={element}
        canEdit={canEdit}
        workspaceId={workspaceId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onSettingsClick={onSettingsClick}
        isHighlighted={isHighlighted}
        onBookmarkCreated={onBookmarkCreated}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  // Use DescriptionElement for description type
  if (element.type === 'description') {
    return (
      <DescriptionElement
        element={element}
        canEdit={canEdit}
        workspaceId={workspaceId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onSettingsClick={onSettingsClick}
        isHighlighted={isHighlighted}
        onBookmarkCreated={onBookmarkCreated}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  // Use MacroElement for macro type
  if (element.type === 'macro') {
    return (
      <MacroElement
        element={element}
        canEdit={canEdit}
        workspaceId={workspaceId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onSettingsClick={onSettingsClick}
        isHighlighted={isHighlighted}
        onBookmarkCreated={onBookmarkCreated}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  // Use ExampleElement for example type
  if (element.type === 'example') {
    return (
      <ExampleElement
        element={element}
        canEdit={canEdit}
        workspaceId={workspaceId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onSettingsClick={onSettingsClick}
        isHighlighted={isHighlighted}
        onBookmarkCreated={onBookmarkCreated}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  const style = {
    position: 'absolute',
    left: `${element.position.x}px`,
    top: `${element.position.y}px`,
    width: `${element.dimensions.width}px`,
    minHeight: `${element.dimensions.height}px`,
    transform: CSS.Translate.toString(transform),
    zIndex: element.position.z,
    cursor: !canEdit ? 'text' : (element.locked || !canEdit) ? 'default' : 'move',
    opacity: isDragging ? 0.5 : element.style?.opacity || 1,
    backgroundColor: element.style?.backgroundColor || element.content?.color || '#ffffff',
    borderColor: element.style?.borderColor || '#e5e7eb',
    borderWidth: `${element.style?.borderWidth || 1}px`,
    borderRadius: `${element.style?.borderRadius || 4}px`,
    borderStyle: 'solid',
    padding: `${element.style?.padding || 12}px`,
    color: element.style?.textColor || '#000000',
    fontSize: `${element.style?.fontSize || 14}px`,
    fontWeight: element.style?.fontWeight || 'normal',
    userSelect: !canEdit ? 'text' : 'none',
    WebkitUserSelect: !canEdit ? 'text' : 'none',
    MozUserSelect: !canEdit ? 'text' : 'none',
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap break-words" style={{ cursor: !canEdit ? 'text' : 'default' }}>
            {element.content?.text || 'Text element'}
          </div>
        );

      case 'subtext':
        return (
          <div className="text-sm text-gray-600 whitespace-pre-wrap break-words" style={{ cursor: !canEdit ? 'text' : 'default' }}>
            {element.content?.text || 'Subtext element'}
          </div>
        );

      case 'card':
        return (
          <div className="space-y-2" style={{ cursor: !canEdit ? 'text' : 'default' }}>
            <h3 className="font-semibold text-lg">
              {element.content?.title || 'Card Title'}
            </h3>
            {element.content?.isExpanded && (
              <p className="text-sm text-gray-600">
                {element.content?.description || 'Card description goes here...'}
              </p>
            )}
          </div>
        );

      case 'sticky-note':
        return (
          <div className="h-full flex items-center justify-center" style={{ cursor: !canEdit ? 'text' : 'default' }}>
            <p className="text-center whitespace-pre-wrap break-words">
              {element.content?.text || 'Sticky note'}
            </p>
          </div>
        );

      case 'image':
        return element.content?.imageUrl ? (
          <img
            src={element.content.imageUrl}
            alt={element.content?.text || 'Image'}
            className="w-full h-auto object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image
          </div>
        );

      case 'link':
        return (
          <a
            href={element.content?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {element.content?.text || element.content?.url || 'Link'}
          </a>
        );

      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit ? listeners : {})}
      {...(canEdit ? attributes : {})}
      className={`${canEdit ? 'select-none' : 'select-text'} shadow-sm transition-shadow duration-200 ${canEdit ? 'hover:shadow-md' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {renderContent()}
      {!canEdit && (
        <div className="absolute top-1 right-1 bg-gray-800 dark:bg-neutral-700 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
          Read-only
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.element._id === nextProps.element._id &&
    prevProps.element.position.x === nextProps.element.position.x &&
    prevProps.element.position.y === nextProps.element.position.y &&
    prevProps.element.position.z === nextProps.element.position.z &&
    prevProps.canEdit === nextProps.canEdit &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.element.dimensions?.width === nextProps.element.dimensions?.width &&
    prevProps.element.dimensions?.height === nextProps.element.dimensions?.height &&
    JSON.stringify(prevProps.element.style) === JSON.stringify(nextProps.element.style) &&
    JSON.stringify(prevProps.element.content) === JSON.stringify(nextProps.element.content)
  );
});

CanvasElement.displayName = 'CanvasElement';

export default CanvasElement;
