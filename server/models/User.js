const db = require('../config/database');

class User {
  static findByGoogleId(googleId) {
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
  }

  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static getAll() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }

  static create(googleId, email, name, role = 'readonly') {
    const stmt = db.prepare(`
      INSERT INTO users (google_id, email, name, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(googleId, email, name, role);
    return this.findById(result.lastInsertRowid);
  }

  static updateLastLogin(id) {
    const stmt = db.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return stmt.run(id);
  }

  static updateRole(id, role) {
    const stmt = db.prepare(`
      UPDATE users SET role = ? WHERE id = ?
    `);
    return stmt.run(role, id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = User;
