-- Database Schema for Home Network Dashboard

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin', 'readonly')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  section_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_services_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_section ON services(section_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(display_order);

-- Insert default section
INSERT OR IGNORE INTO sections (id, name, display_order, is_default) VALUES
  (1, 'Default', 1, 1);

-- Insert default services (optional seed data)
INSERT OR IGNORE INTO services (id, name, url, icon, display_order, section_id) VALUES
  (1, 'Router Admin', 'http://192.168.1.1', 'router', 1, 1),
  (2, 'Pi-hole Admin', 'http://pi.hole/admin', 'shield', 2, 1),
  (3, 'Network Monitor', 'http://192.168.1.100:8080', 'activity', 3, 1);

-- Note: First admin user must be added manually or via seed script
-- Example: INSERT INTO users (google_id, email, name, role) VALUES ('google_id_here', 'admin@example.com', 'Admin User', 'admin');
