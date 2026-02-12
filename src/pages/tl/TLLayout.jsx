import React, { useState, createContext, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TLContext = createContext();
export const useTL = () => useContext(TLContext);

const PERIODS = [
  { value: 7, label: '7 Dana' },
  { value: 14, label: '14 Dana' },
  { value: 30, label: '30 Dana' },
  { value: 90, label: '90 Dana' }
];

const TLLayout = () => {
  const [period, setPeriod] = useState(30);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.email?.toLowerCase() === 'filipkozomara@mebit.io' || user?.role === 'admin';
  const isOnAdmin = location.pathname === '/tl/admin';

  // Build breadcrumbs from path
  const buildBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'TLs', path: '/tl' }];

    if (parts.includes('team') && parts.length > 2) {
      const teamIdx = parts.indexOf('team');
      const teamName = decodeURIComponent(parts[teamIdx + 1]);
      crumbs.push({ label: teamName, path: `/tl/team/${encodeURIComponent(teamName)}` });
    }

    if (parts.includes('agent') && parts.length > 2) {
      crumbs.push({ label: 'Agent', path: null });
    }

    if (parts.includes('admin')) {
      crumbs.push({ label: 'Admin', path: null });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <TLContext.Provider value={{ period, setPeriod }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-neutral-400 mb-1">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                  {crumb.path && idx < breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => navigate(crumb.path)}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className={idx === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
              Team Leaders
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            {!isOnAdmin && (
              <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      period === p.value
                        ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Admin Button */}
            {isAdmin && (
              <button
                onClick={() => navigate(isOnAdmin ? '/tl' : '/tl/admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isOnAdmin
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </TLContext.Provider>
  );
};

export default TLLayout;
