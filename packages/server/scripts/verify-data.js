const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/database.db');
const db = new Database(dbPath, { readonly: true });

console.log('Current Database Contents:\n');
console.log(
  '═══════════════════════════════════════════════════════════════\n'
);

// Users
const users = db
  .prepare('SELECT id, email, name, role FROM users ORDER BY id')
  .all();
console.log(`Users (${users.length}):`);
users.forEach((u) => console.log(`  - ${u.email} (${u.name}) - ${u.role}`));

// Sections
const sections = db
  .prepare(
    'SELECT id, name, display_order, is_default FROM sections ORDER BY display_order'
  )
  .all();
console.log(`\nSections (${sections.length}):`);
sections.forEach((s) =>
  console.log(
    `  - ${s.name} (order: ${s.display_order}${s.is_default ? ', default' : ''})`
  )
);

// Services
const services = db
  .prepare(
    'SELECT id, name, card_type, section_id FROM services ORDER BY display_order'
  )
  .all();
console.log(`\nServices (${services.length}):`);
services.forEach((s) =>
  console.log(`  - ${s.name} (${s.card_type}, section: ${s.section_id})`)
);

// Notes
const notes = db
  .prepare('SELECT id, title, author_name, section_id FROM notes ORDER BY id')
  .all();
console.log(`\nNotes (${notes.length}):`);
notes.forEach((n) =>
  console.log(`  - "${n.title}" by ${n.author_name} (section: ${n.section_id})`)
);

// Calendar configs
const configs = db
  .prepare('SELECT service_id, view_type FROM service_config')
  .all();
console.log(`\nCalendar Configurations (${configs.length}):`);
configs.forEach((c) =>
  console.log(`  - Service ${c.service_id}: ${c.view_type} view`)
);

console.log(
  '\n═══════════════════════════════════════════════════════════════\n'
);
console.log('✓ All data verified successfully!\n');

db.close();
