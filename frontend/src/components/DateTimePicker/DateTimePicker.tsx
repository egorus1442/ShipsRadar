/**
 * DateTimePicker Component
 * Allows selecting departure date and time
 */

import { useState, useEffect } from 'react';

interface DateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  className = '',
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // Initialize from value prop
  useEffect(() => {
    const date = new Date(value);
    
    // Format date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setDateValue(`${year}-${month}-${day}`);
    
    // Format time as HH:MM
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setTimeValue(`${hours}:${minutes}`);
  }, [value]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    
    if (newDate && timeValue) {
      const combined = new Date(`${newDate}T${timeValue}`);
      if (!isNaN(combined.getTime())) {
        onChange(combined);
      }
    }
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (dateValue && newTime) {
      const combined = new Date(`${dateValue}T${newTime}`);
      if (!isNaN(combined.getTime())) {
        onChange(combined);
      }
    }
  };

  // Quick select buttons
  const setNow = () => {
    onChange(new Date());
  };

  const addHours = (hours: number) => {
    const newDate = new Date(value);
    newDate.setHours(newDate.getHours() + hours);
    onChange(newDate);
  };

  const addDays = (days: number) => {
    const newDate = new Date(value);
    newDate.setDate(newDate.getDate() + days);
    onChange(newDate);
  };

  // Format min/max dates
  const minDateStr = minDate
    ? minDate.toISOString().split('T')[0]
    : undefined;
  const maxDateStr = maxDate
    ? maxDate.toISOString().split('T')[0]
    : undefined;

  // Format display
  const formatDisplay = (date: Date): string => {
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-app-text mb-2">
        {label}
      </label>

      {/* Current selection display */}
      <div className="mb-2 px-3 py-2 bg-app-bg border border-app-border rounded text-sm text-app-text">
        {formatDisplay(value)}
      </div>

      {/* Date and Time inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Date input */}
        <div>
          <label className="block text-xs text-app-text-secondary mb-1">
            Date
          </label>
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            min={minDateStr}
            max={maxDateStr}
            disabled={disabled}
            className="
              w-full px-3 py-2
              bg-app-bg border border-app-border rounded
              text-app-text
              focus:outline-none focus:ring-2 focus:ring-app-accent
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>

        {/* Time input */}
        <div>
          <label className="block text-xs text-app-text-secondary mb-1">
            Time (UTC)
          </label>
          <input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className="
              w-full px-3 py-2
              bg-app-bg border border-app-border rounded
              text-app-text
              focus:outline-none focus:ring-2 focus:ring-app-accent
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="space-y-2">
        <div className="text-xs text-app-text-secondary mb-1">Quick select:</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={setNow}
            disabled={disabled}
            type="button"
            className="
              px-3 py-1.5 text-xs
              bg-app-bg border border-app-border rounded
              hover:bg-app-accent/10 hover:border-app-accent
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Now
          </button>
          <button
            onClick={() => addHours(6)}
            disabled={disabled}
            type="button"
            className="
              px-3 py-1.5 text-xs
              bg-app-bg border border-app-border rounded
              hover:bg-app-accent/10 hover:border-app-accent
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            +6h
          </button>
          <button
            onClick={() => addHours(12)}
            disabled={disabled}
            type="button"
            className="
              px-3 py-1.5 text-xs
              bg-app-bg border border-app-border rounded
              hover:bg-app-accent/10 hover:border-app-accent
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            +12h
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => addDays(1)}
            disabled={disabled}
            type="button"
            className="
              px-3 py-1.5 text-xs
              bg-app-bg border border-app-border rounded
              hover:bg-app-accent/10 hover:border-app-accent
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            +1 day
          </button>
          <button
            onClick={() => addDays(3)}
            disabled={disabled}
            type="button"
            className="
              px-3 py-1.5 text-xs
              bg-app-bg border border-app-border rounded
              hover:bg-app-accent/10 hover:border-app-accent
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            +3 days
          </button>
          <button
            onClick={() => addDays(7)}
            disabled={disabled}
            type="button"
            className="
              px-3 py-1.5 text-xs
              bg-app-bg border border-app-border rounded
              hover:bg-app-accent/10 hover:border-app-accent
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            +7 days
          </button>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-app-text-secondary">
        All times in UTC (Coordinated Universal Time)
      </div>
    </div>
  );
}

