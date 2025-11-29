import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useWorkspaceNavigation } from '../context/WorkspaceNavigationContext';
import { CategoryIcon } from './CategoryPicker';
import { Document, FolderOpen } from '@carbon/icons-react';

const API_URL = process.env.REACT_APP_API_URL;

const WorkspaceNavigation = () => {
  const navigate = useNavigate();
  const { workspaceId: currentWorkspaceId } = useParams();
  const { isOpen, closeNavigation } = useWorkspaceNavigation();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animationState, setAnimationState] = useState('closed');

  const [levelStack, setLevelStack] = useState([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [levelTransition, setLevelTransition] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);


  const handleClose = useCallback(() => {
    setAnimationState('closing');
    setTimeout(() => {
      setAnimationState('closed');
      closeNavigation();
      setLevelStack([]);
      setCurrentLevelIndex(0);
      setSelectedIndex(0);
      setLevelTransition(null);
    }, 280);
  }, [closeNavigation]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/categories/navigation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);

      const rootItems = response.data.map(cat => ({ type: 'category', ...cat }));
      setLevelStack([{ items: rootItems, selectedIndex: 0, parentName: 'Procedures' }]);
      setCurrentLevelIndex(0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const currentLevel = useMemo(() => {
    return levelStack[currentLevelIndex] || { items: [], parentName: 'Procedures' };
  }, [levelStack, currentLevelIndex]);

  const previousLevel = useMemo(() => {
    if (currentLevelIndex === 0) return null;
    return levelStack[currentLevelIndex - 1];
  }, [currentLevelIndex, levelStack]);

  const navigateDown = useCallback(() => {
    const item = currentLevel.items[selectedIndex];
    if (!item || item.type !== 'category') return;

    const childItems = [];
    if (item.children) item.children.forEach(child => childItems.push({ type: 'category', ...child }));
    if (item.posts) item.posts.forEach(post => childItems.push({
      type: 'post', id: post._id, name: post.title,
      workspaceId: post.workspaceId, workspaceName: post.workspaceName,
      canvasId: post.canvasId, titleElementId: post.titleElementId,
      color: '#3b82f6'
    }));

    if (childItems.length === 0) return;

    const updatedStack = [...levelStack];
    updatedStack[currentLevelIndex] = { ...updatedStack[currentLevelIndex], selectedIndex };
    updatedStack.push({ items: childItems, selectedIndex: 0, parentName: item.name });

    setLevelTransition('down');
    setLevelStack(updatedStack);
    setCurrentLevelIndex(currentLevelIndex + 1);
    setSelectedIndex(0);
    setTimeout(() => setLevelTransition(null), 150);
  }, [currentLevel, selectedIndex, levelStack, currentLevelIndex]);

  const navigateUp = useCallback(() => {
    if (currentLevelIndex === 0) return;

    const previousLevelData = levelStack[currentLevelIndex - 1];
    setLevelTransition('up');
    setCurrentLevelIndex(currentLevelIndex - 1);
    setSelectedIndex(previousLevelData.selectedIndex);
    setLevelStack(levelStack.slice(0, currentLevelIndex));
    setTimeout(() => setLevelTransition(null), 150);
  }, [currentLevelIndex, levelStack]);

  const handleSelect = useCallback(() => {
    const item = currentLevel.items[selectedIndex];
    if (!item) return;

    if (item.type === 'post' && item.workspaceId) {
      // Use titleElementId if available, otherwise fall back to wrapper id
      const elementIdToNavigate = item.titleElementId || item.id;

      setAnimationState('closing');
      setTimeout(() => {
        setAnimationState('closed');
        closeNavigation();

        // If same workspace, dispatch zoomToElement event directly (like TitleNavigation)
        if (item.workspaceId === currentWorkspaceId) {
          const event = new CustomEvent('zoomToElement', {
            detail: { _id: elementIdToNavigate }
          });
          window.dispatchEvent(event);
        } else {
          // Different workspace - navigate with URL parameter
          const params = new URLSearchParams();
          params.set('element', elementIdToNavigate);
          if (item.canvasId) params.set('canvas', item.canvasId);
          navigate(`/workspace/${item.workspaceId}?${params.toString()}`);
        }
      }, 280);
    } else if (item.type === 'category') {
      navigateDown();
    }
  }, [currentLevel, selectedIndex, closeNavigation, navigate, navigateDown, currentWorkspaceId]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen || animationState !== 'open') return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (currentLevelIndex > 0) {
          navigateUp();
        } else {
          handleClose();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentLevel.items.length > 0) {
          setSelectedIndex(prev => prev > 0 ? prev - 1 : currentLevel.items.length - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentLevel.items.length > 0) {
          setSelectedIndex(prev => prev < currentLevel.items.length - 1 ? prev + 1 : 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateUp();
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect();
        break;
      default:
        break;
    }
  }, [isOpen, animationState, currentLevelIndex, currentLevel, navigateDown, navigateUp, handleSelect, handleClose]);

  useEffect(() => {
    if (isOpen && animationState === 'closed') {
      setAnimationState('opening');
      fetchCategories();
      setTimeout(() => setAnimationState('open'), 350);
    }
  }, [isOpen, animationState, fetchCategories]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen && animationState === 'closed') return null;

  const isClosing = animationState === 'closing';
  const isOpening = animationState === 'opening';

  // Spacing between items - increased for better readability with labels
  const ITEM_SPACING = 120; // Fixed spacing between items

  // Get item X position with sliding offset (selected item centered)
  const getItemX = (index, total, selectedIdx) => {
    // Calculate offset to center the selected item
    const centerOffset = selectedIdx * ITEM_SPACING;
    return (index * ITEM_SPACING) - centerOffset;
  };

  const hoveredItemData = currentLevel.items[selectedIndex];

  // Render a level row with sliding animation
  const renderLevel = (level, yOffset, opacity, scale, isActive, animDelay = 0) => {
    if (!level || level.items.length === 0) return null;

    const activeSelectedIdx = isActive ? selectedIndex : level.selectedIndex || 0;
    const lineStartX = 360 + getItemX(0, level.items.length, activeSelectedIdx);
    const lineEndX = 360 + getItemX(level.items.length - 1, level.items.length, activeSelectedIdx);

    return (
      <g
        className="transition-all duration-300 ease-out"
        style={{
          transform: `translateY(${yOffset}px) scale(${scale})`,
          opacity,
          transformOrigin: '360px 360px'
        }}
      >
        {/* Horizontal connection line - slides with items */}
        {level.items.length > 1 && (
          <line
            x1={lineStartX}
            y1="360"
            x2={lineEndX}
            y2="360"
            stroke="#525252"
            strokeWidth="1"
            strokeDasharray="8 6"
            className="transition-all duration-300 ease-out"
          />
        )}

        {/* Render items as foreignObject for React components */}
        {level.items.map((item, index) => {
          const x = getItemX(index, level.items.length, activeSelectedIdx);
          const isSelected = isActive && index === selectedIndex;
          const isHovered = isActive && hoveredItem === (item.id || item._id);
          const hasChildren = item.type === 'category' &&
            ((item.children?.length || 0) + (item.posts?.length || 0)) > 0;

          // Calculate opacity based on distance from center for fade effect
          const distanceFromCenter = Math.abs(index - activeSelectedIdx);
          const itemOpacity = Math.max(0.3, 1 - distanceFromCenter * 0.15);

          return (
            <g
              key={item.id || item._id || index}
              className="transition-all duration-300 ease-out"
              style={{
                transform: `translateX(${x}px)`,
                opacity: isActive ? itemOpacity : 0.5
              }}
            >
              <foreignObject
                x={360 - 60}
                y={360 - 32}
                width="120"
                height="100"
                style={{ overflow: 'visible' }}
              >
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (!isActive) return;
                      setSelectedIndex(index);
                      if (item.type === 'post' && item.workspaceId) {
                        setAnimationState('closing');
                        setTimeout(() => {
                          setAnimationState('closed');
                          closeNavigation();
                          const params = new URLSearchParams();
                          params.set('element', item.id);
                          if (item.canvasId) params.set('canvas', item.canvasId);
                          navigate(`/workspace/${item.workspaceId}?${params.toString()}`);
                        }, 280);
                      } else if (item.type === 'category') {
                        setTimeout(navigateDown, 50);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!isActive) return;
                      setHoveredItem(item.id || item._id);
                      setSelectedIndex(index);
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 border-2 ${
                      isSelected || isHovered
                        ? 'bg-white text-neutral-900 border-white scale-115 shadow-xl shadow-white/20'
                        : 'bg-neutral-800/90 text-neutral-200 border-neutral-600/50 hover:bg-neutral-700 hover:border-neutral-500'
                    }`}
                    style={{
                      animation: isOpening && isActive ? `scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay + index * 40}ms both` : undefined,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    {item.type === 'category' ? (
                      <span className="text-xl">
                        <CategoryIcon name={item.icon || 'folder'} size={22} />
                      </span>
                    ) : (
                      <Document size={22} />
                    )}

                    {/* Children count badge */}
                    {hasChildren && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                        isSelected || isHovered ? 'bg-neutral-800 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {(item.children?.length || 0) + (item.posts?.length || 0)}
                      </div>
                    )}

                    {/* Selection ring */}
                    {isSelected && !isHovered && (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
                    )}
                  </button>

                  {/* Item label - ALWAYS VISIBLE */}
                  <div className={`mt-2 max-w-[110px] text-center px-2 py-1 rounded-lg transition-all duration-200 ${
                    isSelected || isHovered
                      ? 'bg-white/95 border border-white/50 text-neutral-900 shadow-xl'
                      : 'bg-neutral-800/80 border border-neutral-700/50 text-neutral-300'
                  }`}>
                    <span className="text-[10px] font-medium line-clamp-2 leading-tight">
                      {item.name}
                    </span>
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    );
  };

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Backdrop with blur */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-300 ${
          isClosing ? 'opacity-0' : isOpening ? 'opacity-0 animate-fadeIn' : 'opacity-100'
        }`}
      />

      {/* Main container - 720x720 */}
      <div
        className={`relative w-[720px] h-[720px] transition-all duration-400 ease-out ${
          isClosing ? 'scale-90 opacity-0' : isOpening ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* SVG for lines and levels */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#525252" stopOpacity="0" />
              <stop offset="50%" stopColor="#525252" stopOpacity="1" />
              <stop offset="100%" stopColor="#525252" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Decorative horizontal lines */}
          <line x1="60" y1="360" x2="660" y2="360" stroke="#404040" strokeWidth="1" strokeDasharray="4 8" opacity="0.15" />

          {/* Previous level (above, dimmed) */}
          {previousLevel && !levelTransition && renderLevel(
            previousLevel,
            -120,
            0.3,
            0.8,
            false,
            0
          )}

          {/* Current level (center) */}
          {!loading && currentLevel.items.length > 0 && renderLevel(
            currentLevel,
            levelTransition === 'down' ? -120 : levelTransition === 'up' ? 120 : 0,
            levelTransition ? 0 : 1,
            levelTransition ? 0.8 : 1,
            !levelTransition,
            100
          )}
        </svg>


        {/* Breadcrumb path */}
        {currentLevelIndex > 0 && (
          <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
            isOpening ? 'opacity-0' : 'opacity-100'
          }`}>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
              {levelStack.slice(0, currentLevelIndex + 1).map((level, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-neutral-700">/</span>}
                  <span
                    className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded ${
                      idx === currentLevelIndex ? 'text-white bg-neutral-800' : 'hover:text-neutral-300'
                    }`}
                    onClick={() => {
                      if (idx < currentLevelIndex) {
                        setLevelStack(levelStack.slice(0, idx + 1));
                        setCurrentLevelIndex(idx);
                        setSelectedIndex(levelStack[idx].selectedIndex);
                      }
                    }}
                  >
                    {level.parentName}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && currentLevel.items.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
            <FolderOpen size={32} className="text-neutral-700 mx-auto mb-2" />
            <p className="text-neutral-500 text-xs">No categories yet</p>
          </div>
        )}

        {/* Level navigation hints */}
        {currentLevel.items.length > 0 && !loading && (
          <>
            {/* Left arrow indicator - shows when there are items to the left */}
            {selectedIndex > 0 && (
              <div
                className={`absolute left-8 top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:opacity-100 z-30 ${
                  isOpening ? 'opacity-0' : 'opacity-60'
                }`}
                onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-800/90 border border-neutral-700 backdrop-blur-sm hover:bg-neutral-700 transition-colors">
                  <span className="text-white text-lg">←</span>
                  <span className="text-neutral-400 text-xs">{selectedIndex} more</span>
                </div>
              </div>
            )}

            {/* Right arrow indicator - shows when there are items to the right */}
            {selectedIndex < currentLevel.items.length - 1 && (
              <div
                className={`absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:opacity-100 z-30 ${
                  isOpening ? 'opacity-0' : 'opacity-60'
                }`}
                onClick={() => setSelectedIndex(prev => Math.min(currentLevel.items.length - 1, prev + 1))}
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-800/90 border border-neutral-700 backdrop-blur-sm hover:bg-neutral-700 transition-colors">
                  <span className="text-neutral-400 text-xs">{currentLevel.items.length - 1 - selectedIndex} more</span>
                  <span className="text-white text-lg">→</span>
                </div>
              </div>
            )}

            {/* Down arrow for categories with children */}
            {hoveredItemData?.type === 'category' && ((hoveredItemData.children?.length || 0) + (hoveredItemData.posts?.length || 0)) > 0 && (
              <div className={`absolute bottom-36 left-1/2 -translate-x-1/2 transition-all duration-300 ${
                isOpening ? 'opacity-0' : 'opacity-40'
              }`}>
                <div className="flex flex-col items-center text-neutral-500 text-[9px]">
                  <span>↓ expand</span>
                </div>
              </div>
            )}

            {/* Up arrow to go back */}
            {currentLevelIndex > 0 && (
              <div
                className={`absolute top-28 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 hover:opacity-70 ${
                  isOpening ? 'opacity-0' : 'opacity-40'
                }`}
                onClick={navigateUp}
              >
                <div className="flex flex-col items-center text-neutral-500 text-[9px]">
                  <span>↑ back</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom hints */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-4' : isOpening ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 rounded-md bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[10px] font-medium backdrop-blur-sm">
            ←→
          </kbd>
          <span className="text-neutral-500 text-[10px]">navigate</span>
        </div>
        <div className="w-px h-3 bg-neutral-700" />
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 rounded-md bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[10px] font-medium backdrop-blur-sm">
            ↓↑
          </kbd>
          <span className="text-neutral-500 text-[10px]">levels</span>
        </div>
        <div className="w-px h-3 bg-neutral-700" />
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 rounded-md bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[10px] font-medium backdrop-blur-sm">
            Enter
          </kbd>
          <span className="text-neutral-500 text-[10px]">select</span>
        </div>
        <div className="w-px h-3 bg-neutral-700" />
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 rounded-md bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[10px] font-medium backdrop-blur-sm">
            Esc
          </kbd>
          <span className="text-neutral-500 text-[10px]">close</span>
        </div>
      </div>

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

        @keyframes drawLine {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .scale-115 {
          transform: scale(1.15);
        }
      `}</style>
    </div>,
    document.body
  );
};

export default WorkspaceNavigation;
