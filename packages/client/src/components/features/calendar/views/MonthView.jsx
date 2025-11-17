import { Calendar as CalendarIcon } from 'lucide-react';

export function MonthView({
  events,
  currentDate,
  setExpandedDay,
  setSelectedEvent,
  windowWidth,
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = [];

  // Fill in empty cells before the first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Fill in the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

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

  // Stack days vertically when very narrow (< 400px)
  // Note: month view already switches to week view at 600px, so this is a fallback
  const isVeryNarrow = windowWidth && windowWidth < 400;

  return (
    <div>
      {/* Day headers */}
      <div
        className={`mb-2 grid gap-1 ${isVeryNarrow ? 'grid-cols-3' : 'grid-cols-7'}`}
      >
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center font-display text-xs uppercase text-text"
          >
            {isVeryNarrow ? name.slice(0, 1) : name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className={`grid gap-1 ${isVeryNarrow ? 'grid-cols-3' : 'grid-cols-7'}`}
      >
        {days.map((day, idx) => {
          if (!day) {
            return <div key={idx} />;
          }

          const date = new Date(year, month, day);
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

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            // Check if event overlaps with this day
            return eventStart <= dayEnd && eventEnd >= dayStart;
          });

          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              className={`border-3 ${isToday ? 'border-accent1 outline outline-2 outline-accent1' : 'border-border'} flex min-h-[120px] flex-col bg-surface p-2`}
            >
              <div
                className={`mb-1 font-display text-sm ${isToday ? 'text-accent1' : 'text-text'}`}
              >
                {day}
              </div>
              <div
                className={`flex-1 divide-y overflow-hidden ${isToday ? 'divide-accent1' : 'divide-border'}`}
              >
                {dayEvents.slice(0, 2).map((event, eventIdx) => (
                  <div
                    key={eventIdx}
                    className="flex cursor-pointer items-center gap-1 truncate py-1 text-xs text-text transition-colors hover:bg-accent1/10"
                    title={event.summary}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                  >
                    {event.allDay && (
                      <CalendarIcon size={10} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{event.summary}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <button
                    onClick={() => setExpandedDay({ date, events: dayEvents })}
                    className="cursor-pointer py-1 text-xs text-accent1 hover:text-accent2"
                  >
                    +{dayEvents.length - 2} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
