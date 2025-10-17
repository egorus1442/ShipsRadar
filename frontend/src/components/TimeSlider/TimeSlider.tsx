/**
 * Time Slider Component
 * Allows users to select a date/time for weather forecast
 * Supports animation with play/pause functionality
 */

import { useState, useEffect, useRef, useMemo } from 'react';

export interface TimeSliderProps {
  currentTime: Date;
  minTime?: Date;
  maxTime?: Date;
  onChange: (time: Date) => void;
  step?: number; // hours
  className?: string;
}

export function TimeSlider({
  currentTime,
  minTime,
  maxTime,
  onChange,
  step = 3, // 3 hours by default
  className = '',
}: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 4>(1);
  const playIntervalRef = useRef<number | null>(null);

  // Default time bounds: now to +7 days
  const defaultMinTime = useMemo(() => new Date(), []);
  const defaultMaxTime = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + 7);
    return max;
  }, []);

  const effectiveMinTime = minTime || defaultMinTime;
  const effectiveMaxTime = maxTime || defaultMaxTime;

  // Calculate total steps and current step
  const totalMilliseconds = effectiveMaxTime.getTime() - effectiveMinTime.getTime();
  const totalSteps = Math.floor(totalMilliseconds / (step * 60 * 60 * 1000));
  const currentStepValue = Math.floor(
    (currentTime.getTime() - effectiveMinTime.getTime()) / (step * 60 * 60 * 1000)
  );

  // Format time for display
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Format relative time (e.g., "Сейчас", "+6ч", "+1д")
  const formatRelativeTime = (date: Date): string => {
    const diffMs = date.getTime() - defaultMinTime.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours === 0) return 'Сейчас';
    if (diffHours < 24) return `+${diffHours}ч`;
    
    const diffDays = Math.round(diffHours / 24);
    return `+${diffDays}д`;
  };

  // Handle slider change
  const handleSliderChange = (stepValue: number) => {
    const newTime = new Date(effectiveMinTime.getTime() + stepValue * step * 60 * 60 * 1000);
    onChange(newTime);
  };

  // Play/pause animation
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Handle play animation
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / playSpeed; // Speed multiplier

      playIntervalRef.current = window.setInterval(() => {
        const nextStepValue = currentStepValue + 1;
        
        if (nextStepValue >= totalSteps) {
          // Reached the end, stop playing and reset
          setIsPlaying(false);
          onChange(effectiveMinTime);
        } else {
          handleSliderChange(nextStepValue);
        }
      }, intervalMs);
    } else {
      if (playIntervalRef.current !== null) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current !== null) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentStepValue, totalSteps, playSpeed, effectiveMinTime]);

  // Quick jump buttons
  const quickJumps = [
    { label: 'Сейчас', hours: 0 },
    { label: '+6ч', hours: 6 },
    { label: '+12ч', hours: 12 },
    { label: '+1д', hours: 24 },
    { label: '+3д', hours: 72 },
    { label: '+7д', hours: 168 },
  ];

  const handleQuickJump = (hours: number) => {
    const newTime = new Date(effectiveMinTime.getTime() + hours * 60 * 60 * 1000);
    if (newTime <= effectiveMaxTime) {
      onChange(newTime);
    } else {
      onChange(effectiveMaxTime);
    }
  };

  return (
    <div className={`bg-[#1a1f2e] border-t-2 border-[#2d3548] px-4 py-3 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Time Info - Compact */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400">🕐</div>
          <div>
            <div className="text-xs text-gray-400">Время прогноза:</div>
            <div className="text-sm font-bold text-white">{formatDateTime(currentTime)}</div>
          </div>
          <div className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
            {formatRelativeTime(currentTime)}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-[#2d3548]"></div>

        {/* Play Controls - Compact */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
            title={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Пауза</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Старт</span>
              </>
            )}
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1">
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed as 1 | 2 | 4)}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  playSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2d3548] text-gray-400 hover:bg-[#3d4558]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-[#2d3548]"></div>

        {/* Slider - Flexible */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={totalSteps}
            value={currentStepValue}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            disabled={isPlaying}
            className="w-full h-2 bg-[#2d3548] rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                (currentStepValue / totalSteps) * 100
              }%, #2d3548 ${(currentStepValue / totalSteps) * 100}%, #2d3548 100%)`,
            }}
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{formatDateTime(effectiveMinTime)}</span>
            <span>Шаг {currentStepValue + 1} / {totalSteps + 1}</span>
            <span>{formatDateTime(effectiveMaxTime)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-[#2d3548]"></div>

        {/* Quick Jump - Compact */}
        <div className="flex items-center gap-1">
          {quickJumps.map((jump) => (
            <button
              key={jump.label}
              onClick={() => handleQuickJump(jump.hours)}
              disabled={isPlaying}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                Math.abs(
                  currentTime.getTime() - (effectiveMinTime.getTime() + jump.hours * 60 * 60 * 1000)
                ) < 30 * 60 * 1000
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2d3548] text-gray-400 hover:bg-[#3d4558]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {jump.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimeSlider;

