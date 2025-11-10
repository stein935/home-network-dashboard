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

  static create(email, name = null, role = 'readonly', googleId = null) {
    const stmt = db.prepare(`
      INSERT INTO users (email, name, role, google_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(email, name, role, googleId);
    return this.findById(result.lastInsertRowid);
  }

  static updateGoogleId(id, googleId) {
    const stmt = db.prepare(`
      UPDATE users SET google_id = ? WHERE id = ?
    `);
    return stmt.run(googleId, id);
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
