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
    const tokenFromUrl = searchParams.get('token');

    // Check if authentication was successful
    if (success !== 'true') {
      console.error('❌ Authentication failed - no success param');
      navigate('/login?error=Authentication failed');
      return;
    }

    // Try cookie-based auth first, fall back to URL token for browsers that block third-party cookies (e.g., Brave)
    fetchUserProfile(tokenFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  const fetchUserProfile = async (tokenFromUrl) => {
    const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // First, try cookie-based authentication (works for most browsers)
    try {
      const response = await axios.get(`${backendURL}/api/auth/profile`, {
        withCredentials: true
      });

      // Cookie auth succeeded
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const { token, ...userData } = response.data;
        setUser(userData);
      } else {
        setUser(response.data);
      }

      if (response.data._id) {
        localStorage.setItem('userId', response.data._id);
      }

      await redirectToWorkspace(backendURL, response.data.token || tokenFromUrl);
      return;
    } catch (cookieError) {
      // Cookie auth failed (likely Brave or other privacy-focused browser)
      console.warn('Cookie auth failed, trying URL token fallback:', cookieError.message);

      // Fall back to URL token if available
      if (tokenFromUrl) {
        try {
          // Store token in localStorage first
          localStorage.setItem('token', tokenFromUrl);

          // Fetch profile using Authorization header
          const response = await axios.get(`${backendURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${tokenFromUrl}` }
          });

          const { token, ...userData } = response.data;
          setUser(userData);

          if (response.data._id) {
            localStorage.setItem('userId', response.data._id);
          }

          await redirectToWorkspace(backendURL, tokenFromUrl);
          return;
        } catch (tokenError) {
          console.error('❌ Token auth also failed:', tokenError);
          navigate('/login?error=Authentication failed');
          return;
        }
      }

      // No fallback available
      console.error('❌ Error fetching user profile:', cookieError);
      navigate('/login?error=Failed to fetch user profile');
    }
  };

  const redirectToWorkspace = async (backendURL, token) => {
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : { withCredentials: true };

      const workspacesResponse = await axios.get(`${backendURL}/api/workspaces`, config);
      const announcementsWorkspace = workspacesResponse.data.find(ws => ws.type === 'announcements');

      if (announcementsWorkspace) {
        navigate(`/workspace/${announcementsWorkspace._id}`);
      } else {
        console.error('❌ Announcements workspace not found');
        navigate('/login?error=Announcements workspace not found');
      }
    } catch (error) {
      console.error('❌ Error fetching workspaces:', error);
      navigate('/login?error=Failed to load workspaces');
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
