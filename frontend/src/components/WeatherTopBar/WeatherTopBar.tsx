/**
 * Weather Top Bar Component
 * Displays current weather conditions and forecast date/time
 * Similar to StormGeo interface
 */

import { useMemo } from 'react';
import type { WeatherPoint } from '../../types';

export interface WeatherTopBarProps {
  weatherData?: WeatherPoint | null;
  timestamp: Date;
  showWeather: boolean;
  onToggleWeather: () => void;
  className?: string;
}

export function WeatherTopBar({
  weatherData,
  timestamp,
  showWeather,
  onToggleWeather,
  className = '',
}: WeatherTopBarProps) {
  // Format timestamp
  const formattedDate = useMemo(() => {
    return timestamp.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [timestamp]);

  const formattedTime = useMemo(() => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [timestamp]);

  // Format weather values
  const formatValue = (value: number | undefined, decimals: number = 1): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  // Get wind direction arrow
  const getWindDirectionArrow = (direction: number | undefined): string => {
    if (direction === undefined) return '—';
    // Convert meteorological direction (where wind comes from) to arrow pointing where wind goes
    const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    const index = Math.round(((direction + 180) % 360) / 45) % 8;
    return arrows[index];
  };

  // Get condition color class
  const getConditionColor = (type: 'wind' | 'waves' | 'pressure'): string => {
    if (!weatherData) return 'text-gray-500';

    switch (type) {
      case 'wind': {
        const speed = weatherData.wind_speed || 0;
        if (speed > 30) return 'text-red-400';
        if (speed > 20) return 'text-yellow-400';
        return 'text-green-400';
      }
      case 'waves': {
        const height = weatherData.wave_height || 0;
        if (height > 5) return 'text-red-400';
        if (height > 3) return 'text-yellow-400';
        return 'text-green-400';
      }
      case 'pressure': {
        const pressure = weatherData.pressure || 1013;
        if (pressure < 1000 || pressure > 1030) return 'text-yellow-400';
        return 'text-green-400';
      }
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className={`bg-app-panel border-b border-app-border px-6 py-3 ${className}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Weather Metrics */}
        <div className="flex items-center gap-6">
          {/* Toggle Weather Button */}
          <button
            onClick={onToggleWeather}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-all ${
              showWeather
                ? 'bg-app-accent/20 border-app-accent text-app-accent'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle weather display"
          >
            <span className="text-lg">{showWeather ? '☀️' : '🌥️'}</span>
            <span>Show Weather</span>
          </button>

          {/* Weather Metrics - Only show if weather is enabled */}
          {showWeather && (
            <>
              {/* Pressure */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-app-text-secondary font-medium">Pressure:</span>
                <span className={`text-sm font-semibold ${getConditionColor('pressure')}`}>
                  {formatValue(weatherData?.pressure, 0)} hPa
                </span>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-app-text-secondary font-medium">Wind:</span>
                <span className={`text-sm font-semibold ${getConditionColor('wind')}`}>
                  {formatValue(weatherData?.wind_speed)} kts
                  {weatherData?.wind_direction !== undefined && (
                    <span className="ml-1 text-base">
                      {getWindDirectionArrow(weatherData.wind_direction)}
                    </span>
                  )}
                </span>
              </div>

              {/* Significant Waves */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-app-text-secondary font-medium">Sig Waves:</span>
                <span className={`text-sm font-semibold ${getConditionColor('waves')}`}>
                  {formatValue(weatherData?.wave_height)} m
                </span>
              </div>

              {/* Swell */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-app-text-secondary font-medium">Swell:</span>
                <span className="text-sm font-semibold text-app-text">
                  {formatValue(weatherData?.swell_height)} m
                </span>
              </div>

              {/* Sea Temperature */}
              {weatherData?.sea_temperature !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-app-text-secondary font-medium">Sea Temp:</span>
                  <span className="text-sm font-semibold text-app-text">
                    {formatValue(weatherData.sea_temperature)}°C
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Forecast Date/Time */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-app-text-secondary font-medium">Forecast Time:</div>
            <div className="text-sm font-semibold text-app-text">
              {formattedDate} <span className="text-app-accent">{formattedTime} UTC</span>
            </div>
          </div>
          <div className="p-2 bg-app-bg rounded border border-app-border">
            <svg
              className="w-5 h-5 text-app-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* No data warning */}
      {showWeather && !weatherData && (
        <div className="mt-3 pt-3 border-t border-app-border">
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              No weather data available for this location. Calculate a route to see weather conditions.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherTopBar;

