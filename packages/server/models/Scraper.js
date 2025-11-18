const db = require('../config/database');

class Scraper {
  static getAll() {
    return db.prepare('SELECT * FROM scrapers ORDER BY id ASC').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM scrapers WHERE id = ?').get(id);
  }

  static create(name, url, calendarId, cronSchedule = '0 6 * * *') {
    const stmt = db.prepare(`
      INSERT INTO scrapers (name, url, calendar_id, cron_schedule, enabled)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(name, url, calendarId, cronSchedule);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, name, url, calendarId, cronSchedule, enabled) {
    const stmt = db.prepare(`
      UPDATE scrapers
      SET name = ?, url = ?, calendar_id = ?, cron_schedule = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, url, calendarId, cronSchedule, enabled, id);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM scrapers WHERE id = ?');
    return stmt.run(id);
  }

  static updateLastRun(id) {
    const stmt = db.prepare(`
      UPDATE scrapers
      SET last_run = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  }

  static getEnabled() {
    return db.prepare('SELECT * FROM scrapers WHERE enabled = 1').all();
  }
}

module.exports = Scraper;
