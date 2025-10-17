/**
 * RouteLayer Component
 * Displays route line and waypoints on the map using Leaflet
 */

import { useEffect } from 'react';
import { Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RouteResponse, Waypoint } from '../../types';
import { formatDistance, formatWindSpeed, formatWaveHeight } from '../../services/routeApi';

interface RouteLayerProps {
  route: RouteResponse | null;
  selectedWaypointId?: number;
  onWaypointClick?: (waypointId: number) => void;
}

// Create custom icon for waypoints
const createWaypointIcon = (
  waypointNumber: number,
  isAdjusted: boolean,
  isSelected: boolean
) => {
  const color = isAdjusted ? '#f59e0b' : '#3b82f6'; // Orange if adjusted, blue otherwise
  const selectedBorder = isSelected ? '#fff' : color;
  const size = isSelected ? 32 : 24;
  
  return L.divIcon({
    className: 'custom-waypoint-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" 
                  fill="${color}" 
                  stroke="${selectedBorder}" 
                  stroke-width="2.5"
                  opacity="0.9"/>
          <text x="16" y="16" 
                text-anchor="middle" 
                dominant-baseline="central"
                fill="#fff" 
                font-size="10" 
                font-weight="bold"
                font-family="Arial, sans-serif">
            ${waypointNumber}
          </text>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Format ETA for display
const formatETA = (eta: string): string => {
  const date = new Date(eta);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
};

// Waypoint popup content
const WaypointPopup = ({ waypoint }: { waypoint: Waypoint }) => {
  return (
    <div className="text-sm" style={{ minWidth: '240px' }}>
      {/* Header */}
      <div className="font-bold text-base mb-2 border-b pb-2">
        Waypoint #{waypoint.id + 1}
        {waypoint.is_adjusted && (
          <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
            Adjusted
          </span>
        )}
      </div>

      {/* Coordinates */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 font-medium">Coordinates</div>
        <div className="font-mono text-xs">
          {waypoint.coordinates.lat.toFixed(4)}°, {waypoint.coordinates.lng.toFixed(4)}°
        </div>
      </div>

      {/* ETA */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 font-medium">ETA</div>
        <div className="text-xs">{formatETA(waypoint.eta)}</div>
      </div>

      {/* Distance */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 font-medium">Distance</div>
        <div className="text-xs">
          From prev: {formatDistance(waypoint.distance_from_prev)}
          <br />
          Total: {formatDistance(waypoint.cumulative_distance)}
        </div>
      </div>

      {/* Weather */}
      {waypoint.weather && (
        <div className="mb-2 border-t pt-2">
          <div className="text-xs text-gray-500 font-medium mb-1">Weather Forecast</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {waypoint.weather.wind_speed !== undefined && (
              <div>
                <span className="text-gray-600">Wind:</span>{' '}
                <span className="font-medium">{waypoint.weather.wind_speed.toFixed(1)} kts</span>
              </div>
            )}
            {waypoint.weather.wind_direction !== undefined && (
              <div>
                <span className="text-gray-600">Dir:</span>{' '}
                <span className="font-medium">{waypoint.weather.wind_direction.toFixed(0)}°</span>
              </div>
            )}
            {waypoint.weather.wave_height !== undefined && (
              <div>
                <span className="text-gray-600">Waves:</span>{' '}
                <span className="font-medium">{formatWaveHeight(waypoint.weather.wave_height)}</span>
              </div>
            )}
            {waypoint.weather.wave_direction !== undefined && (
              <div>
                <span className="text-gray-600">Dir:</span>{' '}
                <span className="font-medium">{waypoint.weather.wave_direction.toFixed(0)}°</span>
              </div>
            )}
            {waypoint.weather.current_speed !== undefined && (
              <div>
                <span className="text-gray-600">Current:</span>{' '}
                <span className="font-medium">{waypoint.weather.current_speed.toFixed(1)} kts</span>
              </div>
            )}
            {waypoint.weather.air_temperature !== undefined && (
              <div>
                <span className="text-gray-600">Air Temp:</span>{' '}
                <span className="font-medium">{waypoint.weather.air_temperature.toFixed(1)}°C</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {waypoint.warnings && waypoint.warnings.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs text-gray-500 font-medium mb-1">⚠️ Warnings</div>
          <div className="space-y-1">
            {waypoint.warnings.map((warning, idx) => (
              <div key={idx} className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RouteLayer({
  route,
  selectedWaypointId,
  onWaypointClick,
}: RouteLayerProps) {
  const map = useMap();

  // Fit map bounds to route when route changes
  useEffect(() => {
    if (route && route.waypoints.length > 0) {
      const bounds = L.latLngBounds(
        route.waypoints.map((wp) => [wp.coordinates.lat, wp.coordinates.lng])
      );
      
      // Fit bounds with padding
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 8,
        animate: true,
        duration: 1.0,
      });
    }
  }, [route, map]);

  if (!route || route.waypoints.length === 0) {
    return null;
  }

  // Extract coordinates for polyline
  const routeCoordinates: [number, number][] = route.waypoints.map((wp) => [
    wp.coordinates.lat,
    wp.coordinates.lng,
  ]);

  // Line style based on route status
  const lineColor = route.metrics.waypoints_adjusted > 0 ? '#f59e0b' : '#3b82f6';
  const lineOpacity = 0.7;
  const lineWeight = 3;

  return (
    <>
      {/* Route line */}
      <Polyline
        positions={routeCoordinates}
        pathOptions={{
          color: lineColor,
          weight: lineWeight,
          opacity: lineOpacity,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Waypoint markers */}
      {route.waypoints.map((waypoint) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.coordinates.lat, waypoint.coordinates.lng]}
          icon={createWaypointIcon(
            waypoint.id + 1,
            waypoint.is_adjusted,
            selectedWaypointId === waypoint.id
          )}
          eventHandlers={{
            click: () => {
              if (onWaypointClick) {
                onWaypointClick(waypoint.id);
              }
            },
          }}
        >
          <Popup>
            <WaypointPopup waypoint={waypoint} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

