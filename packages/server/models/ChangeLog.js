const db = require('../config/database');

class ChangeLog {
  static create({
    userId,
    userEmail,
    userName,
    actionType,
    entityType,
    entityId,
    entityName,
    details,
  }) {
    const stmt = db.prepare(`
      INSERT INTO change_logs (user_id, user_email, user_name, action_type, entity_type, entity_id, entity_name, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId,
      userEmail,
      userName,
      actionType,
      entityType,
      entityId,
      entityName,
      details ? JSON.stringify(details) : null
    );
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    return db.prepare('SELECT * FROM change_logs WHERE id = ?').get(id);
  }

  static findAll(limit = 100, offset = 0) {
    return db
      .prepare(
        'SELECT * FROM change_logs ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(limit, offset);
  }

  static count() {
    const result = db
      .prepare('SELECT COUNT(*) as count FROM change_logs')
      .get();
    return result.count;
  }

  static findByUser(userId, limit = 100, offset = 0) {
    return db
      .prepare(
        'SELECT * FROM change_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(userId, limit, offset);
  }

  static findByEntity(entityType, entityId, limit = 100, offset = 0) {
    return db
      .prepare(
        'SELECT * FROM change_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(entityType, entityId, limit, offset);
  }

  static findByDateRange(startDate, endDate, limit = 100, offset = 0) {
    return db
      .prepare(
        'SELECT * FROM change_logs WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(startDate, endDate, limit, offset);
  }

  static deleteOlderThan(days) {
    const stmt = db.prepare(`
      DELETE FROM change_logs
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `);
    const result = stmt.run(days);
    return result.changes;
  }

  static deleteAll() {
    const stmt = db.prepare('DELETE FROM change_logs');
    const result = stmt.run();
    return result.changes;
  }
}

module.exports = ChangeLog;
