import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useTemplatesNavigation } from '../context/TemplatesNavigationContext';
import { useTheme } from '../context/ThemeContext';
import {
  Template,
  TextLongParagraph,
  Bullhorn,
  Add,
  TrashCan,
  ListBoxes,
} from '@carbon/icons-react';
import TemplateBuilder from './TemplateBuilder';

// Template definitions with relative positioning based on MongoDB data
// Single Macro: Title + Macro (vertical layout)
// Macro Offset from Title: (0, 188) - vertical gap ~138px
const SINGLE_MACRO_TEMPLATE = {
  id: 'single-macro',
  name: 'Single Macro',
  description: 'Title with maximum font size and a macro element',
  icon: TextLongParagraph,
  elements: [
    {
      type: 'title',
      offsetX: 0,
      offsetY: 0,
      dimensions: { width: 400, height: 50 },
      content: {
        value: '<span style="font-size: 72px; font-weight: bold;">New Title</span>',
        history: []
      },
      style: {
        fontSize: 72,
        fontWeight: 'bold',
      }
    },
    {
      type: 'macro',
      offsetX: 0,
      offsetY: 188,
      dimensions: { width: 450, height: 150 },
      content: {
        title: 'Macro Title',
        description: 'Macro description goes here...',
        isExpanded: false,
        history: [],
        titleHistory: [],
        descriptionHistory: []
      },
      style: {}
    }
  ]
};

// New Announcement: Title + Description + Macro + Example (horizontal layout)
// Description Offset: (4, 195) - below title
// Macro Offset: (736, 210) - to the right
// Example Offset: (1219, 215) - further right
const NEW_ANNOUNCEMENT_TEMPLATE = {
  id: 'new-announcement',
  name: 'New Announcement',
  description: 'Complete announcement layout with title, description, macro and example',
  icon: Bullhorn,
  elements: [
    {
      type: 'title',
      offsetX: 0,
      offsetY: 0,
      dimensions: { width: 400, height: 50 },
      content: {
        value: '<span style="font-size: 72px; font-weight: bold;">ANNOUNCEMENT TITLE</span>',
        history: []
      },
      style: {
        fontSize: 72,
        fontWeight: 'bold',
      }
    },
    {
      type: 'description',
      offsetX: 4,
      offsetY: 195,
      dimensions: { width: 500, height: 100 },
      content: {
        value: '<span style="font-size: 18px;">Description text goes here. Explain the context and details of this announcement.</span>',
        history: []
      },
      style: {
        fontSize: 18,
      }
    },
    {
      type: 'macro',
      offsetX: 736,
      offsetY: 210,
      dimensions: { width: 450, height: 150 },
      content: {
        title: 'MACRO TITLE',
        description: 'Macro description with the main response template...',
        isExpanded: false,
        history: [],
        titleHistory: [],
        descriptionHistory: []
      },
      style: {}
    },
    {
      type: 'example',
      offsetX: 1219,
      offsetY: 215,
      dimensions: { width: 500, height: 120 },
      content: {
        examples: [
          {
            title: 'Example Case',
            messages: [
              {
                type: 'user',
                text: 'User message example...',
                formatting: {},
                timestamp: new Date()
              },
              {
                type: 'agent',
                text: 'Agent response example...',
                formatting: {},
                timestamp: new Date()
              }
            ],
            titleHistory: []
          }
        ],
        currentExampleIndex: 0
      },
      style: {}
    }
  ]
};

const DEFAULT_TEMPLATES = [SINGLE_MACRO_TEMPLATE, NEW_ANNOUNCEMENT_TEMPLATE];

