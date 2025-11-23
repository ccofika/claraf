import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Generate consistent color for each user based on their ID
const getUserColor = (userId) => {
  const colors = [
    { main: '#3B82F6', light: '#93C5FD' }, // Blue
    { main: '#10B981', light: '#6EE7B7' }, // Green
    { main: '#F59E0B', light: '#FCD34D' }, // Amber
    { main: '#EF4444', light: '#FCA5A5' }, // Red
    { main: '#8B5CF6', light: '#C4B5FD' }, // Purple
    { main: '#EC4899', light: '#F9A8D4' }, // Pink
    { main: '#14B8A6', light: '#5EEAD4' }, // Teal
    { main: '#F97316', light: '#FDBA74' }, // Orange
  ];

  // Use userId to generate consistent index
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

const LiveCursors = ({ viewport = { x: 0, y: 0, scale: 1 } }) => {
  const { socket, workspaceUsers } = useSocket();
  const { user } = useAuth();
  const [cursors, setCursors] = useState({});
  const [lastUpdate, setLastUpdate] = useState({});

  useEffect(() => {
    if (!socket) return;

    // Handle cursor updates from other users
    const handleCursorMoved = (data) => {
      const { userId, userName, cursor } = data;

      // Don't show own cursor
      if (userId === user?._id) return;

      // Update cursor position
      setCursors(prev => ({
        ...prev,
        [userId]: {
          x: cursor.x,
          y: cursor.y,
          elementId: cursor.elementId,
          userName,
          color: getUserColor(userId)
        }
      }));

      // Track last update time
      setLastUpdate(prev => ({
        ...prev,
        [userId]: Date.now()
      }));
    };

    // Handle user leaving workspace
    const handleUserLeft = (data) => {
      const { userId } = data;
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[userId];
        return newCursors;
      });
      setLastUpdate(prev => {
        const newLastUpdate = { ...prev };
        delete newLastUpdate[userId];
        return newLastUpdate;
      });
    };

    socket.on('workspace:cursor:moved', handleCursorMoved);
    socket.on('workspace:user:left', handleUserLeft);

    return () => {
      socket.off('workspace:cursor:moved', handleCursorMoved);
      socket.off('workspace:user:left', handleUserLeft);
    };
  }, [socket, user]);

  // Clean up stale cursors (not updated in last 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 3000; // 3 seconds

      setCursors(prev => {
        const newCursors = { ...prev };
        let hasChanges = false;

        Object.keys(newCursors).forEach(userId => {
          if (now - (lastUpdate[userId] || 0) > staleThreshold) {
            delete newCursors[userId];
            hasChanges = true;
          }
        });

        return hasChanges ? newCursors : prev;
      });

      setLastUpdate(prev => {
        const newLastUpdate = { ...prev };
        let hasChanges = false;

        Object.keys(newLastUpdate).forEach(userId => {
          if (now - (newLastUpdate[userId] || 0) > staleThreshold) {
            delete newLastUpdate[userId];
            hasChanges = true;
          }
        });

        return hasChanges ? newLastUpdate : prev;
      });
    }, 1000); // Check every 1 second

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Transform canvas coordinates back to screen coordinates
        // Reverse of the emit formula: canvasX = screenX / scale - posX / scale
        // Therefore: screenX = (canvasX + posX / scale) * scale
        // Simplified: screenX = canvasX * scale + posX
        const screenX = cursor.x * viewport.scale + viewport.x;
        const screenY = cursor.y * viewport.scale + viewport.y;

        // Don't render cursors that are far outside the viewport to prevent scrollbar
        // Add some padding (200px) to allow cursors slightly outside to still be visible
        const padding = 200;
        const isVisible =
          screenX >= -padding &&
          screenX <= viewport.width + padding &&
          screenY >= -padding &&
          screenY <= viewport.height + padding;

        if (!isVisible) return null;

        return (
          <div
            key={userId}
            className="absolute"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translate(-4px, -4px)',
            }}
          >
          {/* Modern Cursor Design */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.15))'
            }}
          >
            {/* Cursor shape */}
            <path
              d="M2 2L2 16L6.5 11.5L9 17L11.5 16L9 10.5L14 10.5L2 2Z"
              fill={cursor.color.main}
              stroke="white"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>

          {/* User name label - Modern pill design */}
          <div
            className="absolute left-5 top-3 px-2.5 py-1 rounded-full text-white text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: cursor.color.main,
              boxShadow: `0 2px 8px ${cursor.color.main}40, 0 1px 3px rgba(0,0,0,0.2)`,
            }}
          >
            {cursor.userName}
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default LiveCursors;
