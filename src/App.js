import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TextFormattingProvider } from './context/TextFormattingContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspace from './pages/Workspace';
import AuthCallback from './pages/AuthCallback';
import AutoLogin from './pages/AutoLogin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CountriesRestrictions from './pages/CountriesRestrictions';
import PrivateRoute from './components/PrivateRoute';
import Chat from './pages/Chat';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
        <ChatProvider>
          <CommandPaletteProvider>
            <TextFormattingProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/login/:username" element={<AutoLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/countries-restrictions" element={<CountriesRestrictions />} />
                  <Route
                    path="/workspace/:workspaceId"
                    element={
                      <PrivateRoute>
                        <Workspace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <PrivateRoute>
                        <Chat />
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
          </CommandPaletteProvider>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
