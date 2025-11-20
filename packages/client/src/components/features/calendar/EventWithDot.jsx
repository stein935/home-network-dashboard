/**
 * Wrapper component that adds a colored dot to event summaries
 * Only shows dot when 2+ calendars are configured
 */
export function EventWithDot({ event, calendars = [], children }) {
  const showDot = calendars.length >= 2;
  const calendarColor = calendars.find(
    (cal) => cal.id === event.calendarId
  )?.color;

  if (!showDot || !calendarColor) {
    return children;
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: calendarColor }}
        aria-label="Calendar indicator"
      />
      {children}
    </div>
  );
}

export default EventWithDot;
