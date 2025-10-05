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
    const tokenParam = searchParams.get('token');
    const isFirstLoginParam = searchParams.get('isFirstLogin');
    const userIdParam = searchParams.get('userId');

    if (!tokenParam) {
      navigate('/login?error=Authentication failed');
      return;
    }

    setToken(tokenParam);
    setUserId(userIdParam);

    if (isFirstLoginParam === 'true') {
      // Show password setup dialog
      setShowPasswordSetup(true);
    } else {
      // User already has password, log them in
      localStorage.setItem('token', tokenParam);
      fetchUserProfile(tokenParam);
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
