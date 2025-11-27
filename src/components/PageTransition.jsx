import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Check if this is a navigation from the wheel
    const fromWheel = sessionStorage.getItem('wheel-navigation');

    if (fromWheel) {
      sessionStorage.removeItem('wheel-navigation');
      setIsAnimating(true);

      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 400);

      return () => clearTimeout(timer);
    }

    setDisplayChildren(children);
  }, [location.pathname, children]);

  return (
    <div
      className={`w-full h-full transition-all duration-300 ${
        isAnimating ? 'animate-pageIn' : ''
      }`}
      style={{
        animation: isAnimating ? 'pageSlideIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards' : undefined,
      }}
    >
      {children}

      <style>{`
        @keyframes pageSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PageTransition;
