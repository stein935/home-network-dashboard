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
