const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initiate Google OAuth flow
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/failure'
  }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect('/');
  }
);

// Auth failure route
router.get('/failure', (req, res) => {
  res.status(403).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Access Denied</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #1a1a1a;
          color: #fff;
        }
        .container {
          text-align: center;
          border: 5px solid #ff0000;
          padding: 40px;
          max-width: 500px;
        }
        h1 {
          color: #ff0000;
          text-transform: uppercase;
          font-size: 2.5rem;
          margin: 0 0 20px 0;
        }
        p {
          font-size: 1.2rem;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Access Denied</h1>
        <p>You are not authorized to access this application.</p>
        <p>Please contact your administrator to request access.</p>
      </div>
    </body>
    </html>
  `);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

// Get current user info
router.get('/user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    // Return user data without sensitive information
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;
