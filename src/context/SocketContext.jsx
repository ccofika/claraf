import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

const SocketContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const tokenRefreshIntervalRef = useRef(null);
  const visibilityHandlerRef = useRef(null);

  // Function to refresh token and re-authenticate socket
  const refreshTokenAndReauth = useCallback(async () => {
    try {
      // Try to refresh the token
      const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = response.data.token;
      if (newToken) {
        localStorage.setItem('token', newToken);

        // Re-authenticate socket with new token
        if (socketRef.current && socketRef.current.connected) {
          console.log('🔄 Re-authenticating socket with refreshed token...');
          socketRef.current.emit('authenticate', { token: newToken });
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh token for socket:', error);
      // If refresh fails with 401, session is invalid - force logout and redirect
      if (error.response?.status === 401) {
        console.log('🚪 Token refresh failed (401), forcing logout...');
        // Disconnect socket to prevent reconnection attempts
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        logout(true); // Force redirect to login
      }
    }
  }, [logout]);

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      // Clean up socket if user logs out
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket (user logged out)');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }

      // Clear intervals
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }

      return;
    }

    // Only create socket once when user first logs in
    if (socketRef.current) {
      console.log('🔌 Socket already exists, skipping creation');
      return;
    }

    console.log('🔌 Creating new socket connection for user:', user.email);

    // Create socket connection with improved settings for background tabs
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Never stop trying to reconnect
      timeout: 20000,
      // Prevent socket from being throttled in background tabs
      transports: ['websocket', 'polling'], // Prefer WebSocket
      upgrade: true,
      // Keep connection alive with ping/pong
      pingInterval: 25000, // Send ping every 25 seconds
      pingTimeout: 60000, // Wait 60 seconds for pong before disconnect
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected (ID:', newSocket.id, ')');
      setIsConnected(true);

      // Authenticate socket
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔐 Sending authentication...');
        newSocket.emit('authenticate', { token });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected - Reason:', reason);
      setIsConnected(false);
      setWorkspaceUsers([]);

      // If disconnected due to transport error or ping timeout, try to reconnect immediately
      if (reason === 'transport error' || reason === 'ping timeout') {
        console.log('🔄 Attempting immediate reconnection...');
        newSocket.connect();
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');

      // Re-authenticate after reconnection
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔐 Re-authenticating after reconnect...');
        newSocket.emit('authenticate', { token });
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after all attempts');
      // Try to refresh token and reconnect
      refreshTokenAndReauth().then(() => {
        newSocket.connect();
      });
    });

    newSocket.on('authenticated', (data) => {
      console.log('🔐 Socket authenticated:', data);

      // IMPORTANT: Re-initialize chat on every authentication (including reconnections)
      // This ensures user rejoins all chat channels after reconnection
      console.log('🔄 Emitting chat:init after authentication...');
      newSocket.emit('chat:init');
    });

    newSocket.on('auth_error', async (error) => {
      console.error('❌ Socket auth error:', error);

      // If auth error, try to refresh token
      if (error.message === 'jwt expired' || error.message === 'Authentication failed') {
        console.log('🔄 Token expired, attempting refresh...');
        await refreshTokenAndReauth();
      }
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Workspace event handlers
    newSocket.on('workspace:users:list', (data) => {
      setWorkspaceUsers(data.users || []);
    });

    newSocket.on('workspace:user:joined', (data) => {
      setWorkspaceUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        cursor: null,
        joinedAt: data.timestamp
      }]);
    });

    newSocket.on('workspace:user:left', (data) => {
      setWorkspaceUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Set up custom heartbeat to keep connection alive in background tabs
    // Browsers throttle setInterval in background tabs, but we use a longer interval
    heartbeatIntervalRef.current = setInterval(() => {
      if (newSocket.connected) {
        // Send a lightweight ping to keep connection alive
        newSocket.emit('heartbeat', { timestamp: Date.now() });
      } else {
        // Try to reconnect if disconnected
        console.log('💓 Heartbeat detected disconnect, reconnecting...');
        newSocket.connect();
      }
    }, 30000); // Every 30 seconds

    // Set up token refresh before expiry (every 10 minutes)
    // Access token expires in 15 minutes, so refresh at 10 minutes to be safe
    tokenRefreshIntervalRef.current = setInterval(() => {
      console.log('🔄 Scheduled token refresh for socket...');
      refreshTokenAndReauth();
    }, 10 * 60 * 1000); // Every 10 minutes

    // Handle visibility change - reconnect when tab becomes visible
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible, checking socket connection...');

        if (!newSocket.connected) {
          console.log('🔄 Socket disconnected while tab was hidden, reconnecting...');
          newSocket.connect();
        } else {
          // Re-authenticate to ensure token is still valid
          const token = localStorage.getItem('token');
          if (token) {
            newSocket.emit('authenticate', { token });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', visibilityHandlerRef.current);

    // Handle online/offline events
    const handleOnline = () => {
      console.log('🌐 Network online, reconnecting socket...');
      if (!newSocket.connected) {
        newSocket.connect();
      }
    };

    const handleOffline = () => {
      console.log('📵 Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (newSocket) {
        console.log('🔌 Cleaning up socket (component unmount)');
        newSocket.disconnect();
      }

      // Clear intervals
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }

      // Remove event listeners
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?._id, refreshTokenAndReauth]); // Only depend on user ID, not entire user object

  // Join workspace
  const joinWorkspace = useCallback((workspaceId) => {
    if (socket && isConnected && workspaceId) {
      socket.emit('workspace:join', { workspaceId });
      setCurrentWorkspace(workspaceId);
    }
  }, [socket, isConnected]);

  // Leave workspace
  const leaveWorkspace = useCallback(() => {
    setCurrentWorkspace(null);
    setWorkspaceUsers([]);
  }, []);

  // Update cursor position
  const updateCursor = useCallback((x, y, elementId = null) => {
    if (socket && isConnected && currentWorkspace) {
      socket.emit('workspace:cursor:update', { x, y, elementId });
    }
  }, [socket, isConnected, currentWorkspace]);

  // Start editing element
  const startEditingElement = useCallback((elementId) => {
    if (socket && isConnected && currentWorkspace) {
      socket.emit('workspace:element:editing:start', { elementId });
    }
  }, [socket, isConnected, currentWorkspace]);

  // Stop editing element
  const stopEditingElement = useCallback((elementId) => {
    if (socket && isConnected && currentWorkspace) {
      socket.emit('workspace:element:editing:stop', { elementId });
    }
  }, [socket, isConnected, currentWorkspace]);

  // Notify element created
  const notifyElementCreated = useCallback((element) => {
    if (socket && isConnected && currentWorkspace) {
      socket.emit('workspace:element:created', { element });
    }
  }, [socket, isConnected, currentWorkspace]);

  // Notify element updated
  const notifyElementUpdated = useCallback((element) => {
    if (socket && isConnected && currentWorkspace) {
      socket.emit('workspace:element:updated', { element });
    }
  }, [socket, isConnected, currentWorkspace]);

  // Notify element deleted
  const notifyElementDeleted = useCallback((elementId) => {
    if (socket && isConnected && currentWorkspace) {
      socket.emit('workspace:element:deleted', { elementId });
    }
  }, [socket, isConnected, currentWorkspace]);

  // Force reconnect (can be called manually if needed)
  const forceReconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔄 Force reconnecting socket...');
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  const value = {
    socket,
    isConnected,
    currentWorkspace,
    workspaceUsers,
    joinWorkspace,
    leaveWorkspace,
    updateCursor,
    startEditingElement,
    stopEditingElement,
    notifyElementCreated,
    notifyElementUpdated,
    notifyElementDeleted,
    forceReconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
