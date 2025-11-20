const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const CalendarService = require('../services/calendarService');

// Get user's calendars
router.get('/calendars', isAuthenticated, async (req, res) => {
  try {
    const calendars = await CalendarService.listCalendars(req.user.id);
    res.json(calendars);
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events for a specific calendar or multiple calendars
router.get('/events', isAuthenticated, async (req, res) => {
  try {
    const { calendarId, calendarIds, timeMin, timeMax } = req.query;

    if (!timeMin || !timeMax) {
      return res
        .status(400)
        .json({ error: 'timeMin and timeMax are required' });
    }

    // Support both single calendarId and multiple calendarIds
    let calendarIdArray;

    if (calendarIds) {
      // calendarIds can be a comma-separated string or an array from query params
      calendarIdArray = Array.isArray(calendarIds)
        ? calendarIds
        : calendarIds.split(',').map((id) => id.trim());
    } else if (calendarId) {
      // Backward compatibility: single calendarId
      calendarIdArray = [calendarId];
    } else {
      // Default to primary calendar
      calendarIdArray = ['primary'];
    }

    // If only one calendar, use the original single-calendar method
    if (calendarIdArray.length === 1) {
      const events = await CalendarService.getEvents(
        req.user.id,
        calendarIdArray[0],
        timeMin,
        timeMax
      );

      // Return in same format as multi-calendar for consistency
      res.json({
        events: events,
        calendars: [
          {
            id: calendarIdArray[0],
            accessible: true,
          },
        ],
        errors: [],
      });
    } else {
      // Multiple calendars: use the new multi-calendar method
      const result = await CalendarService.getEventsFromMultipleCalendars(
        req.user.id,
        calendarIdArray,
        timeMin,
        timeMax
      );

      res.json(result);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
