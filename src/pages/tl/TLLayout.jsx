import React, { useState, createContext, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, ChevronRight, Settings,
  LayoutDashboard, ArrowLeft, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TLContext = createContext();
export const useTL = () => useContext(TLContext);

const PERIODS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' }
];

const TLLayout = () => {
  const [period, setPeriod] = useState(30);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNavMenu, setShowNavMenu] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === 'filipkozomara@mebit.io' || user?.role === 'admin';

  const getActiveTab = () => {
    const path = location.pathname.replace('/tl', '').replace(/^\//, '');
    if (!path || path === '') return 'dashboard';
    if (path.startsWith('admin')) return 'admin';
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  const isDrillDown = location.pathname.includes('/tl/team/') || location.pathname.includes('/tl/agent/');

  const buildBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Dashboard', path: '/tl' }];

    if (parts.includes('team') && parts.length > 2) {
      const teamIdx = parts.indexOf('team');
      const teamName = decodeURIComponent(parts[teamIdx + 1]);
      crumbs.push({ label: teamName, path: `/tl/team/${encodeURIComponent(teamName)}` });
    }

    if (parts.includes('agent') && parts.length > 2) {
      const teamName = location.state?.teamName;
      if (teamName && !parts.includes('team')) {
        crumbs.push({ label: teamName, path: `/tl/team/${encodeURIComponent(teamName)}` });
      }
      const agentName = location.state?.agentName || 'Agent Detalji';
      crumbs.push({ label: agentName, path: null });
    }

    return crumbs;
  };

  const breadcrumbs = isDrillDown ? buildBreadcrumbs() : [];

  const handleTabChange = (tab) => {
    if (tab === 'dashboard') navigate('/tl');
    else navigate(`/tl/${tab}`);
  };

  const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ value: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <TLContext.Provider value={{ period, setPeriod }}>
      <div className="flex flex-col h-full bg-white dark:bg-[#0C0C10]">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#1E1E28]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowNavMenu(true)}
                className="md:hidden p-1.5 -ml-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#1E1E28]"
              >
                <Menu className="w-4.5 h-4.5 text-gray-500 dark:text-[#8B8D97]" />
              </button>
              <h1 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED]">
                Team Leaders
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeTab === tab.value
                      ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                      : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center">
              {activeTab !== 'admin' && (
                <>
                  <div className="hidden sm:flex items-center gap-0.5">
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                          period === p.value
                            ? 'bg-gray-900 dark:bg-[#E8E9ED] text-white dark:text-[#0C0C10]'
                            : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="sm:hidden px-2.5 py-1.5 text-sm border border-gray-200 dark:border-[#252530] rounded bg-white dark:bg-[#1A1A21] text-gray-700 dark:text-[#A0A2AC]"
                  >
                    {PERIODS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        {isDrillDown && (
          <div className="flex-shrink-0 border-b border-gray-100 dark:border-[#1E1E28] px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1E1E28]">
                <ArrowLeft className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
              </button>
              <div className="flex items-center gap-1.5 text-sm">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-[#3A3A45]" />}
                    {crumb.path && idx < breadcrumbs.length - 1 ? (
                      <button onClick={() => navigate(crumb.path)} className="text-gray-400 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC]">
                        {crumb.label}
                      </button>
                    ) : (
                      <span className={idx === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-[#E8E9ED] font-medium' : 'text-gray-400 dark:text-[#6B6D77]'}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showNavMenu && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-50 md:hidden" onClick={() => setShowNavMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="fixed top-2 left-2 right-2 z-50 md:hidden bg-white dark:bg-[#141419] rounded-lg shadow-lg border border-gray-200 dark:border-[#1E1E28]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#1E1E28]">
                  <span className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">Navigation</span>
                  <button onClick={() => setShowNavMenu(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1E1E28]">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => { handleTabChange(tab.value); setShowNavMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium ${
                        activeTab === tab.value
                          ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                          : 'text-gray-600 dark:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                {activeTab !== 'admin' && (
                  <div className="border-t border-gray-100 dark:border-[#1E1E28] p-3">
                    <p className="text-xs text-gray-400 dark:text-[#5B5D67] mb-2 px-1 font-medium uppercase tracking-wider">Period</p>
                    <div className="flex items-center gap-0.5">
                      {PERIODS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => { setPeriod(p.value); setShowNavMenu(false); }}
                          className={`flex-1 px-2 py-2 text-sm font-medium rounded ${
                            period === p.value
                              ? 'bg-gray-900 dark:bg-[#E8E9ED] text-white dark:text-[#0C0C10]'
                              : 'text-gray-500 dark:text-[#6B6D77] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </TLContext.Provider>
  );
};

export default TLLayout;
