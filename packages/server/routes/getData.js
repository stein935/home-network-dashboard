/**
 * GetData API Routes
 *
 * Routes for managing and executing data functions.
 * Data functions are hard-coded in the dataFunctions directory.
 * Admin users can view functions, trigger manual execution, and view logs.
 */

const express = require('express');
const { param, validationResult } = require('express-validator');
const router = express.Router();
const Scraper = require('../models/Scraper'); // Uses data_functions table
const ScraperLog = require('../models/ScraperLog'); // Uses data_function_logs table
const GetDataService = require('../services/getDataService');
const isAdmin = require('../middleware/admin');

/**
 * GET /api/get-data
 * List all data functions (read-only)
 * Admin only
 */
router.get('/', isAdmin, (req, res) => {
  try {
    const dataFunctions = Scraper.getAll();
    res.json(dataFunctions);
  } catch (error) {
    console.error('Error fetching data functions:', error);
    res.status(500).json({ error: 'Failed to fetch data functions' });
  }
});

/**
 * GET /api/get-data/:id
 * Get a specific data function by ID
 * Admin only
 */
router.get('/:id', isAdmin, [param('id').isInt()], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dataFunction = Scraper.findById(req.params.id);
    if (!dataFunction) {
      return res.status(404).json({ error: 'Data function not found' });
    }

    res.json(dataFunction);
  } catch (error) {
    console.error('Error fetching data function:', error);
    res.status(500).json({ error: 'Failed to fetch data function' });
  }
});

/**
 * POST /api/get-data/:id/trigger
 * Manually trigger execution of a data function
 * Admin only
 */
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

      const dataFunction = Scraper.findById(req.params.id);
      if (!dataFunction) {
        return res.status(404).json({ error: 'Data function not found' });
      }

      console.log(
        `Manual trigger of data function "${dataFunction.name}" by ${req.user.email}`
      );

      // Run data function using the authenticated user's ID
      const result = await GetDataService.runFunction(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        functionName: dataFunction.name,
        eventsCreated: result.eventsCreated,
        eventsDeleted: result.eventsDeleted,
        message: result.message,
      });
    } catch (error) {
      console.error('Error triggering data function:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to trigger data function',
      });
    }
  }
);

/**
 * GET /api/get-data/:id/logs
 * Get execution logs for a data function
 * Admin only
 */
router.get('/:id/logs', isAdmin, [param('id').isInt()], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dataFunction = Scraper.findById(req.params.id);
    if (!dataFunction) {
      return res.status(404).json({ error: 'Data function not found' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const logs = ScraperLog.getRecent(req.params.id, limit);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching data function logs:', error);
    res.status(500).json({ error: 'Failed to fetch data function logs' });
  }
});

module.exports = router;
