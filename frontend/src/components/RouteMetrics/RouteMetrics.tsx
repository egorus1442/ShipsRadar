/**
 * RouteMetrics Component
 * Displays route metrics: distance, duration, ETA, etc.
 */

import type { RouteMetrics as RouteMetricsType } from '../../types';
import { formatDistance, formatDuration, formatSpeed } from '../../services/routeApi';

interface RouteMetricsProps {
  metrics: RouteMetricsType;
  className?: string;
}

// Format date for display
const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
};

export default function RouteMetrics({ metrics, className = '' }: RouteMetricsProps) {
  return (
    <div className={`bg-app-panel rounded-lg border border-app-border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-app-text">Route Metrics</h3>
        <div className="text-xs text-app-text-secondary">
          {metrics.waypoints_adjusted > 0 && (
            <span className="bg-orange-900/30 border border-orange-700 text-orange-400 px-2 py-1 rounded">
              {metrics.waypoints_adjusted} adjusted
            </span>
          )}
        </div>
      </div>

      {/* Primary metrics grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Distance */}
        <div className="bg-app-bg rounded-lg p-3">
          <div className="text-xs text-app-text-secondary mb-1">Total Distance</div>
          <div className="text-2xl font-bold text-app-text">
            {metrics.total_distance_nm.toFixed(0)}
            <span className="text-sm font-normal text-app-text-secondary ml-1">nm</span>
          </div>
          <div className="text-xs text-app-text-secondary mt-1">
            {metrics.total_distance_km.toFixed(0)} km
          </div>
        </div>

        {/* Duration */}
        <div className="bg-app-bg rounded-lg p-3">
          <div className="text-xs text-app-text-secondary mb-1">Duration</div>
          <div className="text-2xl font-bold text-app-text">
            {formatDuration(metrics.estimated_duration_hours)}
          </div>
          <div className="text-xs text-app-text-secondary mt-1">
            {metrics.estimated_duration_hours.toFixed(1)} hours
          </div>
        </div>
      </div>

      {/* Time information */}
      <div className="space-y-3 mb-4">
        {/* Departure */}
        <div className="flex items-start justify-between py-2 border-b border-app-border">
          <div>
            <div className="text-sm font-medium text-app-text">Departure</div>
            <div className="text-xs text-app-text-secondary mt-0.5">
              {formatDateTime(metrics.departure_time)}
            </div>
          </div>
          <div className="text-green-500 text-xs font-medium">START</div>
        </div>

        {/* Arrival */}
        <div className="flex items-start justify-between py-2 border-b border-app-border">
          <div>
            <div className="text-sm font-medium text-app-text">Estimated Arrival</div>
            <div className="text-xs text-app-text-secondary mt-0.5">
              {formatDateTime(metrics.arrival_time)}
            </div>
          </div>
          <div className="text-red-500 text-xs font-medium">END</div>
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Average Speed */}
        <div className="flex items-center gap-2">
          <div className="text-app-text-secondary">⚡ Speed:</div>
          <div className="font-medium text-app-text">
            {formatSpeed(metrics.average_speed_knots)}
          </div>
        </div>

        {/* Adjusted Waypoints */}
        <div className="flex items-center gap-2">
          <div className="text-app-text-secondary">🔄 Adjusted:</div>
          <div className="font-medium text-app-text">{metrics.waypoints_adjusted}</div>
        </div>

        {/* Max Wind Speed */}
        {metrics.max_wind_speed !== undefined && metrics.max_wind_speed !== null && (
          <div className="flex items-center gap-2">
            <div className="text-app-text-secondary">💨 Max Wind:</div>
            <div
              className={`font-medium ${
                metrics.max_wind_speed > 30
                  ? 'text-red-500'
                  : metrics.max_wind_speed > 20
                  ? 'text-yellow-500'
                  : 'text-app-text'
              }`}
            >
              {metrics.max_wind_speed.toFixed(1)} kts
            </div>
          </div>
        )}

        {/* Max Wave Height */}
        {metrics.max_wave_height !== undefined && metrics.max_wave_height !== null && (
          <div className="flex items-center gap-2">
            <div className="text-app-text-secondary">🌊 Max Waves:</div>
            <div
              className={`font-medium ${
                metrics.max_wave_height > 5
                  ? 'text-red-500'
                  : metrics.max_wave_height > 3
                  ? 'text-yellow-500'
                  : 'text-app-text'
              }`}
            >
              {metrics.max_wave_height.toFixed(1)} m
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

