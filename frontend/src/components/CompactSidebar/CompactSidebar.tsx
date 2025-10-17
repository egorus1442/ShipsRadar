/**
 * CompactSidebar Component (Stage 9 - StormGeo Style)
 * Compact left sidebar with collapsible sections
 * All content visible without scrolling
 */

import { useState } from 'react';
import type { RouteResponse } from '../../types';

interface CompactSidebarProps {
  route: RouteResponse | null;
  isCalculating: boolean;
  onCalculateRoute: (start: any, end: any, departureTime: Date) => void;
  onCreateNewRoute: () => void;
  routeInputRef: React.RefObject<any>;
  onStartLocationChange: (location: any) => void;
  onEndLocationChange: (location: any) => void;
  onMapClickMode: (mode: 'start' | 'end' | null) => void;
  showWeather: boolean;
  onToggleWeather: () => void;
  onOpenWeatherLayers: () => void;
}

export default function CompactSidebar({
  route,
  isCalculating,
  onCreateNewRoute,
  showWeather,
  onToggleWeather,
  onOpenWeatherLayers,
}: CompactSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<'route' | 'planning' | 'weather' | null>('planning');
  
  const toggleSection = (section: 'route' | 'planning' | 'weather') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="h-full bg-app-panel border-r border-app-border flex flex-col w-64">
      {/* Sidebar Header */}
      <div className="px-3 py-2 border-b border-app-border bg-app-bg/50">
        <h2 className="text-xs font-bold text-app-text uppercase tracking-wide">Навигация</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Routes Section */}
        <div className="border-b border-app-border">
          <button
            onClick={() => toggleSection('route')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-app-bg/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-xs font-medium text-app-text">Маршруты</span>
            </div>
            <svg
              className={`w-4 h-4 text-app-text-secondary transition-transform ${expandedSection === 'route' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'route' && (
            <div className="px-3 py-2 space-y-2 bg-app-bg/20">
              {route ? (
                <>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-app-text-secondary">Расстояние:</span>
                      <span className="text-app-text font-medium">{route.metrics.total_distance_nm.toFixed(0)} nm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-app-text-secondary">Длительность:</span>
                      <span className="text-app-text font-medium">
                        {Math.floor(route.metrics.estimated_duration_hours / 24)}д {Math.floor(route.metrics.estimated_duration_hours % 24)}ч
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-app-text-secondary">Точки:</span>
                      <span className="text-app-text font-medium">{route.waypoints.length}</span>
                    </div>
                  </div>
                  {/* View Details button - future feature */}
                  <button
                    onClick={onCreateNewRoute}
                    className="w-full px-2 py-1 text-xs bg-app-bg hover:bg-app-bg/70 text-app-text border border-app-border rounded transition-colors"
                  >
                    Новый маршрут
                  </button>
                </>
              ) : (
                <div className="text-xs text-app-text-secondary text-center py-2">
                  Нет активного маршрута
                </div>
              )}
            </div>
          )}
        </div>

        {/* Route Planning Section - Always visible but compact */}
        <div className="border-b border-app-border">
          <button
            onClick={() => toggleSection('planning')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-app-bg/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs font-medium text-app-text">Планировать</span>
            </div>
            <svg
              className={`w-4 h-4 text-app-text-secondary transition-transform ${expandedSection === 'planning' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'planning' && (
            <div className="px-3 py-2 space-y-2 bg-app-bg/20 text-xs">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openRoutePlanning'))}
                className="w-full px-3 py-2 bg-app-accent hover:bg-app-accent/80 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Открыть планировщик
              </button>
              {isCalculating && (
                <div className="flex items-center gap-2 text-app-accent justify-center py-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-app-accent"></div>
                  <span>Рассчитываем...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weather Section */}
        <div className="border-b border-app-border">
          <button
            onClick={() => toggleSection('weather')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-app-bg/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span className="text-xs font-medium text-app-text">Погода</span>
            </div>
            <svg
              className={`w-4 h-4 text-app-text-secondary transition-transform ${expandedSection === 'weather' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'weather' && (
            <div className="px-3 py-2 space-y-2 bg-app-bg/20">
              <button
                onClick={onToggleWeather}
                className={`w-full px-3 py-2 text-xs font-medium rounded transition-colors ${
                  showWeather
                    ? 'bg-app-accent text-white'
                    : 'bg-app-bg hover:bg-app-bg/70 text-app-text border border-app-border'
                }`}
              >
                {showWeather ? '🌥️ Скрыть погоду' : '🌥️ Показать погоду'}
              </button>
              
              <button
                onClick={onOpenWeatherLayers}
                className="w-full px-3 py-2 bg-app-bg hover:bg-app-bg/70 text-app-text border border-app-border rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Настроить слои
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

