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
import { WheelNavigationProvider } from './context/WheelNavigationContext';
import { WorkspaceNavigationProvider } from './context/WorkspaceNavigationContext';
import { TemplatesNavigationProvider } from './context/TemplatesNavigationContext';
import WheelNavigationWrapper from './components/WheelNavigationWrapper';
import WorkspaceNavigation from './components/WorkspaceNavigation';
import TemplatesNavigation from './components/TemplatesNavigation';
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
// Temporarily disabled - Google Sheets OAuth consent screen issue
// import AffiliateBonusFinder from './pages/AffiliateBonusFinder';
import KYC from './pages/KYC';
import DeveloperDashboard from './pages/DeveloperDashboard';
import {
  QAManagerLayout,
  QADashboard,
  QAAgents,
  QATickets,
  QAArchive,
  QAAnalyticsDashboard,
  QASummaries,
  QAImportTickets,
  QAAllAgents,
  StatisticsPage,
  QAActiveOverview,
  QABugsPage,
  QACoaching,
  QACoachingDetail,
  QAReview,
  QAReviewAnalytics
} from './pages/qa-manager';
import KYCAgentStats from './pages/KYCAgentStats';
import ActiveIssues from './pages/ActiveIssues';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>
              <WheelNavigationProvider>
                <WorkspaceNavigationProvider>
                  <TemplatesNavigationProvider>
                    <CommandPaletteProvider>
                      <TextFormattingProvider>
                        <Router>
                          <WheelNavigationWrapper />
                          <WorkspaceNavigation />
                          <TemplatesNavigation />
                        <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/login/:username" element={<AutoLogin />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/active-issues" element={<ActiveIssues />} />

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

                        {/* Temporarily disabled - Google Sheets OAuth consent screen issue
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
                        */}

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

                        {/* QA Manager routes with nested routing */}
                        <Route
                          path="/qa-manager"
                          element={
                            <PrivateRoute>
                              <PageLayout activeSection="qa-manager">
                                <QAManagerLayout />
                              </PageLayout>
                            </PrivateRoute>
                          }
                        >
                          {/* Default redirect to dashboard */}
                          <Route index element={<Navigate to="dashboard" replace />} />
                          <Route path="dashboard" element={<QADashboard />} />
                          <Route path="agents" element={<QAAgents />} />
                          <Route path="tickets" element={<QATickets />} />
                          <Route path="tickets/:ticketId" element={<QATickets />} />
                          <Route path="tickets/:ticketId/edit" element={<QATickets />} />
                          <Route path="archive" element={<QAArchive />} />
                          <Route path="archive/:ticketId" element={<QAArchive />} />
                          <Route path="archive/:ticketId/edit" element={<QAArchive />} />
                          <Route path="review" element={<QAReview />} />
                          <Route path="review/analytics" element={<QAReviewAnalytics />} />
                          <Route path="review/:ticketId" element={<QAReview />} />
                          <Route path="review/:ticketId/edit" element={<QAReview />} />
                          <Route path="analytics" element={<QAAnalyticsDashboard />} />
                          <Route path="summaries" element={<QASummaries />} />
                          <Route path="coaching" element={<QACoaching />} />
                          <Route path="coaching/:id" element={<QACoachingDetail />} />
                          <Route path="all-agents" element={<QAAllAgents />} />
                          <Route path="statistics" element={<StatisticsPage />} />
                          <Route path="import-tickets" element={<QAImportTickets />} />
                          <Route path="active-overview" element={<QAActiveOverview />} />
                          <Route path="bugs" element={<QABugsPage />} />
                        </Route>

                        <Route
                          path="/kyc-agent-stats"
                          element={
                            <PrivateRoute>
                              <PageLayout activeSection="kyc-agent-stats">
                                <KYCAgentStats />
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
                      <Toaster
                        position="top-center"
                        richColors
                        closeButton
                        theme="system"
                      />
                    </Router>
                      </TextFormattingProvider>
                    </CommandPaletteProvider>
                  </TemplatesNavigationProvider>
                </WorkspaceNavigationProvider>
              </WheelNavigationProvider>
            </ChatProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
