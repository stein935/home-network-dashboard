#!/usr/bin/env node

/**
 * Clear Google OAuth tokens for all users
 * This forces users to re-authenticate and obtain refresh tokens
 *
 * Usage:
 *   Development: node packages/server/scripts/clear-tokens.js
 *   Production: docker exec home-network-dashboard node packages/server/scripts/clear-tokens.js
 */

const path = require('path');
const Database = require('better-sqlite3');

// Determine database path based on environment
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction
  ? path.join(__dirname, '../../../data/production.db')
  : path.join(__dirname, '../../../data/database.db');

console.log(`\nClearing OAuth tokens for all users...`);
console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Database: ${dbPath}\n`);

try {
  const db = new Database(dbPath);

  // Get count of users before clearing
  const beforeCount = db
    .prepare(
      'SELECT COUNT(*) as count FROM users WHERE google_access_token IS NOT NULL OR google_refresh_token IS NOT NULL'
    )
    .get();

  console.log(`Users with tokens before: ${beforeCount.count}`);

  // Clear all tokens
  const result = db
    .prepare(
      'UPDATE users SET google_access_token = NULL, google_refresh_token = NULL'
    )
    .run();

  console.log(`Updated ${result.changes} user(s)`);

  // Verify tokens are cleared
  const afterCount = db
    .prepare(
      'SELECT COUNT(*) as count FROM users WHERE google_access_token IS NOT NULL OR google_refresh_token IS NOT NULL'
    )
    .get();

  console.log(`Users with tokens after: ${afterCount.count}`);

  // List all users
  const users = db.prepare('SELECT email, role FROM users').all();
  console.log('\nAffected users:');
  users.forEach((user) => {
    console.log(`  - ${user.email} (${user.role})`);
  });

  console.log(
    '\n✓ Success! Users will need to log out and log back in to re-authenticate.'
  );
  console.log('  They will receive a new access token and refresh token.\n');

  db.close();
  process.exit(0);
} catch (error) {
  console.error('\n✗ Error clearing tokens:', error.message);
  console.error(error);
  process.exit(1);
}
