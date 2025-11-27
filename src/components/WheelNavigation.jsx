import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import axios from 'axios';
import {
  Home,
  Calculator,
  Search as SearchIcon,
  Link as LinkIcon,
  CheckmarkFilled,
  EarthFilled,
  ChartLine,
  Task,
  Analytics,
  Chat as ChatBubble,
  Dashboard,
  UserMultiple,
  Document,
  Archive,
  Bullhorn,
} from '@carbon/icons-react';

const API_URL = process.env.REACT_APP_API_URL;

// Page configurations
const getPageConfig = (user) => {
  const isDeveloperOrAdmin = user?.role === 'admin' || user?.role === 'developer';
  const qaAllowedEmails = [
    'filipkozomara@mebit.io',
    'vasilijevitorovic@mebit.io',
    'nevena@mebit.io',
    'mladenjorganovic@mebit.io'
  ];
  const hasQAAccess = user?.email && qaAllowedEmails.includes(user.email);

  const pages = [
    {
      id: 'workspaces',
      label: 'Workspaces',
      description: 'Collaborative canvas',
      icon: Home,
      path: null,
      pathMatch: '/workspace',
      hasSubpages: true,
      subpageType: 'workspaces',
    },
    {
      id: 'vip-calculator',
      label: 'VIP Calculator',
      description: 'Calculate VIP progress',
      icon: Calculator,
      path: '/vip-calculator',
      hasSubpages: false,
    },
    {
      id: 'hash-explorer',
      label: 'Hash Explorer',
      description: 'Transaction lookup',
      icon: SearchIcon,
      path: '/hash-explorer',
      hasSubpages: false,
    },
    {
      id: 'quick-links',
      label: 'Quick Links',
      description: 'Saved bookmarks',
      icon: LinkIcon,
      path: '/quick-links',
      hasSubpages: false,
    },
    {
      id: 'chat',
      label: 'Chat',
      description: 'Team messaging',
      icon: ChatBubble,
      path: '/chat',
      hasSubpages: true,
      subpageType: 'chat',
    },
    {
      id: 'kyc',
      label: 'KYC Management',
      description: 'Verification requests',
      icon: CheckmarkFilled,
      path: '/kyc',
      hasSubpages: false,
    },
    {
      id: 'countries-restrictions',
      label: 'Countries',
      description: 'Geo restrictions',
      icon: EarthFilled,
      path: '/countries-restrictions',
      hasSubpages: false,
    },
  ];

  if (isDeveloperOrAdmin) {
    pages.push({
      id: 'developer-dashboard',
      label: 'Dev Dashboard',
      description: 'System analytics',
      icon: ChartLine,
      path: '/developer-dashboard',
      hasSubpages: false,
    });
  }

  if (hasQAAccess) {
    pages.push({
      id: 'qa-manager',
      label: 'QA Manager',
      description: 'Quality assurance',
      icon: Task,
      path: '/qa-manager',
      hasSubpages: true,
      subpageType: 'qa',
      staticSubpages: [
        { id: 'dashboard', label: 'Dashboard', icon: Dashboard, path: '/qa-manager?tab=dashboard' },
        { id: 'agents', label: 'Agents', icon: UserMultiple, path: '/qa-manager?tab=agents' },
        { id: 'tickets', label: 'Tickets', icon: Document, path: '/qa-manager?tab=tickets' },
        { id: 'archive', label: 'Archive', icon: Archive, path: '/qa-manager?tab=archive' },
      ],
    });
    pages.push({
      id: 'kyc-agent-stats',
      label: 'KYC Stats',
      description: 'Agent analytics',
      icon: Analytics,
      path: '/kyc-agent-stats',
      hasSubpages: false,
    });
  }

  return pages;
};

