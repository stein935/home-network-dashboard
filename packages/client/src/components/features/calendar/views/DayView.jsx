import { Calendar as CalendarIcon } from 'lucide-react';

export function DayView({
  events,
  currentDate,
  formatDate,
  setSelectedEvent,
  calendars = [],
}) {
  // Remove duplicates and filter events for this day
  const uniqueEvents = events.filter(
    (event, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.id === event.id ||
          (e.summary === event.summary && e.start === event.start)
      )
  );

  const dayEvents = uniqueEvents.filter((event) => {
    // Parse dates - for all-day events, parse as local date, not UTC
    let eventStart, eventEnd;
    if (event.allDay) {
      // Parse as local date by using the date parts directly
      const [startYear, startMonth, startDay] = event.start
        .split('-')
        .map(Number);
      const [endYear, endMonth, endDay] = event.end.split('-').map(Number);
      eventStart = new Date(startYear, startMonth - 1, startDay);
      eventEnd = new Date(endYear, endMonth - 1, endDay);
      // Adjust end date - Google returns exclusive end date (next day)
      eventEnd.setDate(eventEnd.getDate() - 1);
      eventEnd.setHours(23, 59, 59, 999);
    } else {
      eventStart = new Date(event.start);
      eventEnd = new Date(event.end);
    }

    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check if event overlaps with this day
    return eventStart <= dayEnd && eventEnd >= dayStart;
  });

  return (
    <div className="space-y-2">
      {dayEvents.length === 0 ? (
        <p className="py-8 text-center text-text/70">No events today</p>
      ) : (
        dayEvents.map((event, idx) => {
          // Find calendar color (only show dot if 2+ calendars)
          const showDot = calendars.length >= 2;
          const calendarColor = calendars.find(
            (cal) => cal.id === event.calendarId
          )?.color;

          return (
            <div
              key={idx}
              className="cursor-pointer border-3 border-border bg-surface p-3 transition-colors hover:bg-accent1/10"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-center gap-1 font-display text-sm uppercase text-accent1">
                {event.allDay && <CalendarIcon size={14} />}
                {event.allDay ? 'All Day' : formatDate(event.start)}
              </div>
              <div className="mt-1 flex items-center gap-2 font-body text-text">
                {showDot && calendarColor && (
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: calendarColor }}
                    aria-label="Calendar indicator"
                  />
                )}
                <span>{event.summary}</span>
              </div>
              {event.location && (
                <div className="mt-1 font-body text-xs text-text/70">
                  {event.location}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
