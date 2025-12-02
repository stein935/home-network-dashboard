const express = require('express');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');
const isAdmin = require('../middleware/admin');

/**
 * GET /api/change-logs
 * Get all change logs (admin only, paginated)
 */
router.get('/', isAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const logs = ChangeLog.findAll(limit, offset);
    const total = ChangeLog.count();

    res.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching change logs:', error);
    res.status(500).json({ error: 'Failed to fetch change logs' });
  }
});

/**
 * DELETE /api/change-logs/cleanup
 * Manually trigger cleanup of logs older than 7 days (admin only)
 */
router.delete('/cleanup', isAdmin, (req, res) => {
  try {
    const deletedCount = ChangeLog.deleteOlderThan(7);
    console.log(
      `Manual cleanup of change logs: ${deletedCount} logs deleted by ${req.user.email}`
    );
    res.json({
      message: 'Cleanup completed',
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up change logs:', error);
    res.status(500).json({ error: 'Failed to cleanup change logs' });
  }
});

module.exports = router;
