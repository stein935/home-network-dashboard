const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const helmet = require('helmet');
const cors = require('cors');

// Import database initialization
const initializeDatabase = require('./models/init-db');

// Import passport configuration
const setupPassport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const sectionsRoutes = require('./routes/sections');
const usersRoutes = require('./routes/users');
const calendarRoutes = require('./routes/calendar');
const notesRoutes = require('./routes/notes');

// Initialize database
initializeDatabase();

// Setup Passport
setupPassport();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development; configure properly in production
  })
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const projectRoot = path.resolve(__dirname, '../..');
// Use absolute path for session DB in production, relative path for dev
const sessionDbDir =
  process.env.NODE_ENV === 'production'
    ? '/data'
    : path.join(projectRoot, 'data');
app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: sessionDbDir,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true only when using HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notes', notesRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`

║   Home Network Dashboard Server
║   Running on port ${PORT}                             
║   Environment: ${process.env.NODE_ENV || 'development'}

  `);
});
