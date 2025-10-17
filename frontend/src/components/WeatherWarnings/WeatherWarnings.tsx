/**
 * WeatherWarnings Component
 * Displays weather warnings and alerts for the route
 */

import type { RouteWarning } from '../../types';
import { getSeverityIcon, getSeverityColor } from '../../services/routeApi';

interface WeatherWarningsProps {
  warnings: RouteWarning[];
  onWarningClick?: (waypointId: number) => void;
  className?: string;
}

export default function WeatherWarnings({
  warnings,
  onWarningClick,
  className = '',
}: WeatherWarningsProps) {
  // Group warnings by severity
  const dangerWarnings = warnings.filter((w) => w.severity === 'danger');
  const warningWarnings = warnings.filter((w) => w.severity === 'warning');
  const infoWarnings = warnings.filter((w) => w.severity === 'info');

  if (warnings.length === 0) {
    return (
      <div className={`bg-app-panel rounded-lg border border-app-border p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-app-text mb-3">Weather Warnings</h3>
        <div className="flex items-center gap-3 text-green-500 bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl">✓</div>
          <div>
            <div className="font-medium">All Clear</div>
            <div className="text-xs text-app-text-secondary mt-1">
              No significant weather warnings along the route
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-app-panel rounded-lg border border-app-border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-app-text">Weather Warnings</h3>
        <div className="text-xs bg-red-900/30 border border-red-700 text-red-400 px-2 py-1 rounded">
          {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        {dangerWarnings.length > 0 && (
          <div className="flex items-center gap-1 text-red-500">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{dangerWarnings.length} Danger</span>
          </div>
        )}
        {warningWarnings.length > 0 && (
          <div className="flex items-center gap-1 text-yellow-500">
            <span className="text-lg">⚡</span>
            <span className="font-medium">{warningWarnings.length} Warning</span>
          </div>
        )}
        {infoWarnings.length > 0 && (
          <div className="flex items-center gap-1 text-blue-500">
            <span className="text-lg">ℹ️</span>
            <span className="font-medium">{infoWarnings.length} Info</span>
          </div>
        )}
      </div>

      {/* Warnings list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {warnings.map((warning, index) => (
          <WarningItem
            key={index}
            warning={warning}
            onClick={onWarningClick}
          />
        ))}
      </div>
    </div>
  );
}

// Individual warning item component
function WarningItem({
  warning,
  onClick,
}: {
  warning: RouteWarning;
  onClick?: (waypointId: number) => void;
}) {
  const severityColor = getSeverityColor(warning.severity);
  const severityIcon = getSeverityIcon(warning.severity);

  const bgColor =
    warning.severity === 'danger'
      ? 'bg-red-900/20 border-red-700'
      : warning.severity === 'warning'
      ? 'bg-yellow-900/20 border-yellow-700'
      : 'bg-blue-900/20 border-blue-700';

  const handleClick = () => {
    if (onClick) {
      onClick(warning.waypoint_id);
    }
  };

  return (
    <div
      className={`${bgColor} border rounded-lg p-3 transition-all ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-xl ${severityColor} flex-shrink-0`}>
          {severityIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs font-medium text-app-text-secondary">
              Waypoint #{warning.waypoint_id + 1}
            </div>
            <div className="text-xs bg-app-bg px-2 py-0.5 rounded text-app-text-secondary">
              {warning.parameter}
            </div>
          </div>

          {/* Message */}
          <div className="text-sm text-app-text mb-1">{warning.message}</div>

          {/* Value */}
          <div className={`text-xs font-mono ${severityColor}`}>
            Value: {warning.value.toFixed(1)}{' '}
            {warning.parameter === 'wind' ? 'kts' : 'm'}
          </div>
        </div>

        {/* Arrow indicator for clickable */}
        {onClick && (
          <div className="text-app-text-secondary text-xs flex-shrink-0">→</div>
        )}
      </div>
    </div>
  );
}

