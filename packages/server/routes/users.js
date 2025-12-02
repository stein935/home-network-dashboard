const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const isAdmin = require('../middleware/admin');
const { logChange } = require('../middleware/changeLogger');

// Validation middleware
const validateUser = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('role')
    .isIn(['admin', 'readonly'])
    .withMessage('Role must be admin or readonly'),
];

const validateNewUser = [...validateUser, body('name').optional().trim()];

// GET all users (admin only)
router.get('/', isAdmin, (req, res) => {
  try {
    const users = User.getAll();
    // Remove sensitive data before sending
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login,
    }));
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST add user to whitelist (admin only)
router.post(
  '/',
  isAdmin,
  validateNewUser,
  logChange({
    action: 'create',
    entity: 'user',
    getEntityInfo: (req, data) => ({
      id: data.id,
      name: data.email,
      newData: {
        email: data.email,
        name: data.name,
        role: data.role,
      },
    }),
  }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, role } = req.body;

      // Check if user already exists
      const existingUser = User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const user = User.create(email, name || null, role);

      console.log(
        `User added to whitelist: ${email} (${role}) by ${req.user.email}`
      );
      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'SQLITE_CONSTRAINT') {
        return res
          .status(409)
          .json({ error: 'User with this email already exists' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// PUT update user role (admin only)
router.put(
  '/:id',
  isAdmin,
  [
    param('id').isInt().withMessage('Invalid user ID'),
    body('role')
      .isIn(['admin', 'readonly'])
      .withMessage('Role must be admin or readonly'),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { role } = req.body;

      const existingUser = User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      User.updateRole(id, role);
      const updatedUser = User.findById(id);

      console.log(
        `User role updated: ${updatedUser.email} -> ${role} by ${req.user.email}`
      );
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// DELETE remove user from whitelist (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isInt().withMessage('Invalid user ID')],
  logChange({
    action: 'delete',
    entity: 'user',
    getBeforeState: async (req) => {
      const user = User.findById(req.params.id);
      return user
        ? {
            email: user.email,
            name: user.name,
            role: user.role,
          }
        : null;
    },
    getEntityInfo: (req, data, beforeState) => ({
      id: req.params.id,
      name: beforeState?.email || 'Unknown User',
    }),
  }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Prevent deleting yourself
      if (parseInt(id) === req.user.id) {
        return res
          .status(400)
          .json({ error: 'Cannot delete your own account' });
      }

      const existingUser = User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      User.delete(id);

      console.log(
        `User removed from whitelist: ${existingUser.email} by ${req.user.email}`
      );
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

module.exports = router;
