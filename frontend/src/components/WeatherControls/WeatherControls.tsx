/**
 * Weather Controls Component
 * Provides UI controls for toggling weather layers and adjusting their opacity
 */

import { useState } from 'react';

export interface LayerConfig {
  enabled: boolean;
  opacity: number;
}

export interface WeatherControlsConfig {
  wind: LayerConfig;
  waves: LayerConfig;
  currents: LayerConfig;
  precipitation?: LayerConfig;
  temperature?: LayerConfig;
}

export interface WeatherControlsProps {
  config: WeatherControlsConfig;
  onChange: (config: WeatherControlsConfig) => void;
  className?: string;
}

interface LayerInfo {
  key: keyof WeatherControlsConfig;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const LAYER_INFO: LayerInfo[] = [
  {
    key: 'wind',
    label: 'Wind',
    icon: '💨',
    color: 'blue',
    description: 'Wind speed and direction vectors',
  },
  {
    key: 'waves',
    label: 'Waves',
    icon: '🌊',
    color: 'cyan',
    description: 'Significant wave height',
  },
  {
    key: 'currents',
    label: 'Currents',
    icon: '🌀',
    color: 'purple',
    description: 'Ocean current vectors',
  },
  {
    key: 'precipitation',
    label: 'Precipitation',
    icon: '🌧️',
    color: 'indigo',
    description: 'Rainfall intensity (coming soon)',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    icon: '🌡️',
    color: 'orange',
    description: 'Sea surface temperature (coming soon)',
  },
];

export function WeatherControls({ config, onChange, className = '' }: WeatherControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Toggle a specific layer
  const toggleLayer = (key: keyof WeatherControlsConfig) => {
    const layerConfig = config[key];
    if (!layerConfig) return;

    onChange({
      ...config,
      [key]: {
        ...layerConfig,
        enabled: !layerConfig.enabled,
      },
    });
  };

  // Update opacity for a specific layer
  const updateOpacity = (key: keyof WeatherControlsConfig, opacity: number) => {
    const layerConfig = config[key];
    if (!layerConfig) return;

    onChange({
      ...config,
      [key]: {
        ...layerConfig,
        opacity,
      },
    });
  };

  // Show all layers
  const showAll = () => {
    const newConfig = { ...config };
    Object.keys(newConfig).forEach((key) => {
      const layerKey = key as keyof WeatherControlsConfig;
      if (newConfig[layerKey]) {
        newConfig[layerKey] = {
          ...newConfig[layerKey]!,
          enabled: true,
        };
      }
    });
    onChange(newConfig);
  };

  // Hide all layers
  const hideAll = () => {
    const newConfig = { ...config };
    Object.keys(newConfig).forEach((key) => {
      const layerKey = key as keyof WeatherControlsConfig;
      if (newConfig[layerKey]) {
        newConfig[layerKey] = {
          ...newConfig[layerKey]!,
          enabled: false,
        };
      }
    });
    onChange(newConfig);
  };

  // Count enabled layers
  const enabledCount = Object.values(config).filter((layer) => layer?.enabled).length;
  const totalCount = Object.values(config).filter((layer) => layer !== undefined).length;

  // Get color classes for layer
  const getColorClasses = (color: string, enabled: boolean) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      blue: {
        bg: enabled ? 'bg-blue-600' : 'bg-gray-700',
        border: enabled ? 'border-blue-500' : 'border-gray-600',
        text: enabled ? 'text-white' : 'text-gray-400',
        hover: 'hover:bg-blue-700',
      },
      cyan: {
        bg: enabled ? 'bg-cyan-600' : 'bg-gray-700',
        border: enabled ? 'border-cyan-500' : 'border-gray-600',
        text: enabled ? 'text-white' : 'text-gray-400',
        hover: 'hover:bg-cyan-700',
      },
      purple: {
        bg: enabled ? 'bg-purple-600' : 'bg-gray-700',
        border: enabled ? 'border-purple-500' : 'border-gray-600',
        text: enabled ? 'text-white' : 'text-gray-400',
        hover: 'hover:bg-purple-700',
      },
      indigo: {
        bg: enabled ? 'bg-indigo-600' : 'bg-gray-700',
        border: enabled ? 'border-indigo-500' : 'border-gray-600',
        text: enabled ? 'text-white' : 'text-gray-400',
        hover: 'hover:bg-indigo-700',
      },
      orange: {
        bg: enabled ? 'bg-orange-600' : 'bg-gray-700',
        border: enabled ? 'border-orange-500' : 'border-gray-600',
        text: enabled ? 'text-white' : 'text-gray-400',
        hover: 'hover:bg-orange-700',
      },
    };

    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className={`bg-app-panel rounded-lg border border-app-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-app-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-app-text hover:text-app-accent transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-app-text">Weather Layers</h3>
              <p className="text-xs text-app-text-secondary">
                {enabledCount} of {totalCount} layers active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={showAll}
              className="px-3 py-1 text-xs font-medium bg-app-accent/20 text-app-accent border border-app-accent rounded hover:bg-app-accent/30 transition-colors"
              title="Show all layers"
            >
              Show All
            </button>
            <button
              onClick={hideAll}
              className="px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600 rounded hover:bg-gray-600 transition-colors"
              title="Hide all layers"
            >
              Hide All
            </button>
          </div>
        </div>
      </div>

      {/* Layer Controls */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {LAYER_INFO.map((layerInfo) => {
            const layerConfig = config[layerInfo.key];
            if (!layerConfig) return null;

            const colors = getColorClasses(layerInfo.color, layerConfig.enabled);
            const isComingSoon = layerInfo.key === 'precipitation' || layerInfo.key === 'temperature';

            return (
              <div
                key={layerInfo.key}
                className={`p-3 rounded-lg border transition-all ${
                  layerConfig.enabled
                    ? 'bg-app-bg border-app-border'
                    : 'bg-app-panel border-transparent'
                } ${isComingSoon ? 'opacity-50' : ''}`}
              >
                {/* Layer Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => !isComingSoon && toggleLayer(layerInfo.key)}
                      disabled={isComingSoon}
                      className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-colors ${
                        colors.bg
                      } ${colors.border} ${colors.text} ${!isComingSoon && colors.hover} ${
                        isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      title={isComingSoon ? 'Coming soon' : `Toggle ${layerInfo.label}`}
                    >
                      <input
                        type="checkbox"
                        checked={layerConfig.enabled}
                        onChange={() => !isComingSoon && toggleLayer(layerInfo.key)}
                        disabled={isComingSoon}
                        className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-lg">{layerInfo.icon}</span>
                      <span>{layerInfo.label}</span>
                    </button>
                    <p className="text-xs text-app-text-secondary flex-1">
                      {layerInfo.description}
                    </p>
                  </div>
                </div>

                {/* Opacity Slider */}
                {layerConfig.enabled && !isComingSoon && (
                  <div className="mt-3 pt-3 border-t border-app-border">
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor={`opacity-${layerInfo.key}`}
                        className="text-xs text-app-text-secondary font-medium whitespace-nowrap"
                      >
                        Opacity:
                      </label>
                      <input
                        id={`opacity-${layerInfo.key}`}
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={layerConfig.opacity}
                        onChange={(e) => updateOpacity(layerInfo.key, parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${
                            colors.bg.includes('blue')
                              ? '#3b82f6'
                              : colors.bg.includes('cyan')
                              ? '#06b6d4'
                              : colors.bg.includes('purple')
                              ? '#9333ea'
                              : '#6b7280'
                          } 0%, ${
                            colors.bg.includes('blue')
                              ? '#3b82f6'
                              : colors.bg.includes('cyan')
                              ? '#06b6d4'
                              : colors.bg.includes('purple')
                              ? '#9333ea'
                              : '#6b7280'
                          } ${layerConfig.opacity * 100}%, #374151 ${
                            layerConfig.opacity * 100
                          }%, #374151 100%)`,
                        }}
                      />
                      <span className="text-xs text-app-text font-medium w-10 text-right">
                        {Math.round(layerConfig.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WeatherControls;

