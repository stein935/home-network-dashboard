const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Get database path from environment or use default
// Since .env is loaded from project root, resolve paths relative to project root
const projectRoot = path.resolve(__dirname, '../../..');
const rawPath = process.env.DATABASE_PATH || './data/database.db';
const dbPath = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(projectRoot, rawPath);

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Export database instance
module.exports = db;
