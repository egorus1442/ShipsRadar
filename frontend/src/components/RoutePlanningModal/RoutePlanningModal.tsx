/**
 * RoutePlanningModal Component
 * Modal dialog for route planning - compact and focused
 */

import { useState, useEffect } from 'react';
import { LocationInput } from '../LocationInput';
import type { LocationInputState } from '../../types';

interface RoutePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: (start: LocationInputState, end: LocationInputState, departureTime: Date) => void;
  onMapClickMode?: (mode: 'start' | 'end' | null) => void;
}

export default function RoutePlanningModal({
  isOpen,
  onClose,
  onCalculate,
  onMapClickMode,
}: RoutePlanningModalProps) {
  const [startLocation, setStartLocation] = useState<LocationInputState>({
    value: '',
    coordinates: null,
    selectedFeature: null,
    isValid: false,
  });

  const [endLocation, setEndLocation] = useState<LocationInputState>({
    value: '',
    coordinates: null,
    selectedFeature: null,
    isValid: false,
  });

  const [departureTime, setDepartureTime] = useState<Date>(new Date());
  const [mapClickMode, setMapClickMode] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMapClickMode(null);
      if (onMapClickMode) {
        onMapClickMode(null);
      }
    }
  }, [isOpen, onMapClickMode]);

  // Listen for map coordinates selection
  useEffect(() => {
    const handleMapCoordinatesSelected = (event: any) => {
      const { type, coordinates } = event.detail;
      if (type === 'start') {
        setStartLocation({
          value: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
          coordinates,
          selectedFeature: null,
          isValid: true,
        });
        setMapClickMode(null);
        if (onMapClickMode) onMapClickMode(null);
      } else if (type === 'end') {
        setEndLocation({
          value: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
          coordinates,
          selectedFeature: null,
          isValid: true,
        });
        setMapClickMode(null);
        if (onMapClickMode) onMapClickMode(null);
      }
    };

    window.addEventListener('mapCoordinatesSelected', handleMapCoordinatesSelected);
    return () => window.removeEventListener('mapCoordinatesSelected', handleMapCoordinatesSelected);
  }, [onMapClickMode]);

  const handleSetOnMap = (type: 'start' | 'end') => {
    const newMode = mapClickMode === type ? null : type;
    setMapClickMode(newMode);
    if (onMapClickMode) {
      onMapClickMode(newMode);
    }
  };

  const handleCalculate = () => {
    if (startLocation.coordinates && endLocation.coordinates) {
      onCalculate(startLocation, endLocation, departureTime);
      onClose();
    }
  };

  const handleSwap = () => {
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
  };

  if (!isOpen) return null;

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const canCalculate = startLocation.coordinates && endLocation.coordinates;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#1a1f2e] border-2 border-[#2d3548] rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b-2 border-[#2d3548] flex items-center justify-between bg-[#0f1419]">
            <h3 className="text-base font-bold text-white uppercase tracking-wide">📋 Планирование маршрута</h3>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Start Location */}
            <div className="space-y-2">
              <LocationInput
                label="Точка старта"
                value={startLocation}
                placeholder="Введите порт или координаты"
                onChange={setStartLocation}
                className="text-sm"
                icon={<span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">A</span>}
              />
              <button
                onClick={() => handleSetOnMap('start')}
                className={`w-full px-3 py-2 text-sm font-medium rounded transition-all ${
                  mapClickMode === 'start'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 animate-pulse'
                    : 'bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] hover:border-blue-500'
                }`}
              >
                {mapClickMode === 'start' ? '📍 Кликните на карту...' : '🗺️ Выбрать на карте'}
              </button>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="p-2 bg-[#2d3548] hover:bg-[#3d4558] border-2 border-[#3d4558] rounded-full transition-colors"
                title="Swap start and end"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* End Location */}
            <div className="space-y-2">
              <LocationInput
                label="Точка финиша"
                value={endLocation}
                placeholder="Введите порт или координаты"
                onChange={setEndLocation}
                className="text-sm"
                icon={<span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">B</span>}
              />
              <button
                onClick={() => handleSetOnMap('end')}
                className={`w-full px-3 py-2 text-sm font-medium rounded transition-all ${
                  mapClickMode === 'end'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 animate-pulse'
                    : 'bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] hover:border-blue-500'
                }`}
              >
                {mapClickMode === 'end' ? '📍 Кликните на карту...' : '🗺️ Выбрать на карте'}
              </button>
            </div>

            {/* Departure Time */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                🕐 Время отправления (UTC)
              </label>
              <input
                type="datetime-local"
                value={formatDateTime(departureTime)}
                onChange={(e) => setDepartureTime(new Date(e.target.value))}
                className="w-full px-3 py-2 bg-[#0f1419] border-2 border-[#2d3548] rounded text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setDepartureTime(new Date())}
                  className="flex-1 px-2 py-1.5 text-xs bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] rounded transition-colors font-medium"
                >
                  Сейчас
                </button>
                <button
                  onClick={() => setDepartureTime(new Date(Date.now() + 6 * 60 * 60 * 1000))}
                  className="flex-1 px-2 py-1.5 text-xs bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] rounded transition-colors font-medium"
                >
                  +6ч
                </button>
                <button
                  onClick={() => setDepartureTime(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                  className="flex-1 px-2 py-1.5 text-xs bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] rounded transition-colors font-medium"
                >
                  +1д
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t-2 border-[#2d3548] flex gap-3 bg-[#0f1419]">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm bg-[#2d3548] hover:bg-[#3d4558] text-white border-2 border-[#3d4558] rounded font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="flex-1 px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded transition-colors shadow-lg"
            >
              🚢 Рассчитать маршрут
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

