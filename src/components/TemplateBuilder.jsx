import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Add,
  Close,
  Save,
  TrashCan,
  TextLongParagraph,
  Bullhorn,
  Code,
  ListBoxes,
  TextShortParagraph,
} from '@carbon/icons-react';

// Element type configurations
const ELEMENT_TYPES = [
  { id: 'title', label: 'Title', icon: TextLongParagraph, color: '#3b82f6', defaultWidth: 400, defaultHeight: 50 },
  { id: 'description', label: 'Description', icon: TextShortParagraph, color: '#10b981', defaultWidth: 500, defaultHeight: 100 },
  { id: 'macro', label: 'Macro', icon: Code, color: '#f59e0b', defaultWidth: 450, defaultHeight: 150 },
  { id: 'example', label: 'Example', icon: Bullhorn, color: '#8b5cf6', defaultWidth: 500, defaultHeight: 120 },
  { id: 'wrapper', label: 'Wrapper', icon: ListBoxes, color: '#ec4899', defaultWidth: 600, defaultHeight: 400 },
];

// Scale factor for the mini canvas (elements shown at 20% size)
const CANVAS_SCALE = 0.2;

const TemplateBuilder = ({ isOpen, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState('');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const canvasRef = useRef(null);

  // Add a new element to the canvas
  const handleAddElement = useCallback((type) => {
    const typeConfig = ELEMENT_TYPES.find(t => t.id === type);
    if (!typeConfig) return;

    // Calculate center position for new element
    const canvasWidth = 800;
    const canvasHeight = 500;

    // Offset each new element slightly so they don't stack exactly
    const offset = elements.length * 30;

    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: (canvasWidth / 2 - typeConfig.defaultWidth / 2) / CANVAS_SCALE + offset,
      y: (canvasHeight / 2 - typeConfig.defaultHeight / 2) / CANVAS_SCALE + offset,
      width: typeConfig.defaultWidth,
      height: typeConfig.defaultHeight,
      color: typeConfig.color,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [elements.length]);

  // Handle element drag start
  const handleMouseDown = useCallback((e, elementId) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setSelectedElement(elementId);
    setIsDragging(true);
  }, [elements]);

  // Handle resize start (wrapper only)
  const handleResizeStart = useCallback((e, elementId) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element || element.type !== 'wrapper') return;

    setResizeStart({
      width: element.width,
      height: element.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
    setSelectedElement(elementId);
    setIsResizing(true);
  }, [elements]);

  // Handle mouse move (drag or resize)
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;

    if (isResizing && selectedElement) {
      const deltaX = (e.clientX - resizeStart.mouseX) / CANVAS_SCALE;
      const deltaY = (e.clientY - resizeStart.mouseY) / CANVAS_SCALE;

      setElements(prev => prev.map(el =>
        el.id === selectedElement
          ? {
              ...el,
              width: Math.max(200, resizeStart.width + deltaX),
              height: Math.max(150, resizeStart.height + deltaY),
            }
          : el
      ));
    } else if (isDragging && selectedElement) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = (e.clientX - canvasRect.left - dragOffset.x) / CANVAS_SCALE;
      const newY = (e.clientY - canvasRect.top - dragOffset.y) / CANVAS_SCALE;

      setElements(prev => prev.map(el =>
        el.id === selectedElement
          ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
          : el
      ));
    }
  }, [isDragging, isResizing, selectedElement, dragOffset, resizeStart]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Delete selected element
  const handleDeleteElement = useCallback(() => {
    if (!selectedElement) return;
    setElements(prev => prev.filter(el => el.id !== selectedElement));
    setSelectedElement(null);
  }, [selectedElement]);

  // Save the template
  const handleSave = useCallback(() => {
    if (!templateName.trim() || elements.length === 0) return;

    // Sort by type priority (title first)
    const sortedElements = [...elements].sort((a, b) => {
      const typePriority = { title: 0, description: 1, macro: 2, example: 3, wrapper: 4 };
      return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
    });

    const baseElement = sortedElements[0];
    const baseX = baseElement.x;
    const baseY = baseElement.y;

    const templateElements = sortedElements.map(el => ({
      type: el.type,
      offsetX: el.x - baseX,
      offsetY: el.y - baseY,
      dimensions: { width: el.width, height: el.height },
      content: getDefaultContent(el.type),
      style: el.type === 'title' ? { fontSize: 72, fontWeight: 'bold' } : {}
    }));

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName.trim(),
      description: `Custom template with ${elements.length} elements`,
      icon: ListBoxes,
      isCustom: true,
      elements: templateElements,
    };

    onSave(newTemplate);
    setTemplateName('');
    setElements([]);
    setSelectedElement(null);
    onClose();
  }, [templateName, elements, onSave, onClose]);

  const getDefaultContent = (type) => {
    switch (type) {
      case 'title':
        return { value: '<span style="font-size: 72px; font-weight: bold;">New Title</span>', history: [] };
      case 'description':
        return { value: '<span style="font-size: 18px;">Description text goes here...</span>', history: [] };
      case 'macro':
        return { title: 'Macro Title', description: 'Macro description...', isExpanded: false, history: [], titleHistory: [], descriptionHistory: [] };
      case 'example':
        return { examples: [{ title: 'Example Case', messages: [{ type: 'user', text: 'User message...', formatting: {}, timestamp: new Date() }, { type: 'agent', text: 'Agent response...', formatting: {}, timestamp: new Date() }], titleHistory: [] }], currentExampleIndex: 0 };
      case 'wrapper':
        return { childElements: [] };
      default:
        return {};
    }
  };

  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  }, []);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      {/* Builder Modal */}
      <div className="relative w-[900px] max-h-[90vh] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Add size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">Template Builder</h2>
              <p className="text-neutral-400 text-xs">Create custom element templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <Close size={20} />
          </button>
        </div>

        {/* Template Name Input */}
        <div className="px-6 py-4 border-b border-neutral-800">
          <input
            type="text"
            placeholder="Enter template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Element Type Buttons */}
        <div className="px-6 py-3 border-b border-neutral-800 flex items-center gap-2">
          <span className="text-neutral-400 text-sm mr-2">Add:</span>
          {ELEMENT_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => handleAddElement(type.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-500 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all text-sm"
                style={{ borderLeftColor: type.color, borderLeftWidth: 3 }}
              >
                <Icon size={16} />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={canvasRef}
            className="relative w-full h-[500px] bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden"
            onClick={handleCanvasClick}
            style={{
              backgroundImage: 'radial-gradient(circle, #262626 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* Elements */}
            {elements.map(element => {
              const typeConfig = ELEMENT_TYPES.find(t => t.id === element.type);
              const Icon = typeConfig?.icon || ListBoxes;
              const isSelected = selectedElement === element.id;
              const isWrapper = element.type === 'wrapper';

              return (
                <div
                  key={element.id}
                  className={`absolute select-none transition-all duration-100 ${
                    isSelected ? 'z-20' : 'z-10'
                  } ${isDragging || isResizing ? '' : 'cursor-move'}`}
                  style={{
                    left: element.x * CANVAS_SCALE,
                    top: element.y * CANVAS_SCALE,
                    width: element.width * CANVAS_SCALE,
                    height: element.height * CANVAS_SCALE,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                >
                  {/* Element body */}
                  <div
                    className={`w-full h-full rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'shadow-lg shadow-black/50'
                        : 'hover:shadow-md hover:shadow-black/30'
                    }`}
                    style={{
                      backgroundColor: isWrapper ? 'transparent' : element.color + '15',
                      borderColor: isSelected ? '#fff' : element.color,
                      borderStyle: isWrapper ? 'dashed' : 'solid',
                    }}
                  >
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-md" style={{ backgroundColor: element.color + '30' }}>
                        <Icon size={14} style={{ color: element.color }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: element.color }}>
                          {element.type}
                        </span>
                      </div>
                    </div>

                    {/* Resize handle for wrapper only */}
                    {isWrapper && isSelected && (
                      <>
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full" />
                        <div
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white rounded-sm cursor-se-resize flex items-center justify-center hover:bg-blue-400 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, element.id)}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" className="text-neutral-600">
                            <path d="M7 1v6H1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </>
                    )}

                    {/* Dimensions label for wrapper when selected */}
                    {isWrapper && isSelected && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-neutral-500 whitespace-nowrap">
                        {Math.round(element.width)} × {Math.round(element.height)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mx-auto mb-4">
                    <Add size={32} className="text-neutral-600" />
                  </div>
                  <p className="text-neutral-500 text-sm">Click buttons above to add elements</p>
                  <p className="text-neutral-600 text-xs mt-1">Drag to position • Wrapper can be resized</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-700 bg-neutral-800/50">
          <div className="flex items-center gap-4">
            {selectedElement && (
              <button
                onClick={handleDeleteElement}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/30 transition-colors text-sm"
              >
                <TrashCan size={16} />
                Delete
              </button>
            )}
            <span className="text-neutral-500 text-sm">
              {elements.length} element{elements.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-600 text-neutral-300 hover:bg-neutral-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!templateName.trim() || elements.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Save size={16} />
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TemplateBuilder;
