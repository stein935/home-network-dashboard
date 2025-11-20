const Database = require('better-sqlite3');
const path = require('path');

// Open backup database
const backupDbPath = path.join(__dirname, '../../../data/backup/database.db');
const currentDbPath = path.join(__dirname, '../../../data/database.db');

console.log('Attempting to recover data from backup database...\n');

try {
  // Try to open and read from backup database
  const backupDb = new Database(backupDbPath, { readonly: true });

  console.log('✓ Successfully opened backup database\n');

  // Check tables
  const tables = backupDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();
  console.log('Tables in backup:', tables.map((t) => t.name).join(', '));

  // Try to read data from each table
  const tablesToRecover = [
    'users',
    'sections',
    'services',
    'service_config',
    'notes',
  ];
  const recoveredData = {};

  for (const table of tablesToRecover) {
    try {
      const data = backupDb.prepare(`SELECT * FROM ${table}`).all();
      recoveredData[table] = data;
      console.log(`\n${table}: ${data.length} rows`);
      if (data.length > 0) {
        console.log('Sample:', JSON.stringify(data[0], null, 2));
      }
    } catch (err) {
      console.log(`\n${table}: Error reading - ${err.message}`);
    }
  }

  backupDb.close();

  // Now try to write to current database
  console.log('\n\n--- Attempting to restore data to current database ---\n');

  const currentDb = new Database(currentDbPath);

  // Restore users
  if (recoveredData.users && recoveredData.users.length > 0) {
    console.log('Restoring users...');
    const insertUser = currentDb.prepare(`
      INSERT OR REPLACE INTO users (id, google_id, email, name, role, google_access_token, google_refresh_token, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const user of recoveredData.users) {
      insertUser.run(
        user.id,
        user.google_id,
        user.email,
        user.name,
        user.role,
        user.google_access_token,
        user.google_refresh_token,
        user.created_at,
        user.last_login
      );
    }
    console.log(`✓ Restored ${recoveredData.users.length} users`);
  }

  // Restore sections
  if (recoveredData.sections && recoveredData.sections.length > 0) {
    console.log('Restoring sections...');
    const insertSection = currentDb.prepare(`
      INSERT OR REPLACE INTO sections (id, name, display_order, is_default, is_collapsed_by_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const section of recoveredData.sections) {
      insertSection.run(
        section.id,
        section.name,
        section.display_order,
        section.is_default,
        section.is_collapsed_by_default || 0,
        section.created_at,
        section.updated_at
      );
    }
    console.log(`✓ Restored ${recoveredData.sections.length} sections`);
  }

  // Restore services
  if (recoveredData.services && recoveredData.services.length > 0) {
    console.log('Restoring services...');
    const insertService = currentDb.prepare(`
      INSERT OR REPLACE INTO services (id, name, url, icon, display_order, section_id, card_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const service of recoveredData.services) {
      insertService.run(
        service.id,
        service.name,
        service.url,
        service.icon,
        service.display_order,
        service.section_id,
        service.card_type || 'link',
        service.created_at,
        service.updated_at
      );
    }
    console.log(`✓ Restored ${recoveredData.services.length} services`);
  }

  // Restore service_config
  if (recoveredData.service_config && recoveredData.service_config.length > 0) {
    console.log('Restoring service configurations...');
    const insertConfig = currentDb.prepare(`
      INSERT OR REPLACE INTO service_config (id, service_id, calendar_id, view_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const config of recoveredData.service_config) {
      insertConfig.run(
        config.id,
        config.service_id,
        config.calendar_id,
        config.view_type,
        config.created_at,
        config.updated_at
      );
    }
    console.log(
      `✓ Restored ${recoveredData.service_config.length} service configurations`
    );
  }

  // Restore notes
  if (recoveredData.notes && recoveredData.notes.length > 0) {
    console.log('Restoring notes...');
    const insertNote = currentDb.prepare(`
      INSERT OR REPLACE INTO notes (id, section_id, title, message, author_email, author_name, due_date, color, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const note of recoveredData.notes) {
      insertNote.run(
        note.id,
        note.section_id,
        note.title,
        note.message,
        note.author_email,
        note.author_name,
        note.due_date,
        note.color,
        note.display_order,
        note.created_at,
        note.updated_at
      );
    }
    console.log(`✓ Restored ${recoveredData.notes.length} notes`);
  }

  currentDb.close();

  console.log('\n✓ Data recovery complete!\n');
} catch (error) {
  console.error('\n✗ Error during recovery:', error.message);
  console.error('Stack:', error.stack);

  if (error.message.includes('SQLITE_CORRUPT')) {
    console.log('\nThe backup database is corrupted and cannot be read.');
    console.log(
      'Unfortunately, the data cannot be recovered from this backup.'
    );
  }
}
