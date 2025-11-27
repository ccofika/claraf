import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
      icon: Home,
      path: null, // Dynamic - navigates to workspace
      hasSubpages: true,
      subpageType: 'workspaces',
    },
    {
      id: 'vip-calculator',
      label: 'VIP Calculator',
      icon: Calculator,
      path: '/vip-calculator',
      hasSubpages: false,
    },
    {
      id: 'hash-explorer',
      label: 'Hash Explorer',
      icon: SearchIcon,
      path: '/hash-explorer',
      hasSubpages: false,
    },
    {
      id: 'quick-links',
      label: 'Quick Links',
      icon: LinkIcon,
      path: '/quick-links',
      hasSubpages: false,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: ChatBubble,
      path: '/chat',
      hasSubpages: true,
      subpageType: 'chat',
    },
    {
      id: 'kyc',
      label: 'KYC Management',
      icon: CheckmarkFilled,
      path: '/kyc',
      hasSubpages: false,
    },
    {
      id: 'countries-restrictions',
      label: 'Countries',
      icon: EarthFilled,
      path: '/countries-restrictions',
      hasSubpages: false,
    },
  ];

  // Add role-restricted pages
  if (isDeveloperOrAdmin) {
    pages.push({
      id: 'developer-dashboard',
      label: 'Dev Dashboard',
      icon: ChartLine,
      path: '/developer-dashboard',
      hasSubpages: false,
    });
  }

  if (hasQAAccess) {
    pages.push({
      id: 'qa-manager',
      label: 'QA Manager',
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
      icon: Analytics,
      path: '/kyc-agent-stats',
      hasSubpages: false,
    });
  }

  return pages;
};

// Animation timing
const ANIMATION_DURATION = 300;
const STAGGER_DELAY = 30;

