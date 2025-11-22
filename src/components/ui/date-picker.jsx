import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker-custom.css';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function DatePicker({ value, onChange, placeholder = "Select date", className }) {
  const handleChange = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  const selectedDate = value ? new Date(value) : null;

  return (
    <div className="relative">
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="MMM d, yyyy"
        placeholderText={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-300 focus:ring-offset-1",
          className
        )}
        wrapperClassName="w-full"
        calendarClassName="custom-calendar"
        popperPlacement="bottom-start"
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
