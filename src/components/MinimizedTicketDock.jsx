import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import { useMinimizedTicket } from '../context/MinimizedTicketContext';

const MinimizedTicketDock = () => {
  const { minimizedTicket, clearMinimizedTicket, setRestoreRequested, dockAppearance, clearDockAppearance, startRestoreAnimation, restoreAnimation } = useMinimizedTicket();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entranceMode, setEntranceMode] = useState('normal');

  useEffect(() => {
    if (minimizedTicket) {
      setMounted(true);
      setEntranceMode(dockAppearance?.mode === 'warp-materialize' ? 'materialize' : 'normal');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (!minimizedTicket) {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
        setEntranceMode('normal');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [minimizedTicket, dockAppearance]);

  const isOnEditPage = location.pathname.includes('/qa-manager/tickets/') && location.pathname.endsWith('/edit');

  if (!mounted || !minimizedTicket || isOnEditPage) return null;

  const agentName = minimizedTicket.agentName || 'Unknown';
  const truncatedName = agentName.length > 16 ? agentName.substring(0, 16) + '...' : agentName;

  const handleRestore = () => {
    if (restoreAnimation) return;
    const ticketId = minimizedTicket.ticketObjectId;
    const mode = minimizedTicket.mode;
    startRestoreAnimation(false);
    setRestoreRequested(true);
    if (mode === 'edit' && ticketId) {
      navigate(`/qa-manager/tickets/${ticketId}/edit?restore=true`);
    } else {
      navigate('/qa-manager/tickets?restore=true');
    }
  };

  const handleDismiss = async () => {
    await clearMinimizedTicket();
  };

  const handleDockAnimationEnd = (e) => {
    if (e.animationName === 'dockMaterialize') {
      clearDockAppearance();
      setEntranceMode('normal');
    }
  };

  const isMaterialize = visible && entranceMode === 'materialize';

  return (
    <>
      <style>{`
        @keyframes dockRotateGradient {
          0% { --dock-gradient-angle: 0deg; }
          25% { --dock-gradient-angle: 90deg; }
          50% { --dock-gradient-angle: 180deg; }
          75% { --dock-gradient-angle: 270deg; }
          100% { --dock-gradient-angle: 360deg; }
        }
        @property --dock-gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes dockMaterialize {
          0% {
            transform: translateX(-50%) scale(0.15) translateY(10px);
            opacity: 0;
            filter: blur(16px);
          }
          45% {
            transform: translateX(-50%) scale(0.85);
            opacity: 0.6;
            filter: blur(3px);
          }
          80% {
            transform: translateX(-50%) scale(0.98);
            opacity: 0.92;
            filter: blur(0px);
          }
          100% {
            transform: translateX(-50%) scale(1) translateY(0);
            opacity: 1;
            filter: blur(0px);
          }
        }
        @keyframes dockGlowSettle {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          25% {
            opacity: 0.5;
            transform: scale(1.1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
          72% {
            opacity: 0.4;
            transform: scale(1.02);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
        @keyframes dockGlowInner {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.2;
          }
          75% {
            opacity: 0.08;
          }
          100% {
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes dockMaterialize {
            0% { opacity: 0; transform: translateX(-50%); }
            100% { opacity: 1; transform: translateX(-50%); }
          }
          @keyframes dockGlowSettle {
            0% { opacity: 0; }
            100% { opacity: 0; }
          }
          @keyframes dockGlowInner {
            0% { opacity: 0; }
            100% { opacity: 0; }
          }
        }
      `}</style>
      <div
        className="fixed bottom-5 left-1/2 z-50"
        onAnimationEnd={handleDockAnimationEnd}
        style={{
          transform: isMaterialize
            ? undefined
            : `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
          opacity: isMaterialize ? undefined : (visible ? 1 : 0),
          transition: isMaterialize ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: isMaterialize
            ? 'dockMaterialize 300ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both'
            : 'none',
          pointerEvents: (visible && entranceMode === 'normal') ? 'auto' : 'none',
        }}
      >
        {/* Outer container with animated gradient border */}
        <div className="relative">

          {/* === GLOW ENERGY FROM MODAL ENTERING DOCK === */}
          {entranceMode === 'materialize' && (
            <>
              {/* Outer halo glow - Dark mode (white/blue glow) */}
              <div
                className="absolute -inset-3 rounded-[22px] hidden dark:block pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(190,198,255,0.7) 0%, rgba(140,150,255,0.25) 45%, transparent 72%)',
                  boxShadow: '0 0 35px 12px rgba(170,180,255,0.35), 0 0 70px 25px rgba(130,140,255,0.12)',
                  animation: 'dockGlowSettle 380ms ease-out 100ms both',
                }}
              />
              {/* Outer halo glow - Light mode (silver/gray glow) */}
              <div
                className="absolute -inset-3 rounded-[22px] dark:hidden pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(190,195,220,0.6) 0%, rgba(170,175,200,0.2) 45%, transparent 72%)',
                  boxShadow: '0 0 30px 10px rgba(175,180,210,0.25), 0 0 60px 20px rgba(155,160,190,0.08)',
                  animation: 'dockGlowSettle 380ms ease-out 100ms both',
                }}
              />
              {/* Inner glow fill that spreads into glass design - Dark mode */}
              <div
                className="absolute inset-[1.5px] rounded-[14.5px] hidden dark:block pointer-events-none"
                style={{
                  zIndex: 5,
                  background: 'linear-gradient(135deg, rgba(200,210,255,0.08) 0%, rgba(170,180,255,0.04) 50%, rgba(200,210,255,0.06) 100%)',
                  mixBlendMode: 'screen',
                  animation: 'dockGlowInner 400ms ease-out 80ms both',
                }}
              />
              {/* Inner glow fill that spreads into glass design - Light mode */}
              <div
                className="absolute inset-[1.5px] rounded-[14.5px] dark:hidden pointer-events-none"
                style={{
                  zIndex: 5,
                  background: 'linear-gradient(135deg, rgba(190,195,215,0.06) 0%, rgba(180,185,205,0.03) 50%, rgba(190,195,215,0.05) 100%)',
                  mixBlendMode: 'screen',
                  animation: 'dockGlowInner 400ms ease-out 80ms both',
                }}
              />
            </>
          )}

          {/* Animated gradient border - Light mode */}
          <div
            className="absolute inset-0 rounded-2xl dark:hidden"
            style={{
              padding: '1.5px',
              background: 'linear-gradient(var(--dock-gradient-angle, 0deg), rgba(0,0,0,0.12) 0%, rgba(120,120,180,0.15) 25%, rgba(0,0,0,0.04) 50%, rgba(120,120,180,0.12) 75%, rgba(0,0,0,0.1) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: 'dockRotateGradient 6s linear infinite',
            }}
          />
          {/* Animated gradient border - Dark mode */}
          <div
            className="absolute inset-0 rounded-2xl hidden dark:block"
            style={{
              padding: '1.5px',
              background: 'linear-gradient(var(--dock-gradient-angle, 0deg), rgba(255,255,255,0.35) 0%, rgba(140,160,255,0.3) 25%, rgba(255,255,255,0.08) 50%, rgba(140,160,255,0.25) 75%, rgba(255,255,255,0.3) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: 'dockRotateGradient 6s linear infinite',
            }}
          />

          {/* Glass background - Light mode */}
          <div
            className="absolute inset-[1.5px] rounded-[14.5px] dark:hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(245,245,250,0.72) 50%, rgba(255,255,255,0.78) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.02), 0 8px 32px rgba(31,38,135,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          {/* Glass background - Dark mode */}
          <div
            className="absolute inset-[1.5px] rounded-[14.5px] hidden dark:block"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(200,210,255,0.08) 50%, rgba(255,255,255,0.1) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -1px 1px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          />

          {/* Shine overlay - Light mode */}
          <div
            className="absolute inset-[1.5px] rounded-[14.5px] dark:hidden pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
              mixBlendMode: 'overlay',
            }}
          />
          {/* Shine overlay - Dark mode */}
          <div
            className="absolute inset-[1.5px] rounded-[14.5px] hidden dark:block pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-2.5">
            <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-600 dark:text-neutral-300">
              Ongoing ticket
            </span>
            <div className="w-px h-3.5 bg-gray-300/60 dark:bg-neutral-500/40" />
            <span className="text-xs text-gray-500 dark:text-neutral-400 max-w-[120px] truncate">
              {truncatedName}
            </span>
            <div className="w-px h-3.5 bg-gray-300/60 dark:bg-neutral-500/40" />
            <button
              onClick={handleRestore}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Back to Edit
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              onClick={handleDismiss}
              className="ml-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors text-xs"
              title="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MinimizedTicketDock;
