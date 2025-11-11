import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { calendarApi } from '../utils/api';
import { EventDetailDialog } from './EventDetailDialog';

export function CalendarCard({ service }) {
  const config = service.config || {};
  const defaultViewType = config.view_type || 'week';
  const resizeObserverRef = useRef(null);
  const cardElementRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedViewType, setSelectedViewType] = useState(defaultViewType); // What user selected
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [cardWidth, setCardWidth] = useState(null);

  const calendarId = config.calendar_id || 'primary';

  // Responsive breakpoints
  const MONTH_VIEW_MIN_WIDTH = 900;
  const WEEK_STACK_WIDTH = 672;

  // Callback ref to set initial width immediately when DOM node is attached
  const cardRef = (node) => {
    cardElementRef.current = node;

    if (node) {
      // Set initial width immediately
      setCardWidth(node.offsetWidth);

      // Clean up previous observer if it exists
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      // Set up ResizeObserver
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setCardWidth(entry.contentRect.width);
        }
      });

      resizeObserverRef.current.observe(node);
    } else {
      // Cleanup when node is removed
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Calculate effective view type based on width constraints
  const getEffectiveViewType = () => {
    if (!cardWidth) return selectedViewType;

    // If user selected month but width is too narrow, show week instead
    if (selectedViewType === 'month' && cardWidth < MONTH_VIEW_MIN_WIDTH) {
      return 'week';
    }

    return selectedViewType;
  };

  const effectiveViewType = getEffectiveViewType();

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      if (calendarId && isMounted) {
        await fetchEvents();
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [currentDate, effectiveViewType, calendarId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { timeMin, timeMax } = getTimeRange();

      const response = await calendarApi.getEvents(calendarId, timeMin, timeMax);

      // Deduplicate events at the source
      const uniqueEvents = response.data.filter((event, index, self) =>
        index === self.findIndex(e =>
          e.id === event.id ||
          (e.summary === event.summary && e.start === event.start && e.end === event.end)
        )
      );

      setEvents(uniqueEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRange = () => {
    let timeMin, timeMax;

    if (effectiveViewType === 'day') {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      timeMin = start.toISOString();
      timeMax = end.toISOString();
    } else if (effectiveViewType === 'week') {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      timeMin = start.toISOString();
      timeMax = end.toISOString();
    } else if (effectiveViewType === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      timeMin = start.toISOString();
      timeMax = end.toISOString();
    }

    return { timeMin, timeMax };
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Get Sunday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const navigate = (direction) => {
    const newDate = new Date(currentDate);

    if (effectiveViewType === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (effectiveViewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (effectiveViewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }

    setCurrentDate(newDate);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getHeaderText = () => {
    if (effectiveViewType === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (effectiveViewType === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
    } else if (effectiveViewType === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
  };

  if (loading) {
    return (
      <div className="service-card">
        <div className="flex items-center justify-center h-full">
          <p className="text-text">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-card">
        <div className="flex flex-col items-center justify-center h-full">
          <CalendarIcon size={48} className="text-error mb-4" />
          <p className="text-error text-center">{error}</p>
        </div>
      </div>
    );
  }

  // Determine column span based on view type
  const getColumnSpanClass = () => {
    if (effectiveViewType === 'day') return 'col-span-1';
    if (effectiveViewType === 'week') return 'col-span-1 md:col-span-2 lg:col-span-3';
    if (effectiveViewType === 'month') return 'col-span-1 md:col-span-2 lg:col-span-3';
    return 'col-span-1';
  };

  // Check if already viewing current period
  const isViewingToday = () => {
    const today = new Date();
    if (effectiveViewType === 'day') {
      return currentDate.toDateString() === today.toDateString();
    } else if (effectiveViewType === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return today >= weekStart && today <= weekEnd;
    } else if (effectiveViewType === 'month') {
      return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    }
    return false;
  };

  return (
    <div ref={cardRef} className={`service-card calendar-card ${getColumnSpanClass()} relative`}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="font-display text-2xl uppercase text-text">
          {service.name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            disabled={isViewingToday()}
            className={`px-3 py-2 border-3 border-border font-display uppercase text-sm transition-colors ${
              isViewingToday()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:border-accent1 cursor-pointer'
            }`}
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            onClick={() => navigate(-1)}
            className="p-2 border-3 border-border bg-white hover:border-accent1 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 border-3 border-border bg-white hover:border-accent1 transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* View type selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedViewType('day')}
          className={`px-3 py-1 border-3 font-display uppercase text-sm bg-white text-text transition-colors ${
            selectedViewType === 'day' ? 'border-accent1' : 'border-border'
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setSelectedViewType('week')}
          className={`px-3 py-1 border-3 font-display uppercase text-sm bg-white text-text transition-colors ${
            selectedViewType === 'week' ? 'border-accent1' : 'border-border'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setSelectedViewType('month')}
          disabled={cardWidth && cardWidth < MONTH_VIEW_MIN_WIDTH}
          className={`px-3 py-1 border-3 font-display uppercase text-sm transition-colors ${
            cardWidth && cardWidth < MONTH_VIEW_MIN_WIDTH
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
              : 'bg-white text-text'
          } ${selectedViewType === 'month' ? 'border-accent1' : 'border-border'}`}
          title={cardWidth && cardWidth < MONTH_VIEW_MIN_WIDTH ? 'Month view requires more width' : ''}
        >
          Month
        </button>
      </div>

      {/* Date header */}
      <div className="text-center font-display text-lg mb-4 text-text uppercase">
        {getHeaderText()}
      </div>

      {/* Calendar view content */}
      <div className="calendar-content">
        {effectiveViewType === 'day' && <DayView events={events} currentDate={currentDate} formatDate={formatDate} setSelectedEvent={setSelectedEvent} />}
        {effectiveViewType === 'week' && <WeekView events={events} currentDate={currentDate} formatDate={formatDate} getWeekStart={getWeekStart} setSelectedEvent={setSelectedEvent} cardWidth={cardWidth} weekStackWidth={WEEK_STACK_WIDTH} />}
        {effectiveViewType === 'month' && <MonthView events={events} currentDate={currentDate} expandedDay={expandedDay} setExpandedDay={setExpandedDay} setSelectedEvent={setSelectedEvent} cardWidth={cardWidth} />}
      </div>

      {/* Event detail dialog */}
      {selectedEvent && <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} containerRef={cardElementRef} />}

      {/* Event modal */}
      {expandedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 9998 }} onClick={() => setExpandedDay(null)}>
          <div className="bg-surface border-5 border-border p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl uppercase text-text">
                {expandedDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button onClick={() => setExpandedDay(null)} className="text-text hover:text-accent1">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {expandedDay.events.map((event, idx) => (
                <div
                  key={idx}
                  className="border-3 border-border bg-white p-3 cursor-pointer hover:bg-accent1/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDay(null);
                    setSelectedEvent(event);
                  }}
                >
                  <div className="font-display uppercase text-sm text-accent1 flex items-center gap-1">
                    {event.allDay && <CalendarIcon size={14} />}
                    {event.allDay ? 'All Day' : formatDate(event.start)}
                  </div>
                  <div className="font-body text-text mt-1">{event.summary}</div>
                  {event.location && (
                    <div className="font-body text-xs text-text/70 mt-1">{event.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Day View Component
function DayView({ events, currentDate, formatDate, setSelectedEvent }) {
  // Remove duplicates and filter events for this day
  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex(e => e.id === event.id || (e.summary === event.summary && e.start === event.start))
  );

  const dayEvents = uniqueEvents.filter(event => {
    // Parse dates - for all-day events, parse as local date, not UTC
    let eventStart, eventEnd;
    if (event.allDay) {
      // Parse as local date by using the date parts directly
      const [startYear, startMonth, startDay] = event.start.split('-').map(Number);
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
        <p className="text-text/70 text-center py-8">No events today</p>
      ) : (
        dayEvents.map((event, idx) => (
          <div
            key={idx}
            className="border-3 border-border bg-surface p-3 hover:bg-accent1/10 transition-colors cursor-pointer"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="font-display uppercase text-sm text-accent1 flex items-center gap-1">
              {event.allDay && <CalendarIcon size={14} />}
              {event.allDay ? 'All Day' : formatDate(event.start)}
            </div>
            <div className="font-body text-text mt-1">{event.summary}</div>
            {event.location && (
              <div className="font-body text-xs text-text/70 mt-1">{event.location}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Week View Component
function WeekView({ events, currentDate, formatDate, getWeekStart, setSelectedEvent, cardWidth, weekStackWidth }) {
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Remove duplicates from events array
  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex(e => e.id === event.id || (e.summary === event.summary && e.start === event.start))
  );

  // Stack vertically when narrow
  const isNarrow = cardWidth && cardWidth < weekStackWidth;

  return (
    <div className={`grid gap-2 ${isNarrow ? 'grid-cols-1' : 'grid-cols-7'}`}>
      {days.map((day, idx) => {
        const dayEvents = uniqueEvents.filter(event => {
          // Parse dates - for all-day events, parse as local date, not UTC
          let eventStart, eventEnd;
          if (event.allDay) {
            // Parse as local date by using the date parts directly
            const [startYear, startMonth, startDay] = event.start.split('-').map(Number);
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

          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);

          // Check if event overlaps with this day
          return eventStart <= dayEnd && eventEnd >= dayStart;
        });

        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <div key={idx} className={`border-3 ${isToday ? 'border-accent1' : 'border-border'} bg-surface p-2`}>
            {isNarrow ? (
              // Horizontal layout for narrow view
              <div className="flex items-center gap-3 mb-2">
                <div className="font-display uppercase text-sm min-w-[60px]">
                  {dayNames[idx]}
                </div>
                <div className="font-display text-lg text-text">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ) : (
              // Original stacked layout for wide view
              <>
                <div className="font-display uppercase text-xs text-center mb-2">
                  {dayNames[idx]}
                </div>
                <div className="font-display text-center text-lg mb-2 text-text">
                  {day.getDate()}
                </div>
              </>
            )}
            <div className={`divide-y ${isToday ? 'divide-accent1' : 'divide-border' }`}>
              {dayEvents.map((event, eventIdx) => (
                <div
                  key={eventIdx}
                  className="text-text text-xs py-1 font-body truncate flex items-center gap-1 cursor-pointer hover:bg-accent1/10 transition-colors"
                  title={event.summary}
                  onClick={() => setSelectedEvent(event)}
                >
                  {event.allDay && <CalendarIcon size={12} className="flex-shrink-0" />}
                  <span className="truncate">
                    {event.allDay ? event.summary : `${formatDate(event.start)} ${event.summary}`}
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

// Month View Component
function MonthView({ events, currentDate, setExpandedDay, setSelectedEvent, cardWidth }) {
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
  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex(e => e.id === event.id || (e.summary === event.summary && e.start === event.start))
  );

  // Stack days vertically when very narrow (< 400px)
  // Note: month view already switches to week view at 600px, so this is a fallback
  const isVeryNarrow = cardWidth && cardWidth < 400;

  return (
    <div>
      {/* Day headers */}
      <div className={`grid gap-1 mb-2 ${isVeryNarrow ? 'grid-cols-3' : 'grid-cols-7'}`}>
        {dayNames.map(name => (
          <div key={name} className="font-display uppercase text-xs text-center text-text">
            {isVeryNarrow ? name.slice(0, 1) : name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`grid gap-1 ${isVeryNarrow ? 'grid-cols-3' : 'grid-cols-7'}`}>
        {days.map((day, idx) => {
          if (!day) {
            return <div key={idx} />;
          }

          const date = new Date(year, month, day);
          const dayEvents = uniqueEvents.filter(event => {
            // Parse dates - for all-day events, parse as local date, not UTC
            let eventStart, eventEnd;
            if (event.allDay) {
              // Parse as local date by using the date parts directly
              const [startYear, startMonth, startDay] = event.start.split('-').map(Number);
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
              className={`border-3 ${isToday ? 'border-accent1' : 'border-border'} bg-surface p-2 flex flex-col min-h-[120px]`}
            >
              <div className="font-display text-sm text-text mb-1">
                {day}
              </div>
              <div className={`flex-1 overflow-hidden divide-y ${isToday ? 'divide-accent1' : 'divide-border' }`}>
                {dayEvents.slice(0, 2).map((event, eventIdx) => (
                  <div
                    key={eventIdx}
                    className="text-text text-xs py-1 truncate flex items-center gap-1 cursor-pointer hover:bg-accent1/10 transition-colors"
                    title={event.summary}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                  >
                    {event.allDay && <CalendarIcon size={10} className="flex-shrink-0" />}
                    <span className="truncate">{event.summary}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <button
                    onClick={() => setExpandedDay({ date, events: dayEvents })}
                    className="text-xs text-accent1 hover:text-accent2 py-1 cursor-pointer"
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

export default CalendarCard;
