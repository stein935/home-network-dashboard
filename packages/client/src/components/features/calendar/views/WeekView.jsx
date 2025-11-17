import { Calendar as CalendarIcon } from 'lucide-react';

export function WeekView({
  events,
  currentDate,
  formatDate,
  getWeekStart,
  setSelectedEvent,
  windowWidth,
  weekStackWidth,
}) {
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Remove duplicates from events array
  const uniqueEvents = events.filter(
    (event, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.id === event.id ||
          (e.summary === event.summary && e.start === event.start)
      )
  );

  // Stack vertically when narrow
  const isNarrow = windowWidth && windowWidth < weekStackWidth;

  return (
    <div className={`grid gap-2 ${isNarrow ? 'grid-cols-1' : 'grid-cols-7'}`}>
      {days.map((day, idx) => {
        const dayEvents = uniqueEvents.filter((event) => {
          // Parse dates - for all-day events, parse as local date, not UTC
          let eventStart, eventEnd;
          if (event.allDay) {
            // Parse as local date by using the date parts directly
            const [startYear, startMonth, startDay] = event.start
              .split('-')
              .map(Number);
            const [endYear, endMonth, endDay] = event.end
              .split('-')
              .map(Number);
            eventStart = new Date(startYear, startMonth - 1, startDay);
            eventEnd = new Date(endYear, endMonth - 1, endDay);
            // Adjust end date - Google returns exclusive end date (next day)
            eventEnd.setDate(eventEnd.getDate() - 1);
            eventEnd.setHours(23, 59, 59, 999);
          } else {
            eventStart = new Date(event.start);
            eventEnd = new Date(event.end);
          }

          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);

          // Check if event overlaps with this day
          return eventStart <= dayEnd && eventEnd >= dayStart;
        });

        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <div
            key={idx}
            className={`border-3 ${isToday ? 'border-accent1 outline outline-2 outline-accent1' : 'border-border'} bg-surface p-2`}
          >
            {isNarrow ? (
              // Horizontal layout for narrow view
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`min-w-[60px] font-display text-sm uppercase ${isToday ? 'text-accent1' : 'text-text'}`}
                >
                  {dayNames[idx]}
                </div>
                <div
                  className={`font-display text-lg ${isToday ? 'text-accent1' : 'text-text'}`}
                >
                  {day.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ) : (
              // Original stacked layout for wide view
              <>
                <div
                  className={`mb-2 flex w-full items-center justify-between font-display uppercase ${isToday ? 'text-accent1' : 'text-text'}`}
                >
                  <span className="text-xs">{dayNames[idx]}</span>
                  <span className="text-lg">{day.getDate()}</span>
                </div>
              </>
            )}
            <div
              className={`divide-y ${isToday ? 'divide-accent1' : 'divide-border'}`}
            >
              {dayEvents.map((event, eventIdx) => (
                <div
                  key={eventIdx}
                  className="flex cursor-pointer items-center gap-1 truncate py-1 font-body text-xs text-text transition-colors hover:bg-accent1/10"
                  title={event.summary}
                  onClick={() => setSelectedEvent(event)}
                >
                  {event.allDay && (
                    <CalendarIcon size={12} className="flex-shrink-0" />
                  )}
                  <span className="truncate">
                    {event.allDay
                      ? event.summary
                      : `${formatDate(event.start)} ${event.summary}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
