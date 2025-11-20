const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    accessType: 'offline',
    prompt: 'select_account',
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('[OAuth Callback] Received callback from Google');
    console.log('[OAuth Callback] Query params:', req.query);
    console.log('[OAuth Callback] Referer:', req.get('referer'));
    next();
  },
  passport.authenticate('google', {
    failureRedirect: '/auth/failure',
  }),
  (req, res) => {
    console.log('[OAuth Callback] Authentication successful');
    console.log('[OAuth Callback] User:', req.user?.email);

    // Successful authentication, redirect to dashboard
    if (process.env.NODE_ENV === 'production') {
      console.log('[OAuth Callback] Production mode - redirecting to /');
      return res.redirect('/');
    }

    // In development, use CLIENT_URL if set, otherwise detect from referer
    let redirectUrl = process.env.CLIENT_URL;

    if (!redirectUrl && req.get('referer')) {
      // Extract origin from referer (e.g., http://home-dashboard.local:5173/)
      const referer = new URL(req.get('referer'));

      // Ignore Google domains as referer (from OAuth flow)
      if (!referer.hostname.includes('google.com') && !referer.hostname.includes('accounts.google.com')) {
        redirectUrl = `${referer.protocol}//${referer.host}/`;
      }
    }

    // Final fallback to localhost
    redirectUrl = redirectUrl || 'http://localhost:5173/';

    console.log('[OAuth Callback] Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
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
      role: req.user.role,
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;
