import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoBlack from '../assets/images/LOGO-MAIN-BLACK.png';
import logoWhite from '../assets/images/LOGO-MAIN-WHITE.png';

// Developer credentials mapping
const DEVELOPER_CREDENTIALS = {
  andrija: {
    email: 'andrijatrosic@mebit.io',
    password: 'Mebit2025!Dev'
  }
  // Možeš dodati još developera ovde ako treba
  // milos: {
  //   email: 'milos@mebit.io',
  //   password: 'password123'
  // }
};

const AutoLogin = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const performAutoLogin = async () => {
      // Proveri da li je korisnik već ulogovan
      if (isAuthenticated) {
        navigate('/workspace');
        return;
      }

      // Proveri da li postoje kredencijali za ovaj username
      const credentials = DEVELOPER_CREDENTIALS[username?.toLowerCase()];

      if (!credentials) {
        setStatus('error');
        setError(`Developer account "${username}" not found. Available: ${Object.keys(DEVELOPER_CREDENTIALS).join(', ')}`);
        return;
      }

      setStatus('logging_in');

      try {
        const result = await login(credentials.email, credentials.password);

        if (result.success) {
          setStatus('success');
          // Redirect nakon uspešnog logovanja
          setTimeout(() => {
            navigate('/workspace');
          }, 1000);
        } else {
          setStatus('error');
          setError(result.error || 'Login failed');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'An error occurred during login');
      }
    };

    performAutoLogin();
  }, [username, login, isAuthenticated, navigate]);

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
                Auto Login
              </h2>
              <p className="mt-4 text-center text-sm text-gray-600 dark:text-neutral-400">
                Developer: {username}
              </p>
            </div>

            {status === 'loading' && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-neutral-50"></div>
                <p className="mt-4 text-gray-600 dark:text-neutral-400">Initializing...</p>
              </div>
            )}

            {status === 'logging_in' && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-neutral-50"></div>
                <p className="mt-4 text-gray-600 dark:text-neutral-400">Logging in...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded text-center">
                <p className="font-medium">Login successful!</p>
                <p className="text-sm mt-1">Redirecting to workspace...</p>
              </div>
            )}

            {status === 'error' && (
              <div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-4">
                  <p className="font-medium">Login failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 px-4 border border-gray-200 dark:border-neutral-800 rounded-md shadow-sm text-sm font-medium text-gray-900 dark:text-neutral-50 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLogin;