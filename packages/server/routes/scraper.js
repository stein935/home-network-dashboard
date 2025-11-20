const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const Scraper = require('../models/Scraper');
const ScraperLog = require('../models/ScraperLog');
const ScraperService = require('../services/scraperService');
const scheduler = require('../services/scheduler');
const isAdmin = require('../middleware/admin');

// Validation middleware for create
const validateScraperCreate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('url').trim().isURL().withMessage('Valid URL is required'),
  body('calendar_id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Calendar ID is required'),
  body('cron_schedule')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Cron schedule is required'),
];

// Validation middleware for update
const validateScraperUpdate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('url').trim().isURL().withMessage('Valid URL is required'),
  body('calendar_id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Calendar ID is required'),
  body('cron_schedule')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Cron schedule is required'),
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
];

// GET all scrapers (admin only)
router.get('/', isAdmin, (req, res) => {
  try {
    const scrapers = Scraper.getAll();
    res.json(scrapers);
  } catch (error) {
    console.error('Error fetching scrapers:', error);
    res.status(500).json({ error: 'Failed to fetch scrapers' });
  }
});

// GET scraper by ID (admin only)
router.get('/:id', isAdmin, [param('id').isInt()], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scraper = Scraper.findById(req.params.id);
    if (!scraper) {
      return res.status(404).json({ error: 'Scraper not found' });
    }

    res.json(scraper);
  } catch (error) {
    console.error('Error fetching scraper:', error);
    res.status(500).json({ error: 'Failed to fetch scraper' });
  }
});

// POST create scraper (admin only)
router.post('/', isAdmin, validateScraperCreate, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, url, calendar_id, cron_schedule } = req.body;

    const scraper = Scraper.create(name, url, calendar_id, cron_schedule);

    // Update scheduler
    scheduler.updateSchedule(scraper.id);

    console.log(`Scraper created: ${name} by ${req.user.email}`);
    res.status(201).json(scraper);
  } catch (error) {
    console.error('Error creating scraper:', error);
    res.status(500).json({ error: 'Failed to create scraper' });
  }
});

// PUT update scraper (admin only)
router.put(
  '/:id',
  isAdmin,
  [param('id').isInt(), ...validateScraperUpdate],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existing = Scraper.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Scraper not found' });
      }

      const { name, url, calendar_id, cron_schedule, enabled } = req.body;

      const scraper = Scraper.update(
        req.params.id,
        name,
        url,
        calendar_id,
        cron_schedule,
        enabled
      );

      // Update scheduler
      scheduler.updateSchedule(req.params.id);

      console.log(`Scraper updated: ${name} by ${req.user.email}`);
      res.json(scraper);
    } catch (error) {
      console.error('Error updating scraper:', error);
      res.status(500).json({ error: 'Failed to update scraper' });
    }
  }
);

// DELETE scraper (admin only)
router.delete('/:id', isAdmin, [param('id').isInt()], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = Scraper.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Scraper not found' });
    }

    // Remove from scheduler
    scheduler.removeSchedule(req.params.id);

    Scraper.delete(req.params.id);

    console.log(`Scraper deleted: ${existing.name} by ${req.user.email}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scraper:', error);
    res.status(500).json({ error: 'Failed to delete scraper' });
  }
});

// POST trigger scraper manually (admin only)
router.post(
  '/:id/trigger',
  isAdmin,
  [param('id').isInt()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const scraper = Scraper.findById(req.params.id);
      if (!scraper) {
        return res.status(404).json({ error: 'Scraper not found' });
      }

      console.log(
        `Manual trigger of scraper ${scraper.name} by ${req.user.email}`
      );

      // Run scraper using the authenticated user's ID
      const result = await ScraperService.runScraper(
        req.params.id,
        req.user.id
      );

      res.json(result);
    } catch (error) {
      console.error('Error triggering scraper:', error);
      res.status(500).json({ error: 'Failed to trigger scraper' });
    }
  }
);

// GET logs for a scraper (admin only)
router.get('/:id/logs', isAdmin, [param('id').isInt()], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scraper = Scraper.findById(req.params.id);
    if (!scraper) {
      return res.status(404).json({ error: 'Scraper not found' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const logs = ScraperLog.getRecent(req.params.id, limit);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching scraper logs:', error);
    res.status(500).json({ error: 'Failed to fetch scraper logs' });
  }
});

module.exports = router;
