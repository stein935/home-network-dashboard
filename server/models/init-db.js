const db = require('../config/database');

function initializeDatabase() {
  console.log('Initializing database...');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'readonly')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Create sections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if we need to migrate services table
  const tableInfo = db.prepare("PRAGMA table_info(services)").all();
  const hasSectionId = tableInfo.some(col => col.name === 'section_id');
  const hasCardType = tableInfo.some(col => col.name === 'card_type');

  if (!hasSectionId) {
    console.log('Migrating services table to add section_id...');

    // Create new services table with section_id
    db.exec(`
      CREATE TABLE IF NOT EXISTS services_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
      )
    `);

    // Ensure default section exists
    const defaultSection = db.prepare('SELECT id FROM sections WHERE is_default = 1').get();
    if (!defaultSection) {
      db.prepare('INSERT INTO sections (name, display_order, is_default) VALUES (?, ?, ?)').run('Default', 1, 1);
    }
    const defaultSectionId = db.prepare('SELECT id FROM sections WHERE is_default = 1').get().id;

    // Copy existing services to new table with default section
    const existingServices = db.prepare('SELECT * FROM services').all();
    if (existingServices.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO services_new (id, name, url, icon, display_order, section_id, card_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const migrate = db.transaction(() => {
        for (const service of existingServices) {
          insertStmt.run(
            service.id,
            service.name,
            service.url,
            service.icon,
            service.display_order,
            defaultSectionId,
            'link',
            service.created_at,
            service.updated_at
          );
        }
      });
      migrate();
    }

    // Drop old table and rename new one
    db.exec('DROP TABLE services');
    db.exec('ALTER TABLE services_new RENAME TO services');

    console.log('Migration complete');
  } else if (!hasCardType) {
    // Services table has section_id but not card_type - add it
    console.log('Adding card_type column to services table...');
    db.exec(`ALTER TABLE services ADD COLUMN card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link'))`);
    console.log('card_type column added');
  } else {
    // Services table already has both section_id and card_type, just ensure it exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
      )
    `);
  }

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_services_order ON services(display_order);
    CREATE INDEX IF NOT EXISTS idx_services_section ON services(section_id);
    CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(display_order);
  `);

  // Ensure default section exists
  const sectionCount = db.prepare('SELECT COUNT(*) as count FROM sections').get();
  if (sectionCount.count === 0) {
    console.log('Creating default section...');
    db.prepare('INSERT INTO sections (name, display_order, is_default) VALUES (?, ?, ?)').run('Default', 1, 1);
  }

  // Get default section ID
  const defaultSection = db.prepare('SELECT id FROM sections WHERE is_default = 1').get();
  const defaultSectionId = defaultSection ? defaultSection.id : 1;

  // Check if services table is empty and seed with default services
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get();

  if (serviceCount.count === 0) {
    console.log('Seeding default services...');
    const insertService = db.prepare(`
      INSERT INTO services (name, url, icon, display_order, section_id, card_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const services = [
      { name: 'Router Admin', url: 'http://192.168.1.1', icon: 'Router', displayOrder: 1, cardType: 'link' },
      { name: 'Pi-hole Admin', url: 'http://pi.hole/admin', icon: 'Shield', displayOrder: 2, cardType: 'link' },
      { name: 'Network Monitor', url: 'http://192.168.1.100:8080', icon: 'Activity', displayOrder: 3, cardType: 'link' }
    ];

    const insertMany = db.transaction((services) => {
      for (const service of services) {
        insertService.run(service.name, service.url, service.icon, service.displayOrder, defaultSectionId, service.cardType);
      }
    });

    insertMany(services);
  }

  console.log('Database initialized successfully');
}

module.exports = initializeDatabase;
