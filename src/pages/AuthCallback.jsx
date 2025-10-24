import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PasswordSetupDialog from '../components/PasswordSetupDialog';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const isFirstLoginParam = searchParams.get('isFirstLogin');
    const userIdParam = searchParams.get('userId');

    console.log('🔄 AuthCallback params:', { success, isFirstLoginParam, userIdParam });

    // Check if authentication was successful
    if (success !== 'true') {
      console.error('❌ Authentication failed - no success param');
      navigate('/login?error=Authentication failed');
      return;
    }

    // SECURITY: Token is in httpOnly cookie, fetch it by calling /profile
    // We don't pass tokens in URL to prevent exposure in browser history
    setUserId(userIdParam);

    if (isFirstLoginParam === 'true') {
      console.log('🆕 First login - showing password setup');
      // Show password setup dialog
      setShowPasswordSetup(true);
    } else {
      console.log('✅ Existing user - fetching profile with cookie auth');
      // User already has password, fetch profile using cookie auth
      fetchUserProfileWithCookie();
    }
  }, [searchParams, navigate]);

  const redirectToAnnouncements = async (authToken) => {
    try {
      const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(
        `${backendURL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const announcementsWorkspace = response.data.find(ws => ws.type === 'announcements');

      if (announcementsWorkspace) {
        navigate(`/workspace/${announcementsWorkspace._id}`);
      } else {
        navigate('/login?error=Announcements workspace not found');
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      navigate('/login?error=Failed to load workspace');
    }
  };

  const fetchUserProfileWithCookie = async () => {
    try {
      const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('📡 Fetching user profile with cookie auth...');

      const response = await axios.get(`${backendURL}/api/auth/profile`, {
        withCredentials: true // Use cookies for authentication
      });

      console.log('✅ User profile fetched:', response.data);

      // SECURITY: Backend returns token for Google OAuth users so they can use it in localStorage
      // This allows compatibility with existing code that expects token in localStorage
      if (response.data.token) {
        console.log('🔑 Storing token in localStorage for future requests');
        localStorage.setItem('token', response.data.token);
        const { token, ...userData } = response.data;
        setUser(userData);
      } else {
        setUser(response.data);
      }

      // Store userId for Socket.io authentication
      if (response.data._id) {
        console.log('💾 Storing userId in localStorage:', response.data._id);
        localStorage.setItem('userId', response.data._id);
      }

      // Redirect to announcements workspace
      const workspacesResponse = await axios.get(
        `${backendURL}/api/workspaces`,
        { withCredentials: true }
      );

      const announcementsWorkspace = workspacesResponse.data.find(ws => ws.type === 'announcements');

      if (announcementsWorkspace) {
        console.log('🏠 Redirecting to announcements workspace');
        navigate(`/workspace/${announcementsWorkspace._id}`);
      } else {
        console.error('❌ Announcements workspace not found');
        navigate('/login?error=Announcements workspace not found');
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      navigate('/login?error=Failed to fetch user profile');
    }
  };
  const fetchUserProfile = async (authToken) => {
    try {
      const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendURL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      setUser(userData);
      await redirectToAnnouncements(authToken);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      navigate('/login?error=Failed to fetch user profile');
    }
  };

  const handlePasswordSetupComplete = async (data) => {
    // Store token and user data
    localStorage.setItem('token', data.token);

    // Store userId for Socket.io authentication
    if (data._id) {
      localStorage.setItem('userId', data._id);
    }

    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
    });
    await redirectToAnnouncements(data.token);
  };

  const handlePasswordSetupError = (error) => {
    console.error('Password setup error:', error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-foreground">Processing authentication...</p>
      </div>

      {showPasswordSetup && (
        <PasswordSetupDialog
          isOpen={showPasswordSetup}
          userId={userId}
          onComplete={handlePasswordSetupComplete}
          onError={handlePasswordSetupError}
        />
      )}
    </div>
  );
};

export default AuthCallback;
