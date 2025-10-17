/**
 * WaypointsTable Component
 * Displays waypoints in a table format with detailed information
 */

import { useState } from 'react';
import type { Waypoint } from '../../types';
import { formatDistance, formatSpeed } from '../../services/routeApi';

interface WaypointsTableProps {
  waypoints: Waypoint[];
  selectedWaypointId?: number;
  onWaypointClick?: (waypointId: number) => void;
  className?: string;
}

type SortField = 'id' | 'distance' | 'eta' | 'wind' | 'waves';
type SortDirection = 'asc' | 'desc';

// Format ETA for table display
const formatETA = (eta: string): string => {
  const date = new Date(eta);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Format coordinates for table
const formatCoords = (lat: number, lng: number): string => {
  return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
};

export default function WaypointsTable({
  waypoints,
  selectedWaypointId,
  onWaypointClick,
  className = '',
}: WaypointsTableProps) {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort waypoints
  const sortedWaypoints = [...waypoints].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'id':
        comparison = a.id - b.id;
        break;
      case 'distance':
        comparison = a.cumulative_distance - b.cumulative_distance;
        break;
      case 'eta':
        comparison = new Date(a.eta).getTime() - new Date(b.eta).getTime();
        break;
      case 'wind':
        comparison = (a.weather?.wind_speed || 0) - (b.weather?.wind_speed || 0);
        break;
      case 'waves':
        comparison = (a.weather?.wave_height || 0) - (b.weather?.wave_height || 0);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Toggle row expansion
  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Handle row click
  const handleRowClick = (waypointId: number) => {
    if (onWaypointClick) {
      onWaypointClick(waypointId);
    }
  };

  return (
    <div className={`bg-app-panel ${className}`}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-app-border">
        <h3 className="text-sm font-semibold text-app-text">Waypoints</h3>
        <div className="text-xs text-app-text-secondary">
          {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} along the route
        </div>
      </div>

      {/* Table container with scroll */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-app-bg text-app-text-secondary text-xs">
            <tr>
              <th className="px-2 py-1.5 text-left w-8">#</th>
              <th
                className="px-2 py-1.5 text-left cursor-pointer hover:text-app-text transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  <span>Coordinates</span>
                  {sortField === 'id' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-2 py-1.5 text-left cursor-pointer hover:text-app-text transition-colors"
                onClick={() => handleSort('eta')}
              >
                <div className="flex items-center gap-1">
                  <span>ETA</span>
                  {sortField === 'eta' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-2 py-1.5 text-right cursor-pointer hover:text-app-text transition-colors"
                onClick={() => handleSort('distance')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Distance</span>
                  {sortField === 'distance' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-2 py-1.5 text-right cursor-pointer hover:text-app-text transition-colors"
                onClick={() => handleSort('wind')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Wind</span>
                  {sortField === 'wind' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-2 py-1.5 text-right cursor-pointer hover:text-app-text transition-colors"
                onClick={() => handleSort('waves')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Waves</span>
                  {sortField === 'waves' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-2 py-1.5 text-center w-12">Status</th>
              <th className="px-2 py-1.5 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {sortedWaypoints.map((waypoint) => (
              <WaypointRow
                key={waypoint.id}
                waypoint={waypoint}
                isSelected={selectedWaypointId === waypoint.id}
                isExpanded={expandedRows.has(waypoint.id)}
                onRowClick={handleRowClick}
                onToggleExpand={toggleRowExpansion}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Individual waypoint row component
function WaypointRow({
  waypoint,
  isSelected,
  isExpanded,
  onRowClick,
  onToggleExpand,
}: {
  waypoint: Waypoint;
  isSelected: boolean;
  isExpanded: boolean;
  onRowClick: (id: number) => void;
  onToggleExpand: (id: number) => void;
}) {
  const hasWarnings = waypoint.warnings && waypoint.warnings.length > 0;
  const rowBgColor = isSelected
    ? 'bg-blue-900/30'
    : hasWarnings
    ? 'bg-orange-900/10'
    : '';

  return (
    <>
      <tr
        className={`${rowBgColor} hover:bg-app-bg/50 cursor-pointer transition-colors`}
        onClick={() => onRowClick(waypoint.id)}
      >
        {/* Number */}
        <td className="px-2 py-1.5 text-app-text font-medium text-xs">
          {waypoint.id + 1}
        </td>

        {/* Coordinates */}
        <td className="px-2 py-1.5 font-mono text-xs text-app-text">
          {formatCoords(waypoint.coordinates.lat, waypoint.coordinates.lng)}
        </td>

        {/* ETA */}
        <td className="px-2 py-1.5 text-app-text text-xs">
          {formatETA(waypoint.eta)}
        </td>

        {/* Distance */}
        <td className="px-2 py-1.5 text-right text-app-text text-xs">
          <div>{formatDistance(waypoint.cumulative_distance)}</div>
          <div className="text-app-text-secondary text-[10px]">
            +{formatDistance(waypoint.distance_from_prev)}
          </div>
        </td>

        {/* Wind */}
        <td className="px-2 py-1.5 text-right text-app-text text-xs">
          {waypoint.weather?.wind_speed !== undefined ? (
            <span
              className={
                waypoint.weather.wind_speed > 30
                  ? 'text-red-500 font-medium'
                  : waypoint.weather.wind_speed > 20
                  ? 'text-yellow-500'
                  : ''
              }
            >
              {waypoint.weather.wind_speed.toFixed(1)} kts
            </span>
          ) : (
            <span className="text-app-text-secondary">-</span>
          )}
        </td>

        {/* Waves */}
        <td className="px-2 py-1.5 text-right text-app-text text-xs">
          {waypoint.weather?.wave_height !== undefined ? (
            <span
              className={
                waypoint.weather.wave_height > 5
                  ? 'text-red-500 font-medium'
                  : waypoint.weather.wave_height > 3
                  ? 'text-yellow-500'
                  : ''
              }
            >
              {waypoint.weather.wave_height.toFixed(1)} m
            </span>
          ) : (
            <span className="text-app-text-secondary">-</span>
          )}
        </td>

        {/* Status */}
        <td className="px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-0.5 text-xs">
            {waypoint.is_adjusted && (
              <span className="text-orange-500" title="Route adjusted">
                🔄
              </span>
            )}
            {hasWarnings && (
              <span className="text-red-500" title="Has warnings">
                ⚠️
              </span>
            )}
          </div>
        </td>

        {/* Expand button */}
        <td className="px-2 py-1.5 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(waypoint.id);
            }}
            className="text-app-text-secondary hover:text-app-text transition-colors text-xs"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </td>
      </tr>

      {/* Expanded details row */}
      {isExpanded && (
        <tr className={rowBgColor}>
          <td colSpan={8} className="px-4 py-3">
            <WaypointDetails waypoint={waypoint} />
          </td>
        </tr>
      )}
    </>
  );
}

// Expanded waypoint details
function WaypointDetails({ waypoint }: { waypoint: Waypoint }) {
  return (
    <div className="bg-app-bg rounded-lg p-4 space-y-3">
      {/* Weather details */}
      {waypoint.weather && (
        <div>
          <div className="text-xs font-medium text-app-text-secondary mb-2">
            Weather Details
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {waypoint.weather.wind_speed !== undefined && (
              <div>
                <span className="text-app-text-secondary">Wind Speed:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.wind_speed.toFixed(1)} kts
                </span>
              </div>
            )}
            {waypoint.weather.wind_direction !== undefined && (
              <div>
                <span className="text-app-text-secondary">Wind Direction:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.wind_direction.toFixed(0)}°
                </span>
              </div>
            )}
            {waypoint.weather.wave_height !== undefined && (
              <div>
                <span className="text-app-text-secondary">Wave Height:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.wave_height.toFixed(2)} m
                </span>
              </div>
            )}
            {waypoint.weather.wave_direction !== undefined && (
              <div>
                <span className="text-app-text-secondary">Wave Direction:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.wave_direction.toFixed(0)}°
                </span>
              </div>
            )}
            {waypoint.weather.current_speed !== undefined && (
              <div>
                <span className="text-app-text-secondary">Current:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.current_speed.toFixed(1)} kts
                </span>
              </div>
            )}
            {waypoint.weather.air_temperature !== undefined && (
              <div>
                <span className="text-app-text-secondary">Air Temp:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.air_temperature.toFixed(1)}°C
                </span>
              </div>
            )}
            {waypoint.weather.sea_temperature !== undefined && (
              <div>
                <span className="text-app-text-secondary">Sea Temp:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.sea_temperature.toFixed(1)}°C
                </span>
              </div>
            )}
            {waypoint.weather.pressure !== undefined && (
              <div>
                <span className="text-app-text-secondary">Pressure:</span>{' '}
                <span className="text-app-text font-medium">
                  {waypoint.weather.pressure.toFixed(0)} hPa
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {waypoint.warnings && waypoint.warnings.length > 0 && (
        <div>
          <div className="text-xs font-medium text-app-text-secondary mb-2">
            Warnings
          </div>
          <div className="space-y-1">
            {waypoint.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="text-xs bg-orange-900/20 border border-orange-700 text-orange-400 px-2 py-1 rounded"
              >
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adjustment info */}
      {waypoint.is_adjusted && (
        <div className="text-xs bg-blue-900/20 border border-blue-700 text-blue-400 px-2 py-1 rounded inline-block">
          ℹ️ This waypoint was adjusted to avoid extreme weather conditions
        </div>
      )}
    </div>
  );
}

