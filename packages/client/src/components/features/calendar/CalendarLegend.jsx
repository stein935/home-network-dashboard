import { AlertTriangle } from 'lucide-react';

/**
 * Calendar legend component for multi-calendar support
 * Displays a legend showing which color represents which calendar
 * Only renders when 2+ calendars are configured
 */
export function CalendarLegend({ calendars, errors = [] }) {
  // Only show legend for 2+ calendars
  if (!calendars || calendars.length < 2) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {calendars.map((calendar) => {
        const hasError = errors.some((err) => err.calendarId === calendar.id);

        return (
          <div key={calendar.id} className="flex items-center gap-2">
            {hasError ? (
              <AlertTriangle size={14} className="flex-shrink-0 text-error" />
            ) : (
              <div
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: calendar.color }}
                aria-label={`Color indicator for ${calendar.name}`}
              />
            )}
            <span
              className={`text-sm ${hasError ? 'text-error' : 'text-text'}`}
            >
              {calendar.name} {hasError && '(access error)'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default CalendarLegend;
