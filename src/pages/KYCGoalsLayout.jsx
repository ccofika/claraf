import React from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Users, Hash, TrendingUp, Activity
} from 'lucide-react';

const VIEW_TABS = [
  { key: 'agents', label: 'Agents', icon: Users },
  { key: 'channels', label: 'Channels', icon: Hash },
  { key: 'trends', label: 'Trends', icon: TrendingUp },
];

const KYCGoalsLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isActivityFeed = location.pathname.includes('/activity');
  const isAgentDetail = location.pathname.includes('/agent/');
  const isOverview = !isActivityFeed && !isAgentDetail;
  const currentView = searchParams.get('view') || 'agents';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0C0C10]">
      {/* Shared navbar */}
      <div className="flex-shrink-0 bg-white dark:bg-[#0C0C10] border-b border-gray-200 dark:border-[#1E1E28]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED]">KYC Goals</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-500/20">
              BETA
            </span>
          </div>

          <div className="flex items-center gap-1">
            {VIEW_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => navigate(`/kyc-goals?view=${key}`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  isOverview && currentView === key
                    ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                    : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}

            <div className="h-5 w-px bg-gray-200 dark:bg-[#252530] mx-1" />

            <button
              onClick={() => navigate('/kyc-goals/activity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                isActivityFeed
                  ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                  : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Feed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default KYCGoalsLayout;
