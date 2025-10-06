import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TextFormattingProvider } from './context/TextFormattingContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import AuthCallback from './pages/AuthCallback';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TextFormattingProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/workspace/:workspaceId"
                element={
                  <PrivateRoute>
                    <Workspace />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
          <Toaster
            position="top-center"
            richColors
            closeButton
            theme="system"
          />
        </TextFormattingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
