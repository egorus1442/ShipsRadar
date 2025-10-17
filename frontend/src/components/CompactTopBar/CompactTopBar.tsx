/**
 * CompactTopBar Component  
 * Compact top bar with weather info and controls - StormGeo style
 */

import type { RouteResponse, WeatherPoint } from '../../types';

interface CompactTopBarProps {
  route: RouteResponse | null;
  weatherData: WeatherPoint | null;
  forecastTime: Date;
}

export default function CompactTopBar({
  route,
  weatherData,
  forecastTime,
}: CompactTopBarProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  return (
    <div className="bg-app-panel border-b border-app-border px-4 py-2 flex items-center justify-between">
      {/* Left: Route Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-app-text">🚢 ShipsRadar MVP</div>
        </div>
        
        {route && (
          <>
            <div className="h-4 w-px bg-app-border"></div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-app-text-secondary">Расстояние:</span>
                <span className="text-app-text font-medium">{route.metrics.total_distance_nm.toFixed(0)} nm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-app-text-secondary">Время:</span>
                <span className="text-app-text font-medium">
                  {Math.floor(route.metrics.estimated_duration_hours / 24)}д {Math.floor(route.metrics.estimated_duration_hours % 24)}ч
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-app-text-secondary">Точки:</span>
                <span className="text-app-text font-medium">{route.waypoints.length}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Weather Data & Time */}
      <div className="flex items-center gap-3">
        {/* Weather Data */}
        {weatherData && (
          <>
            <div className="flex items-center gap-3 text-xs">
              {weatherData.pressure && (
                <div className="flex items-center gap-1">
                  <span className="text-app-text-secondary">Давление:</span>
                  <span className="text-app-text font-medium">{weatherData.pressure.toFixed(0)} hPa</span>
                </div>
              )}
              {weatherData.wind_speed && (
                <div className="flex items-center gap-1">
                  <span className="text-app-text-secondary">Ветер:</span>
                  <span className="text-app-text font-medium">{weatherData.wind_speed.toFixed(1)} kts</span>
                </div>
              )}
              {weatherData.wave_height && (
                <div className="flex items-center gap-1">
                  <span className="text-app-text-secondary">Волны:</span>
                  <span className="text-app-text font-medium">{weatherData.wave_height.toFixed(2)} m</span>
                </div>
              )}
            </div>
            <div className="h-4 w-px bg-app-border"></div>
          </>
        )}

        {/* Forecast Time */}
        <div className="text-xs text-app-text-secondary">
          {formatTime(forecastTime)} UTC
        </div>
      </div>
    </div>
  );
}

