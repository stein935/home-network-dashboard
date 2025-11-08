const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const Service = require('../models/Service');
const { isAuthenticated } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Validation middleware
const validateService = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('url').trim().isURL().withMessage('Valid URL is required'),
  body('icon').trim().isLength({ min: 1 }).withMessage('Icon is required'),
  body('display_order').isInt({ min: 0 }).withMessage('Display order must be a positive integer')
];

// GET all services (requires authentication)
router.get('/', isAuthenticated, (req, res) => {
  try {
    const services = Service.getAll();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST create service (admin only)
router.post('/', isAdmin, validateService, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, url, icon, display_order } = req.body;
    const service = Service.create(name, url, icon, display_order);

    console.log(`Service created: ${name} by ${req.user.email}`);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT update service (admin only)
router.put('/:id', isAdmin, [
  param('id').isInt().withMessage('Invalid service ID'),
  ...validateService
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, url, icon, display_order } = req.body;

    const existingService = Service.findById(id);
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = Service.update(id, name, url, icon, display_order);

    console.log(`Service updated: ${name} by ${req.user.email}`);
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE service (admin only)
router.delete('/:id', isAdmin, [
  param('id').isInt().withMessage('Invalid service ID')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const existingService = Service.findById(id);
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    Service.delete(id);

    console.log(`Service deleted: ${existingService.name} by ${req.user.email}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// PUT reorder services (admin only)
router.put('/reorder/bulk', isAdmin, (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    // Validate each update has id and displayOrder
    for (const update of updates) {
      if (!update.id || typeof update.displayOrder !== 'number') {
        return res.status(400).json({ error: 'Each update must have id and displayOrder' });
      }
    }

    Service.updateOrder(updates);

    console.log(`Services reordered by ${req.user.email}`);
    res.json({ message: 'Services reordered successfully' });
  } catch (error) {
    console.error('Error reordering services:', error);
    res.status(500).json({ error: 'Failed to reorder services' });
  }
});

module.exports = router;
