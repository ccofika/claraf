import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import logoBlack from '../assets/images/LOGO-MAIN-BLACK.png';
import logoWhite from '../assets/images/LOGO-MAIN-WHITE.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam === 'auth_failed' ? 'Authentication failed. Only @mebit.io email addresses are allowed.' : errorParam);
    }
  }, [searchParams]);

  const redirectToAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const announcementsWorkspace = response.data.find(ws => ws.type === 'announcements');

      if (announcementsWorkspace) {
        navigate(`/workspace/${announcementsWorkspace._id}`);
      } else {
        setError('Announcements workspace not found');
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError('Failed to load workspace');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      await redirectToAnnouncements();
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    const backendURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${backendURL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center mb-8">
          <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Logo" className="h-20" />
        </div>
        <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg">
          <div className="mb-8">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-neutral-50">
              Sign in to your account
            </h2>
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-neutral-400">
              Only @mebit.io email addresses are allowed
            </p>
          </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-200 dark:border-neutral-800 rounded-md shadow-sm text-sm font-medium text-gray-900 dark:text-neutral-50 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-black text-gray-600 dark:text-neutral-400">Or continue with email</span>
          </div>
        </div>

        <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@mebit.io"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
          <Link to="/privacy-policy" className="hover:text-gray-700 dark:hover:text-neutral-300 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms-of-service" className="hover:text-gray-700 dark:hover:text-neutral-300 transition-colors">
            Terms of Service
          </Link>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
