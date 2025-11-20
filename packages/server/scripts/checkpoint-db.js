const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../data/database.db');
const backupDir = path.join(__dirname, '../../../data/backups');

console.log(
  '\n╔═══════════════════════════════════════════════════════════════╗'
);
console.log(
  '║   Pre-Deployment Database Checkpoint & Backup                 ║'
);
console.log(
  '╚═══════════════════════════════════════════════════════════════╝\n'
);

try {
  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  Database does not exist yet. Skipping checkpoint.');
    process.exit(0);
  }

  // Open database
  console.log('Opening database...');
  const db = new Database(dbPath);

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Create timestamped backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `database-${timestamp}.db`);

  console.log('Creating backup...');
  db.backup(backupPath)
    .then(() => {
      console.log(
        `✓ Backup created: ${path.relative(process.cwd(), backupPath)}`
      );

      // Perform checkpoint to commit WAL files
      console.log('\nPerforming database checkpoint...');
      db.pragma('wal_checkpoint(TRUNCATE)');
      console.log('✓ WAL checkpoint completed (all writes committed)');

      // Verify database integrity
      console.log('\nVerifying database integrity...');
      const integrityCheck = db.pragma('integrity_check');
      if (integrityCheck[0].integrity_check === 'ok') {
        console.log('✓ Database integrity verified');
      } else {
        console.error('✗ Database integrity check failed:', integrityCheck);
        process.exit(1);
      }

      // Get database stats
      const stats = db.prepare('SELECT COUNT(*) as count FROM users').get();
      console.log(`\nDatabase stats: ${stats.count} users`);

      // Close database
      db.close();
      console.log('\n✓ Database safely prepared for deployment\n');

      // Clean up old backups (keep last 10)
      const backups = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('database-') && f.endsWith('.db'))
        .sort()
        .reverse();

      if (backups.length > 10) {
        console.log('Cleaning up old backups...');
        const toDelete = backups.slice(10);
        toDelete.forEach((backup) => {
          fs.unlinkSync(path.join(backupDir, backup));
          console.log(`  Deleted: ${backup}`);
        });
        console.log(
          `✓ Kept ${Math.min(backups.length, 10)} most recent backups\n`
        );
      }
    })
    .catch((err) => {
      console.error('✗ Backup failed:', err.message);
      db.close();
      process.exit(1);
    });
} catch (error) {
  console.error('\n✗ Error during checkpoint:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
