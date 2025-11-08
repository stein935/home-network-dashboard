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

  // Create services table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_services_order ON services(display_order);
  `);

  // Check if services table is empty and seed with default services
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get();

  if (serviceCount.count === 0) {
    console.log('Seeding default services...');
    const insertService = db.prepare(`
      INSERT INTO services (name, url, icon, display_order)
      VALUES (?, ?, ?, ?)
    `);

    const services = [
      { name: 'Router Admin', url: 'http://192.168.1.1', icon: 'Router', displayOrder: 1 },
      { name: 'Pi-hole Admin', url: 'http://pi.hole/admin', icon: 'Shield', displayOrder: 2 },
      { name: 'Network Monitor', url: 'http://192.168.1.100:8080', icon: 'Activity', displayOrder: 3 }
    ];

    const insertMany = db.transaction((services) => {
      for (const service of services) {
        insertService.run(service.name, service.url, service.icon, service.displayOrder);
      }
    });

    insertMany(services);
  }

  console.log('Database initialized successfully');
}

module.exports = initializeDatabase;
