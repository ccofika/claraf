import React, { useEffect, useRef } from 'react';
import { useMinimizedTicket } from '../context/MinimizedTicketContext';

const WARP_CSS = `
  /* === MINIMIZE (modal → dock) === */
  @keyframes minimizeWarpShape {
    0% {
      clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
      transform: scale(1);
      opacity: 1;
      filter: brightness(1);
      border-radius: 0px;
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
    }
    14% {
      clip-path: polygon(0% 0%, 100% 0%, 97% 100%, 3% 100%);
      transform: scale(1.005);
      opacity: 1;
      filter: brightness(1.04);
      border-radius: 0px;
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
    }
    30% {
      clip-path: polygon(1% 0%, 99% 0%, 76% 100%, 24% 100%);
      transform: scale(0.82);
      opacity: 1;
      filter: brightness(0.97);
      border-radius: 10px;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    48% {
      clip-path: polygon(7% 0%, 93% 0%, 61% 100%, 39% 100%);
      transform: scale(0.38);
      opacity: 0.9;
      filter: brightness(0.9);
      border-radius: 22px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    64% {
      clip-path: polygon(18% 0%, 82% 0%, 56% 100%, 44% 100%);
      transform: scale(0.1);
      opacity: 0.6;
      filter: brightness(0.85);
      border-radius: 28px;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }
    78% {
      clip-path: polygon(32% 0%, 68% 0%, 54% 100%, 46% 100%);
      transform: scale(0.025);
      opacity: 0.4;
      filter: brightness(1.3);
      border-radius: 34px;
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
    }
    90% {
      clip-path: polygon(42% 0%, 58% 0%, 52% 100%, 48% 100%);
      transform: scale(0.008);
      opacity: 0.25;
      filter: brightness(2);
      border-radius: 44px;
      backdrop-filter: blur(26px);
      -webkit-backdrop-filter: blur(26px);
    }
    100% {
      clip-path: polygon(48% 0%, 52% 0%, 50.5% 100%, 49.5% 100%);
      transform: scale(0.002);
      opacity: 0;
      filter: brightness(2.8);
      border-radius: 50px;
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
    }
  }

  @keyframes minimizeWarpBgLight {
    0%   { background-color: rgba(255,255,255,1); }
    20%  { background-color: rgba(255,255,255,0.9); }
    40%  { background-color: rgba(255,255,255,0.6); }
    60%  { background-color: rgba(255,255,255,0.2); }
    75%  { background-color: rgba(255,255,255,0.05); }
    88%  { background-color: rgba(190,195,215,0.4); }
    100% { background-color: rgba(200,205,225,0.55); }
  }

  @keyframes minimizeWarpBgDark {
    0%   { background-color: rgba(23,23,23,1); }
    20%  { background-color: rgba(23,23,23,0.9); }
    40%  { background-color: rgba(23,23,23,0.6); }
    60%  { background-color: rgba(23,23,23,0.2); }
    75%  { background-color: rgba(23,23,23,0.05); }
    88%  { background-color: rgba(160,170,255,0.45); }
    100% { background-color: rgba(210,218,255,0.65); }
  }

  @keyframes gravityWellPulse {
    0%   { opacity: 0; transform: translateX(-50%) scale(0.3); }
    25%  { opacity: 0.3; transform: translateX(-50%) scale(0.6); }
    55%  { opacity: 0.85; transform: translateX(-50%) scale(1.1); }
    80%  { opacity: 0.5; transform: translateX(-50%) scale(1.15); }
    100% { opacity: 0; transform: translateX(-50%) scale(1.3); }
  }

  @keyframes warpOverlayFade {
    0%   { opacity: 1; }
    35%  { opacity: 0.55; }
    65%  { opacity: 0.1; }
    100% { opacity: 0; }
  }

  /* === RESTORE - simple fast overlay fade === */
  @keyframes restoreOverlayFade {
    0%   { opacity: 0.85; }
    100% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes minimizeWarpShape {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes gravityWellPulse {
      0%   { opacity: 0; }
      100% { opacity: 0; }
    }
    .minimize-warp-phantom {
      animation-duration: 150ms !important;
    }
  }
`;

const MinimizeWarpAnimation = () => {
  const { warpAnimation, clearWarpAnimation, restoreAnimation, clearRestoreAnimation } = useMinimizedTicket();
  const phantomRef = useRef(null);

  // Minimize animation end handler
  useEffect(() => {
    if (!warpAnimation) return;

    const phantom = phantomRef.current;
    if (!phantom) return;

    const handleAnimationEnd = (e) => {
      if (e.target === phantom && e.animationName === 'minimizeWarpShape') {
        clearWarpAnimation();
      }
    };

    phantom.addEventListener('animationend', handleAnimationEnd);
    return () => phantom.removeEventListener('animationend', handleAnimationEnd);
  }, [warpAnimation, clearWarpAnimation]);

  if (!warpAnimation && !restoreAnimation) return null;

  return (
    <>
      <style>{WARP_CSS}</style>

      {/* === MINIMIZE ANIMATION === */}
      {warpAnimation && (() => {
        const isDark = warpAnimation.isDark;
        const bgAnim = isDark ? 'minimizeWarpBgDark' : 'minimizeWarpBgLight';
        return (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                backgroundColor: 'rgba(0,0,0,0.8)',
                animation: 'warpOverlayFade 360ms linear forwards',
                pointerEvents: 'none',
              }}
            />
            <div
              ref={phantomRef}
              className="minimize-warp-phantom"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                willChange: 'clip-path, transform, opacity, filter, border-radius, background-color, backdrop-filter',
                transformOrigin: '50% calc(100% - 36px)',
                animation: `minimizeWarpShape 360ms linear forwards, ${bgAnim} 360ms linear forwards`,
                overflow: 'hidden',
                pointerEvents: 'none',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  width: '280px',
                  height: '140px',
                  background: isDark
                    ? 'radial-gradient(ellipse at center bottom, rgba(140,150,255,0.4) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)'
                    : 'radial-gradient(ellipse at center bottom, rgba(130,140,200,0.3) 0%, rgba(99,102,180,0.08) 40%, transparent 70%)',
                  animation: 'gravityWellPulse 360ms linear forwards',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </>
        );
      })()}

      {/* === RESTORE - fast overlay fade to cover navigation transition === */}
      {restoreAnimation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            backgroundColor: 'rgba(0,0,0,0.85)',
            animation: 'restoreOverlayFade 180ms ease-out forwards',
            pointerEvents: 'none',
          }}
          onAnimationEnd={() => clearRestoreAnimation()}
        />
      )}
    </>
  );
};

export default MinimizeWarpAnimation;
