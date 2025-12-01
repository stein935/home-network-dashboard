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
const getDataRoutes = require('./routes/getData');

// Import scheduler
const scheduler = require('./services/scheduler');

// Initialize database
initializeDatabase();

// Setup Passport
setupPassport();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3030;

// Trust Cloudflare proxy in production for correct client IPs and HTTPS detection
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

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
// Use SESSION_DB_PATH env var if provided, otherwise use default paths
const sessionDbPath = process.env.SESSION_DB_PATH
  ? process.env.SESSION_DB_PATH
  : process.env.NODE_ENV === 'production'
    ? '/app/data/sessions.db'
    : path.join(projectRoot, 'data', 'sessions.db');

const sessionDbDir = path.dirname(sessionDbPath);
const sessionDbFile = path.basename(sessionDbPath);

app.use(
  session({
    store: new SQLiteStore({
      db: sessionDbFile,
      dir: sessionDbDir,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset session expiration on each request (sliding window)
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Enable secure cookies over HTTPS in production
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days of inactivity
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
app.use('/api/get-data', getDataRoutes);

// Initialize scheduler after database and routes are set up
scheduler.initialize().catch((err) => {
  console.error('Failed to initialize scheduler:', err);
});

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
