const express = require('express');
const { body, param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const router = express.Router();
const Note = require('../models/Note');
const { isAuthenticated } = require('../middleware/auth');

// HTML sanitization configuration
const sanitizeOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'a',
    'span',
    'input',
    'label',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['class'],
    li: ['data-type', 'data-checked'],
    ul: ['data-type'],
    input: ['type', 'checked'],
  },
  allowedClasses: {
    span: ['formatted-date'],
  },
  // Only allow specific input types (checkboxes for task lists)
  transformTags: {
    input: (tagName, attribs) => {
      if (attribs.type === 'checkbox') {
        return {
          tagName: 'input',
          attribs: {
            type: 'checkbox',
            ...(attribs.checked && { checked: 'checked' }),
          },
        };
      }
      return { tagName: '', attribs: {} }; // Remove non-checkbox inputs
    },
  },
};

// Helper to sanitize HTML message
function sanitizeMessage(html) {
  return sanitizeHtml(html, sanitizeOptions);
}

// Helper to count visible characters (strip HTML tags)
function countVisibleChars(html) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return text.length;
}

// Validation middleware
const validateNote = [
  body('sectionId').isInt({ min: 1 }).withMessage('Section ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('message')
    .isString()
    .custom((value) => {
      const visibleChars = countVisibleChars(value);
      return visibleChars >= 1 && visibleChars <= 5000;
    })
    .withMessage(
      'Message is required and must be less than 5000 visible characters'
    ),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('color')
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
];

const validateNoteUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('message')
    .optional()
    .isString()
    .custom((value) => {
      const visibleChars = countVisibleChars(value);
      return visibleChars >= 1 && visibleChars <= 5000;
    })
    .withMessage('Message must be less than 5000 visible characters'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
];

// GET all notes (requires authentication)
router.get('/', isAuthenticated, (req, res) => {
  try {
    const notes = Note.findAll();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET notes for specific section (requires authentication)
router.get(
  '/section/:sectionId',
  isAuthenticated,
  [param('sectionId').isInt().withMessage('Invalid section ID')],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sectionId } = req.params;
      const notes = Note.findBySection(sectionId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching notes for section:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  }
);

// POST create note (requires authentication)
router.post('/', isAuthenticated, validateNote, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectionId, title, message, dueDate, color } = req.body;

    // Sanitize HTML message to prevent XSS
    const sanitizedMessage = sanitizeMessage(message);

    // Extract author info from authenticated user
    const authorEmail = req.user.email;
    const authorName = req.user.name || req.user.email;

    const note = Note.create({
      sectionId,
      title,
      message: sanitizedMessage,
      authorEmail,
      authorName,
      dueDate: dueDate || null,
      color,
    });

    console.log(`Note created: "${title}" by ${authorEmail}`);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT update note (requires authentication)
router.put(
  '/:id',
  isAuthenticated,
  [param('id').isInt().withMessage('Invalid note ID'), ...validateNoteUpdate],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, message, dueDate, color } = req.body;

      const existingNote = Note.findById(id);
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Sanitize HTML message if provided
      const sanitizedMessage = message ? sanitizeMessage(message) : undefined;

      const note = Note.update(id, {
        title,
        message: sanitizedMessage,
        dueDate: dueDate || null,
        color,
      });

      console.log(`Note updated: "${note.title}" by ${req.user.email}`);
      res.json(note);
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ error: 'Failed to update note' });
    }
  }
);

// PUT reorder notes (requires authentication)
router.put('/reorder/bulk', isAuthenticated, (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    // Validate each update has id, sectionId, and displayOrder
    for (const update of updates) {
      if (
        !update.id ||
        !update.sectionId ||
        typeof update.displayOrder !== 'number'
      ) {
        return res.status(400).json({
          error: 'Each update must have id, sectionId, and displayOrder',
        });
      }
    }

    Note.reorderBatch(updates);

    console.log(`Notes reordered by ${req.user.email}`);
    res.json({ message: 'Notes reordered successfully' });
  } catch (error) {
    console.error('Error reordering notes:', error);
    res.status(500).json({ error: 'Failed to reorder notes' });
  }
});

// DELETE note (requires authentication)
router.delete(
  '/:id',
  isAuthenticated,
  [param('id').isInt().withMessage('Invalid note ID')],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      const existingNote = Note.findById(id);
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      Note.delete(id);

      console.log(`Note deleted: "${existingNote.title}" by ${req.user.email}`);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  }
);

module.exports = router;
