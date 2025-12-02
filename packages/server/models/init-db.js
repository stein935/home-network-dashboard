const db = require('../config/database');

function initializeDatabase() {
  console.log('Initializing database...');

  // Check if users table needs migration for optional google_id and OAuth tokens
  const usersTableInfo = db.prepare('PRAGMA table_info(users)').all();
  const usersTableExists = usersTableInfo.length > 0;
  const googleIdColumn = usersTableInfo.find((col) => col.name === 'google_id');
  const googleIdIsNotNull = googleIdColumn && googleIdColumn.notnull === 1;
  const hasAccessToken = usersTableInfo.find(
    (col) => col.name === 'google_access_token'
  );
  const hasRefreshToken = usersTableInfo.find(
    (col) => col.name === 'google_refresh_token'
  );

  if (usersTableExists && googleIdIsNotNull) {
    // Migrate existing users table to make google_id optional
    console.log('Migrating users table to make google_id optional...');

    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'readonly')),
        google_access_token TEXT,
        google_refresh_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Copy existing data
    const existingUsers = db.prepare('SELECT * FROM users').all();
    if (existingUsers.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO users_new (id, google_id, email, name, role, google_access_token, google_refresh_token, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const migrate = db.transaction(() => {
        for (const user of existingUsers) {
          insertStmt.run(
            user.id,
            user.google_id,
            user.email,
            user.name,
            user.role,
            user.google_access_token || null,
            user.google_refresh_token || null,
            user.created_at,
            user.last_login
          );
        }
      });
      migrate();
    }

    db.exec('DROP TABLE users');
    db.exec('ALTER TABLE users_new RENAME TO users');
    console.log('Users table migration complete');
  } else if (usersTableExists && (!hasAccessToken || !hasRefreshToken)) {
    // Add OAuth token columns to existing table
    console.log('Adding OAuth token columns to users table...');
    if (!hasAccessToken) {
      db.exec('ALTER TABLE users ADD COLUMN google_access_token TEXT');
    }
    if (!hasRefreshToken) {
      db.exec('ALTER TABLE users ADD COLUMN google_refresh_token TEXT');
    }
    console.log('OAuth token columns added');
  } else {
    // Create users table with optional google_id and OAuth tokens
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'readonly')),
        google_access_token TEXT,
        google_refresh_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);
  }

  // Check if sections table needs migration for is_collapsed_by_default
  const sectionsTableInfo = db.prepare('PRAGMA table_info(sections)').all();
  const sectionsTableExists = sectionsTableInfo.length > 0;
  const hasCollapsedDefault = sectionsTableInfo.find(
    (col) => col.name === 'is_collapsed_by_default'
  );

  if (sectionsTableExists && !hasCollapsedDefault) {
    // Add is_collapsed_by_default column to existing table
    console.log('Adding is_collapsed_by_default column to sections table...');
    db.exec(
      'ALTER TABLE sections ADD COLUMN is_collapsed_by_default BOOLEAN NOT NULL DEFAULT 0'
    );
    console.log('is_collapsed_by_default column added');
  } else if (!sectionsTableExists) {
    // Create sections table with is_collapsed_by_default
    db.exec(`
      CREATE TABLE sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT 0,
        is_collapsed_by_default BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else {
    // Table exists with column, ensure it exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT 0,
        is_collapsed_by_default BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Check if we need to migrate services table
  const tableInfo = db.prepare('PRAGMA table_info(services)').all();
  const servicesTableExists = tableInfo.length > 0;
  const hasSectionId = tableInfo.some((col) => col.name === 'section_id');
  const hasCardType = tableInfo.some((col) => col.name === 'card_type');

  if (servicesTableExists && !hasSectionId) {
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
        card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link', 'calendar')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
      )
    `);

    // Ensure default section exists
    const defaultSection = db
      .prepare('SELECT id FROM sections WHERE is_default = 1')
      .get();
    if (!defaultSection) {
      db.prepare(
        'INSERT INTO sections (name, display_order, is_default) VALUES (?, ?, ?)'
      ).run('Default', 1, 1);
    }
    const defaultSectionId = db
      .prepare('SELECT id FROM sections WHERE is_default = 1')
      .get().id;

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
  } else if (servicesTableExists && !hasCardType) {
    // Services table has section_id but not card_type - add it
    console.log('Adding card_type column to services table...');
    db.exec(
      `ALTER TABLE services ADD COLUMN card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link', 'calendar'))`
    );
    console.log('card_type column added');
  } else if (!servicesTableExists) {
    // No services table exists - create it from scratch
    db.exec(`
      CREATE TABLE services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link', 'calendar')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
      )
    `);
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
        card_type TEXT NOT NULL DEFAULT 'link' CHECK(card_type IN ('link', 'calendar')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections(id)
      )
    `);
  }

  // Create service_config table for calendar-specific configuration
  // Check if we need to migrate service_config table to add 'fiveday' view type
  const configTableInfo = db.prepare('PRAGMA table_info(service_config)').all();
  const configTableExists = configTableInfo.length > 0;

  // Check if fiveday migration has already been done by checking the view_type constraint
  let needsFivedayMigration = false;
  if (configTableExists) {
    const tableSchema = db
      .prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='service_config'"
      )
      .get();
    // Check if the constraint includes 'fiveday'
    needsFivedayMigration =
      tableSchema && !tableSchema.sql.includes("'fiveday'");
  }

  if (configTableExists && needsFivedayMigration) {
    // Only migrate if fiveday is not already supported
    console.log(
      'Migrating service_config table to support fiveday view type...'
    );

    // Check if calendar_ids column exists in old table
    const hasCalendarIdsInOldTable = configTableInfo.find(
      (col) => col.name === 'calendar_ids'
    );

    // Create new table with updated constraint including calendar_ids if it exists
    if (hasCalendarIdsInOldTable) {
      db.exec(`
        CREATE TABLE service_config_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER NOT NULL UNIQUE,
          calendar_id TEXT,
          calendar_ids TEXT,
          view_type TEXT CHECK(view_type IN ('day', 'week', 'fiveday', 'month')) DEFAULT 'week',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )
      `);
    } else {
      db.exec(`
        CREATE TABLE service_config_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER NOT NULL UNIQUE,
          calendar_id TEXT,
          view_type TEXT CHECK(view_type IN ('day', 'week', 'fiveday', 'month')) DEFAULT 'week',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )
      `);
    }

    // Copy data from old table
    const existingConfigs = db.prepare('SELECT * FROM service_config').all();
    if (existingConfigs.length > 0) {
      if (hasCalendarIdsInOldTable) {
        const insertStmt = db.prepare(`
          INSERT INTO service_config_new (id, service_id, calendar_id, calendar_ids, view_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const config of existingConfigs) {
          insertStmt.run(
            config.id,
            config.service_id,
            config.calendar_id,
            config.calendar_ids,
            config.view_type,
            config.created_at,
            config.updated_at
          );
        }
      } else {
        const insertStmt = db.prepare(`
          INSERT INTO service_config_new (id, service_id, calendar_id, view_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const config of existingConfigs) {
          insertStmt.run(
            config.id,
            config.service_id,
            config.calendar_id,
            config.view_type,
            config.created_at,
            config.updated_at
          );
        }
      }
    }

    // Drop old table and rename new one
    db.exec('DROP TABLE service_config');
    db.exec('ALTER TABLE service_config_new RENAME TO service_config');

    console.log('service_config migration complete');
  } else if (!configTableExists) {
    // Create fresh table with fiveday support (only if table doesn't exist)
    db.exec(`
      CREATE TABLE service_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL UNIQUE,
        calendar_id TEXT,
        view_type TEXT CHECK(view_type IN ('day', 'week', 'fiveday', 'month')) DEFAULT 'week',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);
  }

  // Re-query table info after fiveday migration (table may have been recreated)
  const updatedConfigTableInfo = db
    .prepare('PRAGMA table_info(service_config)')
    .all();
  const updatedConfigTableExists = updatedConfigTableInfo.length > 0;

  // Check if we need to add calendar_ids column for multi-calendar support
  const hasCalendarIds = updatedConfigTableInfo.find(
    (col) => col.name === 'calendar_ids'
  );

  if (updatedConfigTableExists && !hasCalendarIds) {
    console.log(
      'Adding calendar_ids column to service_config for multi-calendar support...'
    );

    // Add new column
    db.exec('ALTER TABLE service_config ADD COLUMN calendar_ids TEXT');

    // Migrate existing single calendar_id to array format
    const configs = db
      .prepare('SELECT id, calendar_id FROM service_config')
      .all();
    if (configs.length > 0) {
      const updateStmt = db.prepare(
        'UPDATE service_config SET calendar_ids = ? WHERE id = ?'
      );

      const migrateConfigs = db.transaction(() => {
        for (const config of configs) {
          if (config.calendar_id) {
            // Convert single calendar_id to JSON array with one element
            updateStmt.run(JSON.stringify([config.calendar_id]), config.id);
          }
        }
      });
      migrateConfigs();
    }

    console.log(
      'Multi-calendar migration complete. Note: calendar_id column kept for rollback safety.'
    );
  }

  // Create notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      author_email TEXT NOT NULL,
      author_name TEXT NOT NULL,
      due_date TEXT,
      color TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      width INTEGER NOT NULL DEFAULT 1 CHECK(width >= 1 AND width <= 4),
      height INTEGER NOT NULL DEFAULT 1 CHECK(height >= 1 AND height <= 3),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    )
  `);

  // Check if notes table needs migration for width and height columns
  const notesTableInfo = db.prepare('PRAGMA table_info(notes)').all();
  const notesTableExists = notesTableInfo.length > 0;
  const hasWidth = notesTableInfo.find((col) => col.name === 'width');
  const hasHeight = notesTableInfo.find((col) => col.name === 'height');

  if (notesTableExists && (!hasWidth || !hasHeight)) {
    console.log('Adding width and height columns to notes table...');
    if (!hasWidth) {
      db.exec(
        'ALTER TABLE notes ADD COLUMN width INTEGER NOT NULL DEFAULT 1 CHECK(width >= 1 AND width <= 4)'
      );
    }
    if (!hasHeight) {
      db.exec(
        'ALTER TABLE notes ADD COLUMN height INTEGER NOT NULL DEFAULT 1 CHECK(height >= 1 AND height <= 3)'
      );
    }
    console.log('Width and height columns added to notes table');
  }

  // Check if we need to migrate scrapers table to data_functions
  const scrapersTableInfo = db.prepare('PRAGMA table_info(scrapers)').all();
  const scrapersTableExists = scrapersTableInfo.length > 0;
  const hasFunctionKey = scrapersTableInfo.find(
    (col) => col.name === 'function_key'
  );

  // Check if data_functions table already exists (migration already done)
  const dataFunctionsTableInfo = db
    .prepare('PRAGMA table_info(data_functions)')
    .all();
  const dataFunctionsTableExists = dataFunctionsTableInfo.length > 0;

  if (scrapersTableExists && !hasFunctionKey && !dataFunctionsTableExists) {
    // Migrate scrapers to data_functions
    console.log('Migrating scrapers table to data_functions...');

    // Create new data_functions table (remove url, add function_key)
    db.exec(`
      CREATE TABLE data_functions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        function_key TEXT UNIQUE NOT NULL,
        calendar_id TEXT NOT NULL,
        cron_schedule TEXT NOT NULL DEFAULT '0 6 * * *',
        enabled BOOLEAN NOT NULL DEFAULT 1,
        last_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Copy existing data (generate function_key from name)
    const existingScrapers = db.prepare('SELECT * FROM scrapers').all();
    if (existingScrapers.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO data_functions (id, name, function_key, calendar_id, cron_schedule, enabled, last_run, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const migrate = db.transaction(() => {
        for (const scraper of existingScrapers) {
          // Generate function_key from name (lowercase, replace spaces with hyphens)
          const functionKey = scraper.name.toLowerCase().replace(/\s+/g, '-');
          insertStmt.run(
            scraper.id,
            scraper.name,
            functionKey,
            scraper.calendar_id,
            scraper.cron_schedule,
            scraper.enabled,
            scraper.last_run,
            scraper.created_at,
            scraper.updated_at
          );
        }
      });
      migrate();
    }

    // Migrate scraper_logs to data_function_logs
    console.log('Migrating scraper_logs to data_function_logs...');

    db.exec(`
      CREATE TABLE data_function_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        function_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('success', 'error')),
        message TEXT,
        events_created INTEGER DEFAULT 0,
        events_updated INTEGER DEFAULT 0,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (function_id) REFERENCES data_functions(id) ON DELETE CASCADE
      )
    `);

    // Copy existing logs
    const existingLogs = db.prepare('SELECT * FROM scraper_logs').all();
    if (existingLogs.length > 0) {
      const insertLogStmt = db.prepare(`
        INSERT INTO data_function_logs (id, function_id, status, message, events_created, events_updated, run_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const migrateLogs = db.transaction(() => {
        for (const log of existingLogs) {
          insertLogStmt.run(
            log.id,
            log.scraper_id,
            log.status,
            log.message,
            log.events_created,
            log.events_updated,
            log.run_at
          );
        }
      });
      migrateLogs();
    }

    // Drop old tables
    db.exec('DROP TABLE scraper_logs');
    db.exec('DROP TABLE scrapers');

    console.log('Migration to data_functions complete');
  } else if (!dataFunctionsTableExists) {
    // Create fresh data_functions table
    db.exec(`
      CREATE TABLE data_functions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        function_key TEXT UNIQUE NOT NULL,
        calendar_id TEXT NOT NULL,
        cron_schedule TEXT NOT NULL DEFAULT '0 6 * * *',
        enabled BOOLEAN NOT NULL DEFAULT 1,
        last_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create fresh data_function_logs table
    db.exec(`
      CREATE TABLE data_function_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        function_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('success', 'error')),
        message TEXT,
        events_created INTEGER DEFAULT 0,
        events_updated INTEGER DEFAULT 0,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (function_id) REFERENCES data_functions(id) ON DELETE CASCADE
      )
    `);
  }

  // Seed Marcy Lunches data function if not exists
  const marcyLunchesExists = db
    .prepare(
      "SELECT id FROM data_functions WHERE function_key = 'marcy-lunches'"
    )
    .get();

  if (!marcyLunchesExists) {
    console.log('Seeding Marcy Lunches data function...');
    db.prepare(
      `
      INSERT INTO data_functions (name, function_key, calendar_id, cron_schedule, enabled)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      'Marcy Lunches',
      'marcy-lunches',
      'marcylunches@gmail.com',
      '0 6 * * *',
      1
    );
    console.log('Marcy Lunches data function seeded');
  }

  // Create change_logs table for audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('create', 'update', 'delete', 'trigger')),
      entity_type TEXT NOT NULL CHECK(entity_type IN ('service', 'section', 'note', 'user', 'data_function')),
      entity_id INTEGER,
      entity_name TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_services_order ON services(display_order);
    CREATE INDEX IF NOT EXISTS idx_services_section ON services(section_id);
    CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(display_order);
    CREATE INDEX IF NOT EXISTS idx_service_config_service ON service_config(service_id);
    CREATE INDEX IF NOT EXISTS idx_notes_section ON notes(section_id);
    CREATE INDEX IF NOT EXISTS idx_notes_order ON notes(section_id, display_order);
    CREATE INDEX IF NOT EXISTS idx_data_function_logs_function ON data_function_logs(function_id);
    CREATE INDEX IF NOT EXISTS idx_data_function_logs_run_at ON data_function_logs(run_at);
    CREATE INDEX IF NOT EXISTS idx_change_logs_created_at ON change_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON change_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_change_logs_action ON change_logs(action_type);
  `);

  // Ensure default section exists
  const sectionCount = db
    .prepare('SELECT COUNT(*) as count FROM sections')
    .get();
  if (sectionCount.count === 0) {
    console.log('Creating default section...');
    db.prepare(
      'INSERT INTO sections (name, display_order, is_default) VALUES (?, ?, ?)'
    ).run('Default', 1, 1);
  }

  // Get default section ID
  const defaultSection = db
    .prepare('SELECT id FROM sections WHERE is_default = 1')
    .get();
  const defaultSectionId = defaultSection ? defaultSection.id : 1;

  // Check if services table is empty and seed with default services
  const serviceCount = db
    .prepare('SELECT COUNT(*) as count FROM services')
    .get();

  if (serviceCount.count === 0) {
    console.log('Seeding default services...');
    const insertService = db.prepare(`
      INSERT INTO services (name, url, icon, display_order, section_id, card_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const services = [
      {
        name: 'Router Admin',
        url: 'http://192.168.1.1',
        icon: 'Router',
        displayOrder: 1,
        cardType: 'link',
      },
      {
        name: 'Pi-hole Admin',
        url: 'http://pi.hole/admin',
        icon: 'Shield',
        displayOrder: 2,
        cardType: 'link',
      },
      {
        name: 'Network Monitor',
        url: 'http://192.168.1.100:8080',
        icon: 'Activity',
        displayOrder: 3,
        cardType: 'link',
      },
    ];

    const insertMany = db.transaction((services) => {
      for (const service of services) {
        insertService.run(
          service.name,
          service.url,
          service.icon,
          service.displayOrder,
          defaultSectionId,
          service.cardType
        );
      }
    });

    insertMany(services);
  }

  console.log('Database initialized successfully');
}

module.exports = initializeDatabase;
