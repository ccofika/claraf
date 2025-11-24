import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TextFormattingProvider } from './context/TextFormattingContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
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
import PageLayout from './components/PageLayout';
import VIPProgressCalculator from './pages/VIPProgressCalculator';
import HashExplorerFinder from './pages/HashExplorerFinder';
import QuickLinks from './pages/QuickLinks';
import AffiliateBonusFinder from './pages/AffiliateBonusFinder';
import KYC from './pages/KYC';
import DeveloperDashboard from './pages/DeveloperDashboard';
import QAManager from './pages/QAManager';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>
              <CommandPaletteProvider>
                <TextFormattingProvider>
                  <Router>
                    <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Navigate to="/login" />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/login/:username" element={<AutoLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />

                  {/* Protected routes with PageLayout wrapper */}
                  <Route
                    path="/vip-calculator"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="vip-calculator">
                          <VIPProgressCalculator />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/hash-explorer"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="hash-explorer">
                          <HashExplorerFinder />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/quick-links"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="quick-links">
                          <QuickLinks />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/affiliate-bonus-finder"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="affiliate-bonus-finder">
                          <AffiliateBonusFinder />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/kyc"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="kyc">
                          <KYC />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/developer-dashboard"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="developer-dashboard">
                          <DeveloperDashboard />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/qa-manager"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="qa-manager">
                          <QAManager />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/countries-restrictions"
                    element={
                      <PrivateRoute>
                        <PageLayout activeSection="countries-restrictions">
                          <CountriesRestrictions />
                        </PageLayout>
                      </PrivateRoute>
                    }
                  />

                  {/* Workspace route - ONLY for canvas */}
                  <Route
                    path="/workspace/:workspaceId"
                    element={
                      <PrivateRoute>
                        <Workspace />
                      </PrivateRoute>
                    }
                  />

                  {/* Chat routes */}
                  <Route
                    path="/chat"
                    element={
                      <PrivateRoute>
                        <Chat />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/chat/:channelId"
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
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
