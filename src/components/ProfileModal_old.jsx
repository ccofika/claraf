import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { User, Mail, Palette, Shield, CheckCircle, AlertCircle, BarChart3, Calendar, Activity, BookOpen, ExternalLink, Keyboard, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { theme, changeTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slackConnected, setSlackConnected] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      // Set default username as email prefix
      const emailPrefix = user.email?.split('@')[0] || '';
      setUsername(user.name || emailPrefix);
      // Check Slack connection status
      checkSlackConnection();
      // Fetch user statistics
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/user/statistics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleResetTutorial = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/tutorial-reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Tutorial reset successfully! Reload the page to see it again.');
      // Update user state
      setUser({ ...user, tutorialCompleted: false });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset tutorial');
    } finally {
      setLoading(false);
    }
  };

  const checkSlackConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/slack/check-access`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSlackConnected(response.data.hasAccess);
    } catch (err) {
      console.error('Error checking Slack connection:', err);
      setSlackConnected(false);
    }
  };

  const handleConnectSlack = () => {
    // Redirect to Slack OAuth
    const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${backendURL}/api/auth/slack`;
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/profile`,
        { name: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div
        className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-[1600px] max-h-[70vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your account and preferences
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive flex-1">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-400 flex-1">{success}</p>
              </div>
            </div>
          )}

          {/* Content Grid */}
          <div className="space-y-4">
            {/* First Row: Account Statistics, Profile Information, Integrations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Account Statistics Card */}
              <Card>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Account Statistics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-pulse text-xs text-muted-foreground">Loading...</div>
                    </div>
                  ) : statistics ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-muted-foreground">Workspaces</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{statistics.workspaceCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-muted-foreground">Elements</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{statistics.elementCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-muted-foreground">Logins (30d)</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{statistics.loginCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs text-muted-foreground">Member Since</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {new Date(statistics.memberSince).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No statistics</p>
                  )}
                </CardContent>
              </Card>

              {/* Profile Information Card */}
              <Card>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Profile Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label htmlFor="username" className="text-xs font-medium text-card-foreground mb-1.5 block">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-9 px-2.5 py-2 text-sm border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="text-xs font-medium text-card-foreground mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full pl-9 px-2.5 py-2 text-sm border border-input bg-muted/50 rounded-lg cursor-not-allowed text-muted-foreground"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Email cannot be changed
                    </p>
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="w-full py-2 px-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </CardContent>
              </Card>

              {/* Integrations Card */}
              <Card>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                    </svg>
                  </div>
                  <CardTitle className="text-lg font-semibold">Integrations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Slack</p>
                        <p className="text-xs text-muted-foreground">
                          {slackConnected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {slackConnected ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Active
                        </div>
                      </Badge>
                    ) : (
                      <button
                        onClick={handleConnectSlack}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                  {slackConnected && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      You can send and receive messages through Slack integration in the KYC Management section.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics Card */}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Account Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-pulse text-muted-foreground">Loading statistics...</div>
                  </div>
                ) : statistics ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
                          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Workspaces</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{statistics.workspaceCount}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900/30">
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Elements Created</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{statistics.elementCount}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded bg-green-100 dark:bg-green-900/30">
                          <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Logins (30d)</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{statistics.loginCount}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900/30">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(statistics.memberSince).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {statistics.lastLogin && (
                      <div className="col-span-2 p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded bg-indigo-100 dark:bg-indigo-900/30">
                            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <p className="text-xs font-medium text-muted-foreground">Last Login</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(statistics.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No statistics available</p>
                )}
              </CardContent>
            </Card>

            {/* Tutorial & Help Card */}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Tutorial & Help</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Show Tutorial Again */}
                  <button
                    onClick={handleResetTutorial}
                    disabled={loading}
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:bg-muted/50 transition-all text-left disabled:opacity-50"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Show Tutorial Again</p>
                      <p className="text-xs text-muted-foreground">Restart the onboarding tutorial</p>
                    </div>
                  </button>

                  {/* Help Documentation */}
                  <a
                    href="#"
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:bg-muted/50 transition-all cursor-not-allowed opacity-60"
                  >
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Help Documentation</p>
                      <p className="text-xs text-muted-foreground">Learn how to use Clara</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>

                  {/* Video Tutorials */}
                  <a
                    href="#"
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:bg-muted/50 transition-all cursor-not-allowed opacity-60"
                  >
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Video Tutorials</p>
                      <p className="text-xs text-muted-foreground">Watch step-by-step guides</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>

                  {/* Keyboard Shortcuts */}
                  <a
                    href="#"
                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:bg-muted/50 transition-all cursor-not-allowed opacity-60"
                  >
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <Keyboard className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Keyboard Shortcuts</p>
                      <p className="text-xs text-muted-foreground">View all keyboard shortcuts</p>
                    </div>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">?</kbd>
                  </a>
                </div>

                {/* What's New Section */}
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">What's New</p>
                      <p className="text-xs text-muted-foreground mb-2">Check out the latest features and improvements</p>
                      <a
                        href="#"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-not-allowed opacity-60"
                      >
                        View Changelog
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection Card */}
            <Card className="lg:col-span-3">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <Palette className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Appearance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer hover:bg-muted/50 transition-all group">
                    <input
                      type="radio"
                      name="theme"
                      value="white"
                      checked={theme === 'white'}
                      onChange={(e) => changeTheme(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      theme === 'white' ? 'border-blue-600 bg-blue-600' : 'border-muted-foreground'
                    }`}>
                      {theme === 'white' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">Light Theme</span>
                        <div className="w-6 h-6 bg-white border border-border rounded"></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Clean and bright interface</p>
                    </div>
                  </label>

                  <label className="relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer hover:bg-muted/50 transition-all group">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => changeTheme(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      theme === 'dark' ? 'border-blue-600 bg-blue-600' : 'border-muted-foreground'
                    }`}>
                      {theme === 'dark' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">Dark Theme</span>
                        <div className="w-6 h-6 bg-black border border-border rounded"></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
