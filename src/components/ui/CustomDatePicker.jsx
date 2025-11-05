import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';

const CustomDatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  id,
  className = '',
  minDate = null,
  maxDate = null,
  showIcon = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? parseISO(value) : null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = parseISO(value);
      setSelectedDate(date);
      setCurrentMonth(date);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange('');
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-muted rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-muted rounded-md transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 px-4 py-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isDisabled =
          (minDate && day < minDate) ||
          (maxDate && day > maxDate);

        days.push(
          <button
            type="button"
            key={day}
            onClick={() => !isDisabled && handleDateSelect(cloneDay)}
            disabled={isDisabled}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-lg transition-all
              ${!isSameMonth(day, monthStart) ? 'text-muted-foreground/40' : 'text-foreground'}
              ${isSameDay(day, selectedDate) ? 'bg-blue-600 dark:bg-blue-500 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-600' : ''}
              ${isToday(day) && !isSameDay(day, selectedDate) ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800' : ''}
              ${!isSameDay(day, selectedDate) && !isToday(day) && isSameMonth(day, monthStart) ? 'hover:bg-muted' : ''}
              ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day} className="grid grid-cols-7 gap-1 px-4">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="py-2 space-y-1">{rows}</div>;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2"
        >
          {showIcon && <CalendarIcon className="w-4 h-4 text-blue-600" />}
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-background text-card-foreground hover:border-blue-400 flex items-center justify-between"
        >
          <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-card border border-input rounded-lg shadow-xl z-50 min-w-[320px] animate-in fade-in slide-in-from-top-2">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  handleDateSelect(today);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDatePicker;
