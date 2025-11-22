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
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

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
      console.log('🔌 Socket connected');
      setIsConnected(true);

      // Authenticate socket
      const token = localStorage.getItem('token');
      if (token) {
        newSocket.emit('authenticate', { token });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
      setWorkspaceUsers([]);
    });

    newSocket.on('authenticated', (data) => {
      console.log('🔐 Socket authenticated:', data);
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
        newSocket.disconnect();
      }
    };
  }, [user]);

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
