const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const Section = require('../models/Section');
const { isAuthenticated } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Validation middleware
const validateSection = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('display_order').isInt({ min: 0 }).withMessage('Display order must be a positive integer')
];

// GET all sections (requires authentication)
router.get('/', isAuthenticated, (req, res) => {
  try {
    const sections = Section.getAll();
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// GET all sections with their services (requires authentication)
router.get('/with-services', isAuthenticated, (req, res) => {
  try {
    const sectionsWithServices = Section.getWithServices();
    res.json(sectionsWithServices);
  } catch (error) {
    console.error('Error fetching sections with services:', error);
    res.status(500).json({ error: 'Failed to fetch sections with services' });
  }
});

// POST create section (admin only)
router.post('/', isAdmin, validateSection, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, display_order } = req.body;
    const section = Section.create(name, display_order);

    console.log(`Section created: ${name} by ${req.user.email}`);
    res.status(201).json(section);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// PUT update section (admin only)
router.put('/:id', isAdmin, [
  param('id').isInt().withMessage('Invalid section ID'),
  ...validateSection
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, display_order } = req.body;

    const existingSection = Section.findById(id);
    if (!existingSection) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const section = Section.update(id, name, display_order);

    console.log(`Section updated: ${name} by ${req.user.email}`);
    res.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// DELETE section (admin only)
router.delete('/:id', isAdmin, [
  param('id').isInt().withMessage('Invalid section ID')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const existingSection = Section.findById(id);
    if (!existingSection) {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (existingSection.is_default) {
      return res.status(400).json({ error: 'Cannot delete the default section' });
    }

    Section.delete(id);

    console.log(`Section deleted: ${existingSection.name} by ${req.user.email}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: error.message || 'Failed to delete section' });
  }
});

// PUT reorder sections (admin only)
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

    Section.updateOrder(updates);

    console.log(`Sections reordered by ${req.user.email}`);
    res.json({ message: 'Sections reordered successfully' });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

module.exports = router;
