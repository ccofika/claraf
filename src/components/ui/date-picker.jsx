import React, { useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

// Ensure portal root exists
const PORTAL_ID = 'datepicker-portal';

export function DatePicker({ value, onChange, placeholder = "Select date", className, size = "default" }) {
  // Create portal container on mount
  useEffect(() => {
    if (!document.getElementById(PORTAL_ID)) {
      const portalDiv = document.createElement('div');
      portalDiv.id = PORTAL_ID;
      document.body.appendChild(portalDiv);
    }
  }, []);

  const handleChange = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  const selectedDate = value ? new Date(value) : null;

  const sizeClasses = {
    default: "h-10 px-3 py-2 text-sm",
    sm: "h-[30px] px-2 py-1 text-xs"
  };

  return (
    <div className="relative">
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="MMM d, yyyy"
        placeholderText={placeholder}
        className={cn(
          "flex w-full rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-300 focus:ring-offset-1",
          sizeClasses[size],
          className
        )}
        wrapperClassName="w-full"
        calendarClassName="custom-calendar"
        popperPlacement="bottom-start"
        portalId={PORTAL_ID}
      />
      <CalendarIcon className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none",
        size === "sm" ? "h-3 w-3" : "h-4 w-4"
      )} />
    </div>
  );
}
