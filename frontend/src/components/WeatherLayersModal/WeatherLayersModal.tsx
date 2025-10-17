/**
 * WeatherLayersModal Component
 * Modal for weather layers configuration
 */

import type { WeatherControlsConfig } from '../WeatherControls';

interface WeatherLayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WeatherControlsConfig;
  onChange: (config: WeatherControlsConfig) => void;
}

export default function WeatherLayersModal({
  isOpen,
  onClose,
  config,
  onChange,
}: WeatherLayersModalProps) {
  if (!isOpen) return null;

  const toggleLayer = (layer: keyof WeatherControlsConfig) => {
    onChange({
      ...config,
      [layer]: {
        ...config[layer],
        enabled: !config[layer].enabled,
      },
    });
  };

  const updateOpacity = (layer: keyof WeatherControlsConfig, opacity: number) => {
    onChange({
      ...config,
      [layer]: {
        ...config[layer],
        opacity: opacity / 100,
      },
    });
  };

  const showAll = () => {
    const newConfig = { ...config };
    Object.keys(newConfig).forEach((key) => {
      newConfig[key as keyof WeatherControlsConfig].enabled = true;
    });
    onChange(newConfig);
  };

  const hideAll = () => {
    const newConfig = { ...config };
    Object.keys(newConfig).forEach((key) => {
      newConfig[key as keyof WeatherControlsConfig].enabled = false;
    });
    onChange(newConfig);
  };

  const layers = [
    { key: 'wind' as const, icon: '💨', label: 'Ветер', desc: 'Скорость и направление ветра' },
    { key: 'waves' as const, icon: '🌊', label: 'Волны', desc: 'Высота значимых волн' },
    { key: 'currents' as const, icon: '🌀', label: 'Течения', desc: 'Океанические течения' },
    { key: 'precipitation' as const, icon: '🌧️', label: 'Осадки', desc: 'Скоро появится', disabled: true },
    { key: 'temperature' as const, icon: '🌡️', label: 'Температура', desc: 'Скоро появится', disabled: true },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 z-[9998]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#1a1f2e] border-2 border-[#2d3548] rounded-lg shadow-2xl w-full max-w-lg pointer-events-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b-2 border-[#2d3548] flex items-center justify-between bg-[#0f1419]">
            <h3 className="text-base font-bold text-white uppercase tracking-wide">🌤️ Погодные слои</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={showAll}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors shadow-lg"
              >
                ✓ Показать все
              </button>
              <button
                onClick={hideAll}
                className="flex-1 px-4 py-2.5 bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] text-sm font-bold rounded transition-colors"
              >
                ✕ Скрыть все
              </button>
            </div>

            {/* Layers List */}
            <div className="space-y-3">
              {layers.map((layer) => (
                <div
                  key={layer.key}
                  className={`bg-[#0f1419] rounded-lg border-2 border-[#2d3548] p-3 ${
                    layer.disabled ? 'opacity-50' : ''
                  } ${config[layer.key].enabled && !layer.disabled ? 'border-blue-500 shadow-lg shadow-blue-500/20' : ''}`}
                >
                  {/* Layer Toggle */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* Larger Checkbox */}
                    <button
                      onClick={() => !layer.disabled && toggleLayer(layer.key)}
                      disabled={layer.disabled}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        config[layer.key].enabled
                          ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30'
                          : 'border-[#3d4558] bg-[#0f1419] hover:border-blue-500'
                      } ${layer.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {config[layer.key].enabled && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Layer Info */}
                    <button
                      onClick={() => !layer.disabled && toggleLayer(layer.key)}
                      disabled={layer.disabled}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="text-2xl">{layer.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{layer.label}</div>
                        <div className="text-xs text-gray-400">{layer.desc}</div>
                      </div>
                    </button>
                  </div>

                  {/* Opacity Slider */}
                  {!layer.disabled && config[layer.key].enabled && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Прозрачность</span>
                        <span className="text-white font-medium">
                          {Math.round(config[layer.key].opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(config[layer.key].opacity * 100)}
                        onChange={(e) => updateOpacity(layer.key, Number(e.target.value))}
                        className="w-full h-2 bg-[#2d3548] rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t-2 border-[#2d3548] bg-[#0f1419]">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors shadow-lg"
            >
              ✓ Применить и закрыть
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--app-accent, #3b82f6);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--app-accent, #3b82f6);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
}

