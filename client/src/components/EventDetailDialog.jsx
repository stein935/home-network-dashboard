import { MapPin, Clock, Calendar as CalendarIcon, Link as LinkIcon, Users } from 'lucide-react';
import { Dialog } from './Dialog';

export function EventDetailDialog({ event, onClose, containerRef }) {
  if (!event) return null;

  const formatDateTime = (dateString, isAllDay) => {
    if (isAllDay) {
      return 'All day';
    }
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog
      title={event.summary || 'Untitled Event'}
      onClose={onClose}
      zIndex={9999}
    >
      {/* Date/Time */}
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <Clock size={20} className="text-accent1" strokeWidth={3} />
        </div>
        <div>
          <div className="font-display uppercase text-sm text-text/70 mb-1">Time</div>
          {event.allDay ? (
            <div className="font-body text-text">
              <div>{formatDateOnly(event.start)}</div>
              {event.start !== event.end && (
                <div className="text-sm text-text/70 mt-1">
                  Ends: {formatDateOnly(event.end)}
                </div>
              )}
            </div>
          ) : (
            <div className="font-body text-text">
              <div>{formatDateTime(event.start)}</div>
              <div className="text-sm text-text/70 mt-1">
                to {formatDateTime(event.end)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      {event.location && (
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <MapPin size={20} className="text-accent1" strokeWidth={3} />
          </div>
          <div>
            <div className="font-display uppercase text-sm text-text/70 mb-1">Location</div>
            <div className="font-body text-text">{event.location}</div>
          </div>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="border-3 border-border bg-white p-4">
          <div className="font-display uppercase text-sm text-text/70 mb-2">Description</div>
          <div className="font-body text-text whitespace-pre-wrap">
            {event.description}
          </div>
        </div>
      )}

      {/* Attendees */}
      {event.attendees && event.attendees.length > 0 && (
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <Users size={20} className="text-accent1" strokeWidth={3} />
          </div>
          <div className="flex-1">
            <div className="font-display uppercase text-sm text-text/70 mb-2">Attendees</div>
            <div className="space-y-2">
              {event.attendees.map((attendee, idx) => (
                <div key={idx} className="font-body text-sm text-text flex items-center gap-2">
                  <span>{attendee.email}</span>
                  {attendee.organizer && (
                    <span className="text-xs bg-accent1 text-white px-2 py-0.5 uppercase font-display">
                      Organizer
                    </span>
                  )}
                  {attendee.responseStatus && (
                    <span className={`text-xs px-2 py-0.5 uppercase font-display ${
                      attendee.responseStatus === 'accepted' ? 'bg-green-500 text-white' :
                      attendee.responseStatus === 'declined' ? 'bg-red-500 text-white' :
                      attendee.responseStatus === 'tentative' ? 'bg-yellow-500 text-white' :
                      'bg-gray-300 text-text'
                    }`}>
                      {attendee.responseStatus}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conference/Meeting Link */}
      {event.hangoutLink && (
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <LinkIcon size={20} className="text-accent1" strokeWidth={3} />
          </div>
          <div>
            <div className="font-display uppercase text-sm text-text/70 mb-1">Meeting Link</div>
            <a
              href={event.hangoutLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-accent1 hover:text-accent2 underline"
            >
              Join meeting
            </a>
          </div>
        </div>
      )}

      {/* Event Link */}
      {event.htmlLink && (
        <div className="border-t-3 border-border pt-4">
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border-3 border-border bg-white hover:border-accent1 transition-colors font-display uppercase text-sm"
          >
            <CalendarIcon size={16} />
            View in Google Calendar
          </a>
        </div>
      )}
    </Dialog>
  );
}

export default EventDetailDialog;
