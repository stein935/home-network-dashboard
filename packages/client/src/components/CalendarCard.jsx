import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MoreVertical,
} from 'lucide-react';
import { calendarApi } from '../utils/api';
import { EventDetailDialog } from './EventDetailDialog';

export function CalendarCard({
  service,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const config = service.config || {};
  const defaultViewType = config.view_type || 'week';
  const cardElementRef = useRef(null);
  const cardRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedViewType, setSelectedViewType] = useState(defaultViewType); // What user selected
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isDragOver, setIsDragOver] = useState(false);

  const calendarId = config.calendar_id || 'primary';

  // Track window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive breakpoints
  const MONTH_VIEW_MIN_WIDTH = 950;
  const WEEK_STACK_WIDTH = 800;

  // Calculate effective view type based on width constraints
  const getEffectiveViewType = () => {
    if (!windowWidth) return selectedViewType;

    // If user selected month but width is too narrow, show week instead
    if (selectedViewType === 'month' && windowWidth < MONTH_VIEW_MIN_WIDTH) {
      setSelectedViewType('week');
      return 'week';
    }

    return selectedViewType;
  };

  const effectiveViewType = getEffectiveViewType();

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Get Sunday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getTimeRange = useCallback(() => {
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
      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      end.setHours(23, 59, 59, 999);
      timeMin = start.toISOString();
      timeMax = end.toISOString();
    }

    return { timeMin, timeMax };
  }, [currentDate, effectiveViewType]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { timeMin, timeMax } = getTimeRange();

      const response = await calendarApi.getEvents(
        calendarId,
        timeMin,
        timeMax
      );

      // Deduplicate events at the source
      const uniqueEvents = response.data.filter(
        (event, index, self) =>
          index ===
          self.findIndex(
            (e) =>
              e.id === event.id ||
              (e.summary === event.summary &&
                e.start === event.start &&
                e.end === event.end)
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
  }, [calendarId, getTimeRange]);

  useEffect(() => {
    if (calendarId) {
      fetchEvents();
    }
  }, [calendarId, fetchEvents]);

  const navigate = (direction) => {
    const newDate = new Date(currentDate);

    if (effectiveViewType === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (effectiveViewType === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (effectiveViewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }

    setCurrentDate(newDate);
  };

  // Drag handlers
  const handleDragStart = (e) => {
    // Set the drag image to the entire card
    if (cardRef.current) {
      e.dataTransfer.setDragImage(cardRef.current, 150, 100);
    }
    if (onDragStart) {
      onDragStart(e, service);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e, service);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getHeaderText = () => {
    if (effectiveViewType === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (effectiveViewType === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
    } else if (effectiveViewType === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    }
  };

  if (loading) {
    return (
      <div className="service-card">
        <div className="flex h-full items-center justify-center">
          <p className="text-text">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-card">
        <div className="flex h-full flex-col items-center justify-center">
          <CalendarIcon size={48} className="mb-4 text-error" />
          <p className="text-center text-error">{error}</p>
        </div>
      </div>
    );
  }

  // Determine column span based on view type
  const getColumnSpanClass = () => {
    if (effectiveViewType === 'day') return 'col-span-1 md:col-span-2';
    if (effectiveViewType === 'week')
      return 'col-span-1 md:col-span-3 lg:col-span-4';
    if (effectiveViewType === 'month')
      return 'col-span-1 md:col-span-3 lg:col-span-4';
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
      return (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    }
    return false;
  };

  return (
    <div
      ref={cardRef}
      className={`service-card calendar-card ${getColumnSpanClass()} relative ${isDragOver ? 'ring-4 ring-accent3' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag handle icon */}
      <div
        className="absolute right-4 top-4 z-30 cursor-move"
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation(); // Prevent any card interactions when clicking drag handle
        }}
      >
        <MoreVertical
          size={24}
          className="text-text/40 transition-colors hover:text-text/70"
        />
      </div>

      {/* Header with navigation */}
      <div className="mb-4 flex w-full items-center justify-between">
        <h3 className="font-display text-2xl uppercase text-text">
          {service.name}
        </h3>
      </div>

      {/* View type selector */}
      <div className="item-center flex w-full flex-wrap justify-between gap-2">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedViewType('day')}
            className={`border-3 px-3 py-1 font-display text-sm uppercase text-text transition-colors ${
              selectedViewType === 'day'
                ? 'border-accent1 bg-accent1 text-white'
                : 'border-border'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setSelectedViewType('week')}
            className={`border-3 px-3 py-1 font-display text-sm uppercase text-text transition-colors ${
              selectedViewType === 'week'
                ? 'border-accent1 bg-accent1 text-white'
                : 'border-border'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedViewType('month')}
            disabled={windowWidth && windowWidth < MONTH_VIEW_MIN_WIDTH}
            className={`border-3 px-3 py-1 font-display text-sm uppercase transition-colors ${
              windowWidth && windowWidth < MONTH_VIEW_MIN_WIDTH
                ? ''
                : 'text-text'
            } ${selectedViewType === 'month' ? 'border-accent1 bg-accent1 text-white' : 'border-border'}`}
            title={
              windowWidth && windowWidth < MONTH_VIEW_MIN_WIDTH
                ? 'Month view requires more width'
                : ''
            }
          >
            Month
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            disabled={isViewingToday()}
            className={`border-3 border-border px-3 py-2 font-display text-sm uppercase transition-colors ${
              isViewingToday()
                ? ''
                : 'cursor-pointer bg-white hover:border-accent1'
            }`}
            aria-label="Go to today"
          >
            <CalendarIcon size={20} strokeWidth={3} />
          </button>
          <button
            onClick={() => navigate(-1)}
            className="border-3 border-border bg-white p-2 transition-colors hover:border-accent1"
            aria-label="Previous"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="border-3 border-border bg-white p-2 transition-colors hover:border-accent1"
            aria-label="Next"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Date header */}
      <div className="mb-4 text-center font-display text-lg uppercase text-text">
        {getHeaderText()}
      </div>

      {/* Calendar view content */}
      <div className="calendar-content">
        {effectiveViewType === 'day' && (
          <DayView
            events={events}
            currentDate={currentDate}
            formatDate={formatDate}
            setSelectedEvent={setSelectedEvent}
          />
        )}
        {effectiveViewType === 'week' && (
          <WeekView
            events={events}
            currentDate={currentDate}
            formatDate={formatDate}
            getWeekStart={getWeekStart}
            setSelectedEvent={setSelectedEvent}
            windowWidth={windowWidth}
            weekStackWidth={WEEK_STACK_WIDTH}
          />
        )}
        {effectiveViewType === 'month' && (
          <MonthView
            events={events}
            currentDate={currentDate}
            expandedDay={expandedDay}
            setExpandedDay={setExpandedDay}
            setSelectedEvent={setSelectedEvent}
            windowWidth={windowWidth}
          />
        )}
      </div>

      {/* Event detail dialog */}
      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          containerRef={cardElementRef}
        />
      )}

      {/* Event modal */}
      {expandedDay && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          style={{ zIndex: 9998 }}
          onClick={() => setExpandedDay(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto border-5 border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl uppercase text-text">
                {expandedDay.date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <button
                onClick={() => setExpandedDay(null)}
                className="text-text hover:text-accent1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {expandedDay.events.map((event, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer border-3 border-border bg-white p-3 transition-colors hover:bg-accent1/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDay(null);
                    setSelectedEvent(event);
                  }}
                >
                  <div className="flex items-center gap-1 font-display text-sm uppercase text-accent1">
                    {event.allDay && <CalendarIcon size={14} />}
                    {event.allDay ? 'All Day' : formatDate(event.start)}
                  </div>
                  <div className="mt-1 font-body text-text">
                    {event.summary}
                  </div>
                  {event.location && (
                    <div className="mt-1 font-body text-xs text-text/70">
                      {event.location}
                    </div>
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
        dayEvents.map((event, idx) => (
          <div
            key={idx}
            className="cursor-pointer border-3 border-border bg-surface p-3 transition-colors hover:bg-accent1/10"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="flex items-center gap-1 font-display text-sm uppercase text-accent1">
              {event.allDay && <CalendarIcon size={14} />}
              {event.allDay ? 'All Day' : formatDate(event.start)}
            </div>
            <div className="mt-1 font-body text-text">{event.summary}</div>
            {event.location && (
              <div className="mt-1 font-body text-xs text-text/70">
                {event.location}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Week View Component
function WeekView({
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
            className={`border-3 ${isToday ? 'border-accent1' : 'border-border'} bg-surface p-2`}
          >
            {isNarrow ? (
              // Horizontal layout for narrow view
              <div className="mb-2 flex items-center gap-3">
                <div className="min-w-[60px] font-display text-sm uppercase">
                  {dayNames[idx]}
                </div>
                <div className="font-display text-lg text-text">
                  {day.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ) : (
              // Original stacked layout for wide view
              <>
                <div className="mb-2 flex w-full items-center justify-between font-display uppercase">
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

// Month View Component
function MonthView({
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
              className={`border-3 ${isToday ? 'border-accent1' : 'border-border'} flex min-h-[120px] flex-col bg-surface p-2`}
            >
              <div className="mb-1 font-display text-sm text-text">{day}</div>
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

export default CalendarCard;