const WheelNavigation = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { recentChannels } = useChat();

  const [hoveredPage, setHoveredPage] = useState(null);
  const [animationState, setAnimationState] = useState('closed');
  const [selectedItem, setSelectedItem] = useState(null);
  const [workspaceSubpages, setWorkspaceSubpages] = useState([]);
  const [chatSubpages, setChatSubpages] = useState([]);
  const hoverTimeoutRef = React.useRef(null);

  const pages = useMemo(() => getPageConfig(user), [user]);

  // Detect current page
  const currentPageId = useMemo(() => {
    const path = location.pathname;
    for (const page of pages) {
      if (page.path && path.startsWith(page.path)) return page.id;
      if (page.pathMatch && path.startsWith(page.pathMatch)) return page.id;
    }
    return null;
  }, [location.pathname, pages]);

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

  // Hover handlers
  const handlePageMouseEnter = (pageId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredPage(pageId);
  };

  const handlePageMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredPage(null), 500);
  };

  const handleSubpageMouseEnter = (pageId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredPage(pageId);
  };

  const handleSubpageMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredPage(null), 300);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Fetch workspace subpages
  useEffect(() => {
    const fetchWorkspaceSubpages = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token');
        const recentRes = await axios.get(
          `${API_URL}/api/users/recent/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let subpages = [];
        const workspacesRes = await axios.get(
          `${API_URL}/api/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const announcements = workspacesRes.data.find(w => w.type === 'announcements');

        if (recentRes.data && recentRes.data.length > 0) {
          subpages = recentRes.data.slice(0, 3).map(w => ({
            id: w._id,
            label: w.name,
            icon: Home,
            path: `/workspace/${w._id}`,
          }));

          if (announcements && !subpages.find(s => s.id === announcements._id)) {
            subpages.unshift({
              id: announcements._id,
              label: 'Announcements',
              icon: Bullhorn,
              path: `/workspace/${announcements._id}`,
            });
          }
        } else {
          if (announcements) {
            subpages.push({
              id: announcements._id,
              label: 'Announcements',
              icon: Bullhorn,
              path: `/workspace/${announcements._id}`,
            });
          }
          const otherWorkspaces = workspacesRes.data
            .filter(w => w.type !== 'announcements')
            .slice(0, 3);
          otherWorkspaces.forEach(w => {
            subpages.push({
              id: w._id,
              label: w.name,
              icon: Home,
              path: `/workspace/${w._id}`,
            });
          });
        }
        setWorkspaceSubpages(subpages.slice(0, 4));
      } catch (err) {
        console.error('Error fetching workspace subpages:', err);
      }
    };

    if (isOpen) fetchWorkspaceSubpages();
  }, [isOpen, user]);

  // Update chat subpages
  useEffect(() => {
    if (recentChannels && recentChannels.length > 0) {
      const subpages = recentChannels.slice(0, 4).map(channel => ({
        id: channel._id,
        label: channel.name || (channel.type === 'dm' ? 'Direct Message' : 'Chat'),
        icon: ChatBubble,
        path: `/chat/${channel._id}`,
      }));
      setChatSubpages(subpages);
    }
  }, [recentChannels]);

  const getSubpages = useCallback((page) => {
    if (!page.hasSubpages) return [];
    switch (page.subpageType) {
      case 'workspaces': return workspaceSubpages;
      case 'chat': return chatSubpages;
      case 'qa': return page.staticSubpages || [];
      default: return [];
    }
  }, [workspaceSubpages, chatSubpages]);

  // Navigate with animation
  const handleNavigate = useCallback((path, pageId, subpage = null) => {
    setSelectedItem({ pageId, subpageId: subpage?.id });
    setAnimationState('navigating');

    setTimeout(() => {
      if (path) {
        navigate(path);
      } else if (pageId === 'workspaces' && workspaceSubpages.length > 0) {
        navigate(workspaceSubpages[0].path);
      }

      setTimeout(() => {
        setAnimationState('closed');
        onClose();
        setSelectedItem(null);
      }, 100);
    }, 450);
  }, [navigate, onClose, workspaceSubpages]);

  // Keyboard navigation (number keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setAnimationState('closing');
        setTimeout(() => setAnimationState('closed'), 280);
        return;
      }

      // Number key navigation (1-9)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= pages.length) {
        const page = pages[num - 1];
        handleNavigate(page.path, page.id);
      }
    };

    if (animationState === 'open') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [animationState, isOpen, pages, handleNavigate]);

  // Position calculations - LARGER RADIUS
  const getPagePosition = (index, total) => {
    const startAngle = -90;
    const angleStep = 360 / total;
    const angle = startAngle + (index * angleStep);
    const angleRad = (angle * Math.PI) / 180;
    const radius = 220; // Increased from 160
    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      angle: angle,
    };
  };

  const getSubpagePosition = (index, total, parentAngle) => {
    const spreadAngle = 16;
    const startOffset = -((total - 1) * spreadAngle) / 2;
    const angle = parentAngle + startOffset + (index * spreadAngle);
    const angleRad = (angle * Math.PI) / 180;
    const subpageRadius = 310; // Increased from 230
    return {
      x: Math.cos(angleRad) * subpageRadius,
      y: Math.sin(angleRad) * subpageRadius,
    };
  };

  if (animationState === 'closed') return null;

  const isClosing = animationState === 'closing';
  const isOpening = animationState === 'opening';
  const isNavigating = animationState === 'navigating';
  const hoveredPageData = pages.find(p => p.id === hoveredPage);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isClosing || isNavigating ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setAnimationState('closing');
          setTimeout(() => setAnimationState('closed'), 280);
        }
      }}
    >
      {/* Backdrop with blur */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-300 ${
          isClosing ? 'opacity-0' : isOpening ? 'opacity-0 animate-fadeIn' : 'opacity-100'
        }`}
      />

      {/* Main container - LARGER */}
      <div
        className={`relative w-[720px] h-[720px] transition-all duration-400 ease-out ${
          isNavigating ? 'scale-105' : isClosing ? 'scale-90 opacity-0' : isOpening ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Decorative outer ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-[520px] h-[520px] rounded-full border border-neutral-800/50 transition-all duration-500 ${
            isOpening ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`} />
        </div>

        {/* SVG Connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Main circle path */}
          <circle
            cx="50%"
            cy="50%"
            r="220"
            fill="none"
            stroke="url(#circleGradient)"
            strokeWidth="1"
            strokeDasharray="8 6"
            className={`transition-all duration-500 ${isOpening ? 'opacity-0' : 'opacity-30'}`}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#525252" />
              <stop offset="50%" stopColor="#737373" />
              <stop offset="100%" stopColor="#525252" />
            </linearGradient>
          </defs>

          {/* Connection lines to hovered page subpages */}
          {hoveredPage && getSubpages(pages.find(p => p.id === hoveredPage) || {}).map((_, idx) => {
            const page = pages.find(p => p.id === hoveredPage);
            if (!page) return null;
            const pageIndex = pages.indexOf(page);
            const pos = getPagePosition(pageIndex, pages.length);
            const subPos = getSubpagePosition(idx, getSubpages(page).length, pos.angle);

            return (
              <line
                key={idx}
                x1={360 + pos.x}
                y1={360 + pos.y}
                x2={360 + subPos.x}
                y2={360 + subPos.y}
                stroke="#525252"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-drawLine"
              />
            );
          })}
        </svg>

        {/* Center hub - LARGER */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className={`relative w-28 h-28 rounded-full bg-neutral-900/95 border border-neutral-700/80 flex flex-col items-center justify-center shadow-2xl shadow-black/50 transition-all duration-400 ${
            isOpening ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-neutral-700/20 to-transparent" />

            {hoveredPageData ? (
              <>
                <span className="text-white text-sm font-semibold text-center leading-tight z-10">
                  {hoveredPageData.label}
                </span>
                <span className="text-neutral-400 text-[10px] mt-1 text-center px-3 z-10">
                  {hoveredPageData.description}
                </span>
              </>
            ) : (
              <>
                <span className="text-neutral-200 text-sm font-medium z-10">Navigate</span>
                <span className="text-neutral-500 text-[10px] mt-1 z-10">Alt+N</span>
              </>
            )}
          </div>
        </div>

        {/* Main Pages */}
        {pages.map((page, index) => {
          const pos = getPagePosition(index, pages.length);
          const isHovered = hoveredPage === page.id;
          const isSelected = selectedItem?.pageId === page.id;
          const isCurrent = currentPageId === page.id;
          const subpages = getSubpages(page);
          const Icon = page.icon;

          return (
            <React.Fragment key={page.id}>
              {/* Main Page Item */}
              <div
                className={`absolute top-1/2 left-1/2 transition-all duration-300 ${
                  isNavigating && isSelected ? 'z-50' : 'z-10'
                }`}
                style={{
                  transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) ${
                    isNavigating && isSelected ? 'scale(3)' : ''
                  }`,
                  opacity: isNavigating && !isSelected ? 0 : 1,
                }}
                onMouseEnter={() => handlePageMouseEnter(page.id)}
                onMouseLeave={handlePageMouseLeave}
              >
                <button
                  onClick={() => handleNavigate(page.path, page.id)}
                  className={`group relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 border-2 ${
                    isHovered
                      ? 'bg-white text-neutral-900 border-white scale-115 shadow-xl shadow-white/20'
                      : isCurrent
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-neutral-800/90 text-neutral-200 border-neutral-600/50 hover:bg-neutral-700 hover:border-neutral-500'
                  } ${isSelected && isNavigating ? 'bg-white text-neutral-900 border-white' : ''}`}
                  style={{
                    animation: isOpening ? `scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 35}ms both` : undefined,
                  }}
                >
                  <Icon size={22} />

                  {/* Keyboard shortcut badge */}
                  <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full bg-neutral-700 border border-neutral-600 flex items-center justify-center text-[10px] font-bold text-neutral-300 transition-opacity duration-200 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Subpage indicator */}
                  {page.hasSubpages && subpages.length > 0 && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      isHovered
                        ? 'bg-neutral-800 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {subpages.length}
                    </div>
                  )}

                  {/* Current page indicator ring */}
                  {isCurrent && !isHovered && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Subpages */}
              {isHovered && subpages.length > 0 && subpages.map((subpage, subIndex) => {
                const subPos = getSubpagePosition(subIndex, subpages.length, pos.angle);
                const SubIcon = subpage.icon;
                const isSubSelected = selectedItem?.pageId === page.id && selectedItem?.subpageId === subpage.id;

                return (
                  <div
                    key={`${page.id}-${subpage.id}`}
                    className={`group/sub absolute z-20 transition-all duration-300 ${
                      isNavigating && isSubSelected ? 'z-50' : ''
                    }`}
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${subPos.x}px), calc(-50% + ${subPos.y}px)) ${
                        isNavigating && isSubSelected ? 'scale(3)' : ''
                      }`,
                      opacity: isNavigating && !isSubSelected ? 0 : 1,
                    }}
                    onMouseEnter={() => handleSubpageMouseEnter(page.id)}
                    onMouseLeave={handleSubpageMouseLeave}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(subpage.path || page.path, page.id, subpage);
                      }}
                      className={`relative flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-200 shadow-xl ${
                        isSubSelected && isNavigating
                          ? 'bg-white text-neutral-900 border-white'
                          : 'bg-neutral-800/95 text-neutral-200 border-neutral-600/50 hover:bg-neutral-700 hover:scale-110 hover:border-neutral-500'
                      }`}
                      style={{
                        animation: `popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${subIndex * 50}ms both`,
                      }}
                    >
                      <SubIcon size={16} />
                    </button>

                    {/* Subpage label */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-neutral-800/95 border border-neutral-700 text-neutral-200 text-[11px] font-medium opacity-0 group-hover/sub:opacity-100 transition-all duration-150 pointer-events-none shadow-xl max-w-[120px] truncate backdrop-blur-sm">
                      {subpage.label}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom hints */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 transition-all duration-300 ${
        isClosing || isNavigating ? 'opacity-0 translate-y-4' : isOpening ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex items-center gap-2">
          <kbd className="px-2.5 py-1.5 rounded-lg bg-neutral-800/90 border border-neutral-700 text-neutral-300 text-[11px] font-medium backdrop-blur-sm">
            1-{pages.length}
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

        @keyframes popIn {
          from {
            opacity: 0;
            scale: 0;
          }
          to {
            opacity: 1;
            scale: 1;
          }
        }

        @keyframes drawLine {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-drawLine {
          animation: drawLine 0.3s ease-out forwards;
        }

        .scale-115 {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
};

export default WheelNavigation;
