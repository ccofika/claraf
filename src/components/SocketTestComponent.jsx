import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SocketTestComponent = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('Not connected');
  const [messages, setMessages] = useState([]);
  const [authResult, setAuthResult] = useState(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const addMessage = (type, message) => {
    setMessages(prev => [...prev, { type, message, time: new Date().toLocaleTimeString() }]);
  };

  const connectSocket = () => {
    const newSocket = io('http://localhost:5000');

    newSocket.on('connect', () => {
      setStatus('Connected');
      addMessage('success', '🔌 Connected to Socket.IO server');
    });

    newSocket.on('disconnect', () => {
      setStatus('Disconnected');
      addMessage('error', '🔌 Disconnected from server');
    });

    newSocket.on('authenticated', (data) => {
      setAuthResult({ success: true, data });
      addMessage('success', `✅ Authenticated: ${JSON.stringify(data, null, 2)}`);
    });

    newSocket.on('auth_error', (error) => {
      setAuthResult({ success: false, error });
      addMessage('error', `❌ Auth Error: ${JSON.stringify(error, null, 2)}`);
    });

    setSocket(newSocket);
    addMessage('info', '📡 Attempting connection...');
  };

  const authenticateSocket = () => {
    if (!socket) {
      addMessage('error', '❌ Socket not connected! Click "Connect Socket" first.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addMessage('error', '❌ No token found in localStorage! Please login first.');
      return;
    }

    addMessage('info', '🔐 Sending authentication request...');
    socket.emit('authenticate', { token });
  };

  const authenticateWithFakeToken = () => {
    if (!socket) {
      addMessage('error', '❌ Socket not connected! Click "Connect Socket" first.');
      return;
    }

    addMessage('info', '🔐 Testing with FAKE token (should fail)...');
    socket.emit('authenticate', { token: 'fake_invalid_token_12345' });
  };

  const authenticateWithNoToken = () => {
    if (!socket) {
      addMessage('error', '❌ Socket not connected! Click "Connect Socket" first.');
      return;
    }

    addMessage('info', '🔐 Testing without token (should fail)...');
    socket.emit('authenticate', {});
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setStatus('Not connected');
      addMessage('info', '🔌 Manually disconnected');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setAuthResult(null);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-2">🔐 Socket.IO Authentication Test</h1>
          <p className="text-muted-foreground mb-6">Test the Socket.IO authentication fix</p>

          {/* Status */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'Connected' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                status === 'Disconnected' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              }`}>
                {status}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={connectSocket}
              disabled={status === 'Connected'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Connect Socket
            </button>
            <button
              onClick={disconnectSocket}
              disabled={status !== 'Connected'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Disconnect Socket
            </button>
          </div>

          {/* Test Buttons */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <h3 className="text-foreground font-semibold mb-3">🧪 Authentication Tests:</h3>
            <div className="space-y-2">
              <button
                onClick={authenticateSocket}
                disabled={status !== 'Connected'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-left"
              >
                ✅ Test 1: Authenticate with Valid Token (should succeed)
              </button>
              <button
                onClick={authenticateWithFakeToken}
                disabled={status !== 'Connected'}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-left"
              >
                ❌ Test 2: Authenticate with Fake Token (should fail)
              </button>
              <button
                onClick={authenticateWithNoToken}
                disabled={status !== 'Connected'}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-left"
              >
                ❌ Test 3: Authenticate without Token (should fail)
              </button>
            </div>
          </div>

          {/* Auth Result */}
          {authResult && (
            <div className={`rounded-lg p-4 mb-6 ${
              authResult.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                authResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {authResult.success ? '✅ Authentication Success' : '❌ Authentication Failed'}
              </h3>
              <pre className="bg-black/20 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(authResult.success ? authResult.data : authResult.error, null, 2)}
              </pre>
            </div>
          )}

          {/* Messages Log */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground font-semibold">📋 Messages Log:</h3>
              <button
                onClick={clearMessages}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">No messages yet. Click "Connect Socket" to start.</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`p-2 rounded text-sm ${
                    msg.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    msg.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    <span className="text-xs opacity-70">[{msg.time}]</span> {msg.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <h3 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">📖 Instructions:</h3>
            <ol className="text-sm text-foreground space-y-1 list-decimal list-inside">
              <li>Make sure backend is running (npm start in clarab folder)</li>
              <li>Login to the app first to get a valid token</li>
              <li>Click "Connect Socket" to establish connection</li>
              <li>Click "Test 1" to test valid authentication (should succeed)</li>
              <li>Click "Test 2" to test fake token (should fail and disconnect)</li>
              <li>Reconnect and click "Test 3" to test missing token (should fail)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocketTestComponent;