const TemplatesNavigation = () => {
  const { isOpen, isEditMode, viewportInfo, closeTemplates, createFromTemplate } = useTemplatesNavigation();
  const { theme } = useTheme();

  const [animationState, setAnimationState] = useState('closed');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState(() => {
    // Load custom templates from localStorage
    const saved = localStorage.getItem('customTemplates');
    return saved ? JSON.parse(saved) : [];
  });

  // Combine default and custom templates
  const TEMPLATES = useMemo(() => [...DEFAULT_TEMPLATES, ...customTemplates], [customTemplates]);

  // Handle saving custom template
  const handleSaveCustomTemplate = useCallback((template) => {
    setCustomTemplates(prev => {
      const updated = [...prev, template];
      localStorage.setItem('customTemplates', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle deleting custom template
  const handleDeleteCustomTemplate = useCallback((templateId) => {
    setCustomTemplates(prev => {
      const updated = prev.filter(t => t.id !== templateId);
      localStorage.setItem('customTemplates', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle animation states
  useEffect(() => {
    if (isOpen && animationState === 'closed') {
      setAnimationState('opening');
      setTimeout(() => setAnimationState('open'), 350);
    } else if (!isOpen && (animationState === 'open' || animationState === 'opening')) {
      setAnimationState('closing');
      setTimeout(() => setAnimationState('closed'), 280);
    }
  }, [isOpen, animationState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || animationState !== 'open') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setAnimationState('closing');
        setTimeout(() => {
          setAnimationState('closed');
          closeTemplates();
        }, 280);
        return;
      }

      // Number key selection (1-2 for templates)
      const num = parseInt(e.key);
      if (num >= 1 && num <= TEMPLATES.length) {
        e.preventDefault();
        handleTemplateSelect(TEMPLATES[num - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, animationState, closeTemplates]);

  const handleClose = useCallback(() => {
    setAnimationState('closing');
    setTimeout(() => {
      setAnimationState('closed');
      closeTemplates();
      setSelectedTemplate(null);
      setHoveredTemplate(null);
    }, 280);
  }, [closeTemplates]);

  const handleTemplateSelect = useCallback(async (template) => {
    if (isCreating || !viewportInfo) return;

    setSelectedTemplate(template);
    setIsCreating(true);

    // Calculate center of current viewport (shifted 40% left to account for sidebar)
    const currentScale = viewportInfo.scale || 1;
    const viewportCenterX = (-viewportInfo.x / currentScale) + (viewportInfo.width / (2 * currentScale));
    const viewportCenterY = (-viewportInfo.y / currentScale) + (viewportInfo.height / (2 * currentScale));

    // Calculate base position (centered for first element, shifted 30% left)
    const firstElement = template.elements[0];
    const leftShift = (viewportInfo.width * 0.3) / currentScale;
    const baseX = viewportCenterX - (firstElement.dimensions.width / 2) - leftShift;
    const baseY = viewportCenterY - (firstElement.dimensions.height / 2);

    // Prepare elements with absolute positions
    const elementsToCreate = template.elements.map((el, index) => ({
      type: el.type,
      position: {
        x: baseX + el.offsetX,
        y: baseY + el.offsetY,
        z: index
      },
      dimensions: el.dimensions,
      content: el.content,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderWidth: 2,
        borderRadius: 8,
        fontSize: el.style?.fontSize || (el.type === 'description' ? 16 : 18),
        fontWeight: el.style?.fontWeight || 'normal',
        textColor: theme === 'dark' ? '#f5f5f5' : '#171717',
        padding: 12,
        ...el.style
      }
    }));

    try {
      await createFromTemplate(elementsToCreate);

      // Close with animation after successful creation
      setTimeout(() => {
        setAnimationState('closing');
        setTimeout(() => {
          setAnimationState('closed');
          closeTemplates();
          setSelectedTemplate(null);
          setIsCreating(false);
        }, 280);
      }, 200);
    } catch (error) {
      console.error('Error creating template elements:', error);
      setIsCreating(false);
      setSelectedTemplate(null);
    }
  }, [isCreating, viewportInfo, theme, createFromTemplate, closeTemplates]);

  // Position calculations for radial layout
  const getTemplatePosition = useCallback((index, total) => {
    const startAngle = -90;
    const angleStep = 360 / Math.max(total, 3); // Minimum 3 positions for good spacing
    const angle = startAngle + (index * angleStep);
    const angleRad = (angle * Math.PI) / 180;
    const radius = 160;
    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
    };
  }, []);

  if (animationState === 'closed') return null;

  // Don't show if not in edit mode
  if (!isEditMode) return null;

  const isClosing = animationState === 'closing';
  const isOpening = animationState === 'opening';
  const hoveredData = TEMPLATES.find(t => t.id === hoveredTemplate);

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCreating) {
          handleClose();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-300 ${
          isClosing ? 'opacity-0' : isOpening ? 'opacity-0 animate-fadeIn' : 'opacity-100'
        }`}
      />

      {/* Main container */}
      <div
        className={`relative w-[720px] h-[720px] transition-all duration-400 ease-out ${
          isClosing ? 'scale-90 opacity-0' : isOpening ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Decorative outer ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[420px] h-[420px] rounded-full border border-neutral-800/50 transition-all duration-500 ${
            isOpening ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`} />
        </div>

        {/* SVG Circle path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <circle
            cx="50%"
            cy="50%"
            r="160"
            fill="none"
            stroke="url(#templateCircleGradient)"
            strokeWidth="1"
            strokeDasharray="8 6"
            className={`transition-all duration-500 ${isOpening ? 'opacity-0' : 'opacity-30'}`}
          />
          <defs>
            <linearGradient id="templateCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#525252" />
              <stop offset="50%" stopColor="#737373" />
              <stop offset="100%" stopColor="#525252" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <button
            onClick={() => !hoveredData && setIsBuilderOpen(true)}
            className={`relative w-28 h-28 rounded-full bg-neutral-900/95 border border-neutral-700/80 flex flex-col items-center justify-center shadow-2xl shadow-black/50 transition-all duration-400 ${
              isOpening ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
            } ${!hoveredData ? 'hover:border-blue-500 hover:bg-neutral-800 cursor-pointer' : ''}`}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-neutral-700/20 to-transparent pointer-events-none" />

            {hoveredData ? (
              <>
                <span className="text-white text-sm font-semibold text-center leading-tight z-10">
                  {hoveredData.name}
                </span>
                <span className="text-neutral-400 text-[10px] mt-1 text-center px-3 z-10">
                  {hoveredData.elements.length} elements
                </span>
              </>
            ) : (
              <>
                <Add size={32} className="text-blue-400 z-10" />
                <span className="text-neutral-200 text-xs font-medium mt-1 z-10">Create New</span>
              </>
            )}
          </button>
        </div>

        {/* Template buttons */}
        {TEMPLATES.map((template, index) => {
          const pos = getTemplatePosition(index, TEMPLATES.length);
          const isHovered = hoveredTemplate === template.id;
          const isSelected = selectedTemplate?.id === template.id;
          // Use ListBoxes as fallback for custom templates
          const Icon = template.isCustom ? ListBoxes : template.icon;

          return (
            <div
              key={template.id}
              className={`absolute top-1/2 left-1/2 transition-all duration-300 ${
                isSelected ? 'z-50' : 'z-10'
              }`}
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) ${
                  isSelected && isCreating ? 'scale(1.5)' : ''
                }`,
                opacity: isCreating && !isSelected ? 0.3 : 1,
              }}
              onMouseEnter={() => !isCreating && setHoveredTemplate(template.id)}
              onMouseLeave={() => !isCreating && setHoveredTemplate(null)}
            >
              <button
                onClick={() => handleTemplateSelect(template)}
                disabled={isCreating}
                className={`group relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all duration-200 border-2 ${
                  isHovered
                    ? 'bg-white text-neutral-900 border-white scale-110 shadow-xl shadow-white/20'
                    : isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                    : template.isCustom
                    ? 'bg-purple-900/50 text-neutral-200 border-purple-600/50 hover:bg-purple-800/50 hover:border-purple-500'
                    : 'bg-neutral-800/90 text-neutral-200 border-neutral-600/50 hover:bg-neutral-700 hover:border-neutral-500'
                } ${isCreating ? 'cursor-wait' : 'cursor-pointer'}`}
                style={{
                  animation: isOpening ? `scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 80}ms both` : undefined,
                }}
              >
                <Icon size={28} />
                <span className={`text-[10px] font-medium mt-1 text-center leading-tight max-w-[70px] truncate ${
                  isHovered ? 'text-neutral-700' : 'text-neutral-400'
                }`}>
                  {template.name}
                </span>

                {/* Keyboard shortcut badge */}
                <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center text-[10px] font-bold text-neutral-300 transition-opacity duration-200 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                  {index + 1}
                </div>

                {/* Element count badge */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isHovered
                    ? 'bg-neutral-800 text-white'
                    : template.isCustom ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {template.elements.length}
                </div>

                {/* Delete button for custom templates */}
                {template.isCustom && isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomTemplate(template.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                  >
                    <TrashCan size={12} className="text-white" />
                  </button>
                )}
              </button>
            </div>
          );
        })}

        {/* Preview panel for hovered template */}
        {hoveredData && (
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-80 bg-neutral-900/95 border border-neutral-700 rounded-xl p-4 shadow-2xl z-40"
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <h3 className="text-white font-semibold text-sm mb-2">{hoveredData.name}</h3>
            <p className="text-neutral-400 text-xs mb-3">{hoveredData.description}</p>
            <div className="flex flex-wrap gap-2">
              {hoveredData.elements.map((el, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-[10px] text-neutral-300 capitalize"
                >
                  {el.type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom hints */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-4' : isOpening ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex items-center gap-2">
          <kbd className="px-2.5 py-1.5 rounded-lg bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[11px] font-medium backdrop-blur-sm">
            1-{TEMPLATES.length}
          </kbd>
          <span className="text-neutral-500 text-xs">quick select</span>
        </div>
        <div className="w-px h-4 bg-neutral-700" />
        <div className="flex items-center gap-2">
          <kbd className="px-2.5 py-1.5 rounded-lg bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[11px] font-medium backdrop-blur-sm">
            Esc
          </kbd>
          <span className="text-neutral-500 text-xs">close</span>
        </div>
      </div>

      {/* Loading overlay */}
      {isCreating && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">Creating elements...</span>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Template Builder Modal */}
      <TemplateBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleSaveCustomTemplate}
      />
    </div>,
    document.body
  );
};

export default TemplatesNavigation;