const WheelNavigation = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentChannels } = useChat();

  const [hoveredPage, setHoveredPage] = useState(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [workspaceSubpages, setWorkspaceSubpages] = useState([]);
  const [chatSubpages, setChatSubpages] = useState([]);
  const hoverTimeoutRef = React.useRef(null);

  // Handle hover with delay for subpages
  const handlePageMouseEnter = (pageId) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredPage(pageId);
  };

  const handlePageMouseLeave = () => {
    // Set a timeout before hiding subpages (gives user time to reach them)
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPage(null);
    }, 800); // 800ms delay
  };

  const handleSubpageMouseEnter = (pageId) => {
    // Clear the timeout - user reached a subpage
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredPage(pageId);
  };

  const handleSubpageMouseLeave = () => {
    // Set a timeout before hiding
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPage(null);
    }, 400); // Shorter delay when leaving subpage
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const pages = useMemo(() => getPageConfig(user), [user]);

  // Fetch workspace subpages
  useEffect(() => {
    const fetchWorkspaceSubpages = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('token');

        // Fetch recent workspaces
        const recentRes = await axios.get(
          `${API_URL}/api/users/recent/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let subpages = [];

        // Fetch all workspaces to find announcements
        const workspacesRes = await axios.get(
          `${API_URL}/api/workspaces`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const announcements = workspacesRes.data.find(w => w.type === 'announcements');

        if (recentRes.data && recentRes.data.length > 0) {
          // Use recent workspaces
          subpages = recentRes.data.slice(0, 3).map(w => ({
            id: w._id,
            label: w.name,
            icon: Home,
            path: `/workspace/${w._id}`,
          }));

          // Add announcements if not already in recent
          if (announcements && !subpages.find(s => s.id === announcements._id)) {
            subpages.unshift({
              id: announcements._id,
              label: 'Announcements',
              icon: Bullhorn,
              path: `/workspace/${announcements._id}`,
            });
          }
        } else {
          // No recent workspaces - use announcements + first 3 workspaces
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

        // Limit to 4 subpages
        setWorkspaceSubpages(subpages.slice(0, 4));
      } catch (err) {
        console.error('Error fetching workspace subpages:', err);
      }
    };

    if (isOpen) {
      fetchWorkspaceSubpages();
    }
  }, [isOpen, user]);

  // Update chat subpages from recent channels
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

  // Get subpages for a page
  const getSubpages = useCallback((page) => {
    if (!page.hasSubpages) return [];

    switch (page.subpageType) {
      case 'workspaces':
        return workspaceSubpages;
      case 'chat':
        return chatSubpages;
      case 'qa':
        return page.staticSubpages || [];
      default:
        return [];
    }
  }, [workspaceSubpages, chatSubpages]);

  // Handle navigation
  const handleNavigate = useCallback((path, pageId, subpage = null) => {
    setSelectedItem({ pageId, subpageId: subpage?.id });
    setIsAnimatingOut(true);

    setTimeout(() => {
      // Set flag for page transition animation
      sessionStorage.setItem('wheel-navigation', 'true');

      if (path) {
        navigate(path);
      } else if (pageId === 'workspaces' && workspaceSubpages.length > 0) {
        // Navigate to first workspace if no specific path
        navigate(workspaceSubpages[0].path);
      }

      onClose();
      setIsAnimatingOut(false);
      setSelectedItem(null);
    }, ANIMATION_DURATION);
  }, [navigate, onClose, workspaceSubpages]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsAnimatingOut(true);
        setTimeout(() => {
          onClose();
          setIsAnimatingOut(false);
        }, ANIMATION_DURATION);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Calculate positions for main pages in a circle
  const getPagePosition = (index, total) => {
    const startAngle = -90; // Start from top
    const angleStep = 360 / total;
    const angle = startAngle + (index * angleStep);
    const angleRad = (angle * Math.PI) / 180;
    const radius = 180; // Main circle radius

    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
      angle: angle,
    };
  };

  // Calculate ABSOLUTE positions for subpages (from wheel center, outside main circle)
  const getSubpagePosition = (index, total, parentAngle, parentX, parentY) => {
    // Subpages fan out from the parent toward the outside of the wheel
    const spreadAngle = 18; // Degrees between subpages
    const startOffset = -((total - 1) * spreadAngle) / 2;
    const angle = parentAngle + startOffset + (index * spreadAngle);
    const angleRad = (angle * Math.PI) / 180;

    // Subpages are positioned at a larger radius than main pages (outside the main circle)
    const subpageRadius = 250; // Main radius is 180, so this is outside

    // Calculate absolute position from wheel center
    return {
      x: Math.cos(angleRad) * subpageRadius,
      y: Math.sin(angleRad) * subpageRadius,
    };
  };

  if (!isOpen && !isAnimatingOut) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsAnimatingOut(true);
          setTimeout(() => {
            onClose();
            setIsAnimatingOut(false);
          }, ANIMATION_DURATION);
        }
      }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimatingOut ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Wheel Container - large enough for subpages outside main circle */}
      <div className="relative w-[600px] h-[600px]">
        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Animated pulse rings */}
          <div className="absolute top-1/2 left-1/2 w-28 h-28 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/5" />

          {/* Main center circle */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 flex flex-col items-center justify-center backdrop-blur-sm">
            <span className="text-white/80 text-xs font-medium text-center px-2 leading-tight">
              {hoveredPage ? pages.find(p => p.id === hoveredPage)?.label : 'Quick Nav'}
            </span>
            {!hoveredPage && (
              <span className="text-white/40 text-[10px] mt-1">
                Alt+N
              </span>
            )}
          </div>
        </div>

        {/* Main Pages */}
        {pages.map((page, index) => {
          const pos = getPagePosition(index, pages.length);
          const isHovered = hoveredPage === page.id;
          const isSelected = selectedItem?.pageId === page.id && !selectedItem?.subpageId;
          const subpages = getSubpages(page);
          const Icon = page.icon;

          return (
            <React.Fragment key={page.id}>
              {/* Main Page Item */}
              <div
                className={`absolute top-1/2 left-1/2 transition-all ${
                  isAnimatingOut && isSelected ? 'duration-300 scale-150 opacity-0' : 'duration-300'
                }`}
                style={{
                  transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                  animationDelay: `${index * STAGGER_DELAY}ms`,
                }}
                onMouseEnter={() => handlePageMouseEnter(page.id)}
                onMouseLeave={handlePageMouseLeave}
              >
                <button
                  onClick={() => handleNavigate(page.path, page.id)}
                  className={`group relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 ${
                    isHovered
                      ? 'bg-white text-gray-900 scale-110 shadow-lg shadow-white/20'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    animation: !isAnimatingOut ? `wheelItemIn 0.3s ease-out ${index * STAGGER_DELAY}ms both` : undefined,
                  }}
                >
                  <Icon size={24} />

                  {/* Label tooltip */}
                  <div className={`absolute whitespace-nowrap px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium transition-all duration-200 pointer-events-none ${
                    isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                  style={{
                    top: pos.y > 0 ? 'auto' : '100%',
                    bottom: pos.y > 0 ? '100%' : 'auto',
                    marginTop: pos.y > 0 ? undefined : '8px',
                    marginBottom: pos.y > 0 ? '8px' : undefined,
                  }}>
                    {page.label}
                  </div>

                  {/* Subpage indicator */}
                  {page.hasSubpages && subpages.length > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {subpages.length}
                    </div>
                  )}
                </button>
              </div>

              {/* Subpages - positioned OUTSIDE the main circle, at wheel container level */}
              {isHovered && subpages.length > 0 && subpages.map((subpage, subIndex) => {
                const subPos = getSubpagePosition(subIndex, subpages.length, pos.angle, pos.x, pos.y);
                const SubIcon = subpage.icon;
                const isSubSelected = selectedItem?.pageId === page.id && selectedItem?.subpageId === subpage.id;

                return (
                  <div
                    key={`${page.id}-${subpage.id}`}
                    className="group/subpage absolute z-10"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${subPos.x}px), calc(-50% + ${subPos.y}px))`,
                      opacity: 0,
                      animation: `fadeScaleIn 0.25s ease-out ${subIndex * 50}ms forwards`,
                    }}
                    onMouseEnter={() => handleSubpageMouseEnter(page.id)}
                    onMouseLeave={handleSubpageMouseLeave}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(subpage.path || page.path, page.id, subpage);
                      }}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-gray-900 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg ${
                        isSubSelected ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <SubIcon size={16} />
                    </button>

                    {/* Subpage label - shows on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap px-2 py-1 rounded bg-gray-900 text-white text-[11px] font-medium opacity-0 group-hover/subpage:opacity-100 transition-all duration-200 pointer-events-none shadow-lg z-10 max-w-[120px] truncate">
                      {subpage.label}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/40 text-sm transition-opacity duration-300 ${
        isAnimatingOut ? 'opacity-0' : 'opacity-100'
      }`}>
        <kbd className="px-2 py-1 rounded bg-white/10 text-xs">Esc</kbd>
        <span>to close</span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes wheelItemIn {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            scale: 0.5;
          }
          to {
            opacity: 1;
            scale: 1;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WheelNavigation;
