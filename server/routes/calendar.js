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

// Get events for a specific calendar
router.get('/events', isAuthenticated, async (req, res) => {
  try {
    const { calendarId, timeMin, timeMax } = req.query;

    if (!timeMin || !timeMax) {
      return res.status(400).json({ error: 'timeMin and timeMax are required' });
    }

    const events = await CalendarService.getEvents(
      req.user.id,
      calendarId || 'primary',
      timeMin,
      timeMax
    );

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
