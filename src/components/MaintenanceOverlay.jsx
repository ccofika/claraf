import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const POLL_INTERVAL = 20000;

export default function MaintenanceOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let interval;

    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/downtime`);
        if (res.ok) {
          const data = await res.json();
          setActive(data.active);
        }
      } catch {
        // Backend unreachable - don't show overlay
      }
    };

    check();
    interval = setInterval(check, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="sm:max-w-lg w-[90%] overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg">
        {/* Image/Icon Section - matches update modal image area */}
        <div className="relative w-full h-64 bg-amber-50 dark:bg-amber-950/30 overflow-hidden flex items-center justify-center">
          <div className="animate-modal-zoom flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Wrench className="w-10 h-10 text-amber-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400 tracking-wide uppercase">
                Maintenance in Progress
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Section - same structure as update modal */}
        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Under Maintenance
            </h2>
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-2">
              We sincerely apologize for the interruption. The application is currently
              undergoing scheduled maintenance — we are upgrading our database infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
            <span className="text-2xl">⏱</span>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Estimated downtime: <strong>10–15 minutes</strong>
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-neutral-500 italic text-center pt-1">
            We highly appreciate your patience and hope everything goes smoothly and as planned.
          </p>

          {/* Loading dots - amber to match update modal accent color */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
