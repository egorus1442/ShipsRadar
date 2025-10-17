/**
 * RoutesPanel Component (Stage 9)
 * Left panel displaying saved routes with route details
 * Styled similar to StormGeo with dark theme
 */

import { useState } from 'react';
import type { RouteResponse } from '../../types';

interface RoutesPanelProps {
  route: RouteResponse | null;
  isCalculating?: boolean;
  onCreateNewRoute?: () => void;
  onOptimizeRoute?: () => void;
  className?: string;
}

// Format date for display
const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
};

// Format coordinates for display
const formatCoordinate = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
};

export default function RoutesPanel({
  route,
  isCalculating = false,
  onCreateNewRoute,
  onOptimizeRoute,
  className = '',
}: RoutesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Extract route info
  const routeName = route
    ? `Route: ${formatCoordinate(
        route.waypoints[0]?.coordinates.lat || 0,
        route.waypoints[0]?.coordinates.lng || 0
      )} → ${formatCoordinate(
        route.waypoints[route.waypoints.length - 1]?.coordinates.lat || 0,
        route.waypoints[route.waypoints.length - 1]?.coordinates.lng || 0
      )}`
    : 'No active route';

  return (
    <div
      className={`bg-app-panel border border-app-border rounded-lg overflow-hidden transition-all duration-300 ${
        isCollapsed ? 'h-14' : ''
      } ${className}`}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-bg/50">
        <div className="flex items-center gap-2">
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h3 className="text-sm font-semibold text-app-text uppercase tracking-wide">
            Routes
          </h3>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-app-text-secondary hover:text-app-text transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Panel Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onCreateNewRoute}
              disabled={isCalculating}
              className="flex-1 px-4 py-2 bg-app-accent hover:bg-app-accent/80 disabled:bg-app-accent/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm">New Route</span>
            </button>
            <button
              onClick={onOptimizeRoute}
              disabled={!route || isCalculating}
              className="px-4 py-2 bg-app-bg hover:bg-app-bg/70 disabled:bg-app-bg/30 disabled:cursor-not-allowed text-app-text-secondary disabled:text-app-text-secondary/50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-app-border"
              title="Optimize route (coming soon)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-sm">Optimize</span>
            </button>
          </div>

          {/* Calculating State */}
          {isCalculating && (
            <div className="bg-app-accent/10 border border-app-accent/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-app-accent"></div>
                <div className="text-sm text-app-accent font-medium">Calculating route...</div>
              </div>
            </div>
          )}

          {/* Active Route */}
          {route && !isCalculating && (
            <div className="space-y-3">
              {/* Route Card */}
              <div className="bg-app-bg rounded-lg border border-app-border overflow-hidden">
                {/* Route Header */}
                <div className="px-3 py-2 bg-app-accent/10 border-b border-app-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium text-app-text uppercase tracking-wide">
                        Active Route
                      </span>
                    </div>
                    <span className="text-xs text-app-text-secondary">
                      {route.algorithm}
                    </span>
                  </div>
                </div>

                {/* Route Body */}
                <div className="p-3 space-y-3">
                  {/* Start Point */}
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-app-text-secondary uppercase tracking-wide mb-0.5">
                        Start Point
                      </div>
                      <div className="text-xs font-mono text-app-text truncate">
                        {formatCoordinate(
                          route.waypoints[0]?.coordinates.lat || 0,
                          route.waypoints[0]?.coordinates.lng || 0
                        )}
                      </div>
                    </div>
                  </div>

                  {/* End Point */}
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                      B
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-app-text-secondary uppercase tracking-wide mb-0.5">
                        End Point
                      </div>
                      <div className="text-xs font-mono text-app-text truncate">
                        {formatCoordinate(
                          route.waypoints[route.waypoints.length - 1]?.coordinates.lat || 0,
                          route.waypoints[route.waypoints.length - 1]?.coordinates.lng || 0
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ETD/ETA */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-app-border/50">
                    <div>
                      <div className="text-xs text-app-text-secondary uppercase tracking-wide mb-1">
                        ETD
                      </div>
                      <div className="text-xs font-medium text-green-400">
                        {formatDateTime(route.metrics.departure_time)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-app-text-secondary uppercase tracking-wide mb-1">
                        ETA
                      </div>
                      <div className="text-xs font-medium text-red-400">
                        {formatDateTime(route.metrics.arrival_time)}
                      </div>
                    </div>
                  </div>

                  {/* Distance */}
                  <div className="pt-2 border-t border-app-border/50">
                    <div className="text-xs text-app-text-secondary uppercase tracking-wide mb-1">
                      Distance
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-app-text">
                        {route.metrics.total_distance_nm.toFixed(0)}
                      </span>
                      <span className="text-xs text-app-text-secondary">nautical miles</span>
                    </div>
                    <div className="text-xs text-app-text-secondary mt-0.5">
                      {route.metrics.total_distance_km.toFixed(0)} km
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Details Section */}
              <div className="bg-app-bg rounded-lg border border-app-border p-3">
                <h4 className="text-xs font-semibold text-app-text uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Route Parameters
                </h4>

                <div className="space-y-2">
                  {/* Sailing Time */}
                  <div className="flex items-center justify-between py-2 border-b border-app-border/30">
                    <span className="text-xs text-app-text-secondary">Sailing Time</span>
                    <span className="text-sm font-medium text-app-text">
                      {Math.floor(route.metrics.estimated_duration_hours / 24)}d{' '}
                      {Math.floor(route.metrics.estimated_duration_hours % 24)}h
                    </span>
                  </div>

                  {/* Average Speed */}
                  <div className="flex items-center justify-between py-2 border-b border-app-border/30">
                    <span className="text-xs text-app-text-secondary">Average Speed</span>
                    <span className="text-sm font-medium text-app-text">
                      {route.metrics.average_speed_knots.toFixed(1)} kts
                    </span>
                  </div>

                  {/* Waypoints */}
                  <div className="flex items-center justify-between py-2 border-b border-app-border/30">
                    <span className="text-xs text-app-text-secondary">Waypoints</span>
                    <span className="text-sm font-medium text-app-text">
                      {route.waypoints.length}
                    </span>
                  </div>

                  {/* Adjusted Waypoints */}
                  <div className="flex items-center justify-between py-2 border-b border-app-border/30">
                    <span className="text-xs text-app-text-secondary">Adjusted for Weather</span>
                    <span
                      className={`text-sm font-medium ${
                        route.metrics.waypoints_adjusted > 0
                          ? 'text-orange-400'
                          : 'text-green-400'
                      }`}
                    >
                      {route.metrics.waypoints_adjusted}
                    </span>
                  </div>

                  {/* Consumption (Placeholder for MVP) */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-app-text-secondary">Fuel Consumption</span>
                    <span className="text-sm font-medium text-app-text-secondary italic">
                      N/A
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Mode Toggle (Placeholder for MVP) */}
              <div className="bg-app-bg/50 rounded-lg border border-app-border/50 p-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-app-text-secondary">Edit route on map</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isEditMode}
                      onChange={(e) => setIsEditMode(e.target.checked)}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-app-border rounded-full peer peer-checked:bg-app-accent peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                </label>
                <div className="text-xs text-app-text-secondary/70 mt-2 italic">
                  Coming in future version
                </div>
              </div>
            </div>
          )}

          {/* No Route State */}
          {!route && !isCalculating && (
            <div className="bg-app-bg/50 rounded-lg border border-app-border border-dashed p-6 text-center">
              <div className="text-app-text-secondary mb-2">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <div className="text-sm text-app-text-secondary mb-1">No active route</div>
              <div className="text-xs text-app-text-secondary/70">
                Calculate a route to see details here
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

