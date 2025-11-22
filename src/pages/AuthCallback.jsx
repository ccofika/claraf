import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const success = searchParams.get('success');

    // Check if authentication was successful
    if (success !== 'true') {
      console.error('❌ Authentication failed - no success param');
      navigate('/login?error=Authentication failed');
      return;
    }

    // SECURITY: Token is in httpOnly cookie, fetch it by calling /profile
    // We don't pass tokens in URL to prevent exposure in browser history
    // Always fetch user profile and redirect
    fetchUserProfileWithCookie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  const fetchUserProfileWithCookie = async () => {
    try {
      const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(`${backendURL}/api/auth/profile`, {
        withCredentials: true // Use cookies for authentication
      });


      // SECURITY: Backend returns token for Google OAuth users so they can use it in localStorage
      // This allows compatibility with existing code that expects token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const { token, ...userData } = response.data;
        setUser(userData);
      } else {
        setUser(response.data);
      }

      // Store userId for Socket.io authentication
      if (response.data._id) {
        localStorage.setItem('userId', response.data._id);
      }

      // Redirect to announcements workspace
      const workspacesResponse = await axios.get(
        `${backendURL}/api/workspaces`,
        { withCredentials: true }
      );

      const announcementsWorkspace = workspacesResponse.data.find(ws => ws.type === 'announcements');

      if (announcementsWorkspace) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-foreground">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
