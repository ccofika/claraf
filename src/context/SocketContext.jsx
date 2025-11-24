import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const socketRef = useRef(null);

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
      return;
    }

    // Only create socket once when user first logs in
    if (socketRef.current) {
      console.log('🔌 Socket already exists, skipping creation');
      return;
    }

    console.log('🔌 Creating new socket connection for user:', user.email);

    // Create socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
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
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
    });

    newSocket.on('authenticated', (data) => {
      console.log('🔐 Socket authenticated:', data);

      // IMPORTANT: Re-initialize chat on every authentication (including reconnections)
      // This ensures user rejoins all chat channels after reconnection
      console.log('🔄 Emitting chat:init after authentication...');
      newSocket.emit('chat:init');
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Socket auth error:', error);
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

    return () => {
      if (newSocket) {
        console.log('🔌 Cleaning up socket (component unmount)');
        newSocket.disconnect();
      }
    };
  }, [user?._id]); // Only depend on user ID, not entire user object

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
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
