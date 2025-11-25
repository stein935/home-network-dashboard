const { google } = require('googleapis');
const User = require('../models/User');

class CalendarService {
  static getOAuthClient(userId) {
    const tokens = User.getGoogleTokens(userId);
    console.log(`Getting OAuth client for user ${userId}:`, {
      hasAccessToken: !!tokens?.accessToken,
      hasRefreshToken: !!tokens?.refreshToken,
    });

    if (!tokens || !tokens.accessToken) {
      console.error(`No tokens found for user ${userId}`);
      throw new Error(
        'No Google Calendar access. Please log out and log back in to grant calendar permissions.'
      );
    }

    if (!tokens.refreshToken) {
      console.warn(
        `User ${userId} is missing refresh token. Access will expire in 1 hour.`
      );
      console.warn(
        'User should log out and log back in to obtain a refresh token for permanent access.'
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    // Handle token refresh
    oauth2Client.on('tokens', (newTokens) => {
      console.log(`Refreshing tokens for user ${userId}`);
      if (newTokens.refresh_token) {
        User.updateGoogleTokens(
          userId,
          newTokens.access_token,
          newTokens.refresh_token
        );
      } else {
        User.updateGoogleTokens(
          userId,
          newTokens.access_token,
          tokens.refreshToken
        );
      }
    });

    return oauth2Client;
  }

  static async listCalendars(userId) {
    const auth = this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.calendarList.list();
      return response.data.items.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor,
      }));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw new Error('Failed to fetch calendars from Google');
    }
  }

  static async getEvents(userId, calendarId, timeMin, timeMax) {
    const auth = this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.list({
        calendarId: calendarId || 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      });

      return response.data.items.map((event) => ({
        id: event.id,
        summary: event.summary || '(No title)',
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        allDay: !event.start.dateTime,
        location: event.location,
        htmlLink: event.htmlLink,
        colorId: event.colorId,
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events from Google Calendar');
    }
  }

  /**
   * Fetch events from multiple calendars in parallel
   * @param {number} userId - User ID
   * @param {string[]} calendarIds - Array of calendar IDs
   * @param {string} timeMin - Start time (ISO 8601)
   * @param {string} timeMax - End time (ISO 8601)
   * @returns {Promise<{events: Array, calendars: Array, errors: Array}>}
   */
  static async getEventsFromMultipleCalendars(
    userId,
    calendarIds,
    timeMin,
    timeMax
  ) {
    const auth = this.getOAuthClient(userId);
    const calendarApi = google.calendar({ version: 'v3', auth });

    // First, fetch calendar list to get calendar metadata
    let calendarsList = [];
    try {
      const calListResponse = await calendarApi.calendarList.list();
      calendarsList = calListResponse.data.items;
    } catch (error) {
      console.error('Error fetching calendar list:', error);
    }

    // Fetch events from each calendar in parallel using Promise.allSettled
    const eventPromises = calendarIds.map((calendarId) =>
      calendarApi.events
        .list({
          calendarId: calendarId,
          timeMin: timeMin,
          timeMax: timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        })
        .then((response) => ({ calendarId, response, success: true }))
        .catch((error) => ({ calendarId, error, success: false }))
    );

    const results = await Promise.allSettled(eventPromises);

    // Process results
    const allEvents = [];
    const calendars = [];
    const errors = [];

    results.forEach((result, index) => {
      const calendarId = calendarIds[index];
      const calendarMeta = calendarsList.find((cal) => cal.id === calendarId);
      const calendarName = calendarMeta?.summary || calendarId;
      const calendarColor = calendarMeta?.backgroundColor || '#3788d8';

      if (result.status === 'fulfilled' && result.value.success) {
        // Successfully fetched events from this calendar
        const events = result.value.response.data.items.map((event) => ({
          id: event.id,
          summary: event.summary || '(No title)',
          description: event.description,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          allDay: !event.start.dateTime,
          location: event.location,
          htmlLink: event.htmlLink,
          colorId: event.colorId,
          // Add calendar metadata to each event
          calendarId: calendarId,
          calendarName: calendarName,
          calendarColor: calendarColor,
        }));

        allEvents.push(...events);

        calendars.push({
          id: calendarId,
          name: calendarName,
          color: calendarColor,
          accessible: true,
          eventCount: events.length,
        });
      } else {
        // Failed to fetch events from this calendar
        const error =
          result.status === 'rejected'
            ? result.reason
            : result.value?.error || new Error('Unknown error');

        console.error(
          `Error fetching events from calendar ${calendarId}:`,
          error
        );

        calendars.push({
          id: calendarId,
          name: calendarName,
          color: calendarColor,
          accessible: false,
          error: error.message || 'Access denied',
        });

        errors.push({
          calendarId: calendarId,
          calendarName: calendarName,
          error: error.message || 'Failed to fetch events',
        });
      }
    });

    // Sort events by start time
    allEvents.sort((a, b) => {
      const aTime = new Date(a.start).getTime();
      const bTime = new Date(b.start).getTime();
      return aTime - bTime;
    });

    // Deduplicate events (same event might appear in multiple calendars)
    const uniqueEvents = this._deduplicateEvents(allEvents);

    return {
      events: uniqueEvents,
      calendars: calendars,
      errors: errors,
    };
  }

  /**
   * Deduplicate events that appear in multiple calendars
   * @param {Array} events - Array of events
   * @returns {Array} Deduplicated events
   * @private
   */
  static _deduplicateEvents(events) {
    const seen = new Map();

    return events.filter((event) => {
      // Create a unique key based on event ID, summary, start, and end
      const key = `${event.id}-${event.summary}-${event.start}-${event.end}`;

      if (seen.has(key)) {
        return false;
      }

      seen.set(key, true);
      return true;
    });
  }

  static async createEvent(userId, calendarId, eventData) {
    const auth = this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.insert({
        calendarId: calendarId || 'primary',
        requestBody: eventData,
      });

      console.log(
        `Event created: ${response.data.summary} on ${response.data.start.date || response.data.start.dateTime}`
      );

      return {
        id: response.data.id,
        summary: response.data.summary,
        description: response.data.description,
        start: response.data.start.dateTime || response.data.start.date,
        end: response.data.end.dateTime || response.data.end.date,
        allDay: !response.data.start.dateTime,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event in Google Calendar');
    }
  }

  static async updateEvent(userId, calendarId, eventId, eventData) {
    const auth = this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.update({
        calendarId: calendarId || 'primary',
        eventId: eventId,
        requestBody: eventData,
      });

      console.log(`Event updated: ${response.data.summary} (${eventId})`);

      return {
        id: response.data.id,
        summary: response.data.summary,
        description: response.data.description,
        start: response.data.start.dateTime || response.data.start.date,
        end: response.data.end.dateTime || response.data.end.date,
        allDay: !response.data.start.dateTime,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event in Google Calendar');
    }
  }

  static async deleteEvent(userId, calendarId, eventId) {
    const auth = this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId: eventId,
      });

      console.log(`Event deleted: ${eventId}`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event from Google Calendar');
    }
  }
}

module.exports = CalendarService;
