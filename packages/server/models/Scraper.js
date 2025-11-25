const db = require('../config/database');

/**
 * Data Function Model (formerly Scraper)
 * Manages data functions that fetch data from external APIs
 * and create Google Calendar events.
 *
 * Note: This model works with the data_functions table.
 * For backward compatibility, the class name remains "Scraper"
 * but all operations use the data_functions table.
 */
class Scraper {
  static getAll() {
    return db.prepare('SELECT * FROM data_functions ORDER BY id ASC').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM data_functions WHERE id = ?').get(id);
  }

  static findByFunctionKey(functionKey) {
    return db
      .prepare('SELECT * FROM data_functions WHERE function_key = ?')
      .get(functionKey);
  }

  static create(name, functionKey, calendarId, cronSchedule = '0 6 * * *') {
    const stmt = db.prepare(`
      INSERT INTO data_functions (name, function_key, calendar_id, cron_schedule, enabled)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(name, functionKey, calendarId, cronSchedule);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, name, functionKey, calendarId, cronSchedule, enabled) {
    const stmt = db.prepare(`
      UPDATE data_functions
      SET name = ?, function_key = ?, calendar_id = ?, cron_schedule = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, functionKey, calendarId, cronSchedule, enabled, id);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM data_functions WHERE id = ?');
    return stmt.run(id);
  }

  static updateLastRun(id) {
    const stmt = db.prepare(`
      UPDATE data_functions
      SET last_run = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  }

  static getEnabled() {
    return db.prepare('SELECT * FROM data_functions WHERE enabled = 1').all();
  }

  static toggleEnabled(id, enabled) {
    const stmt = db.prepare(`
      UPDATE data_functions
      SET enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(enabled ? 1 : 0, id);
    return this.findById(id);
  }
}

module.exports = Scraper;
