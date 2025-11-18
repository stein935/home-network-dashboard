const db = require('../config/database');

class ScraperLog {
  static getAllForScraper(scraperId) {
    return db
      .prepare(
        'SELECT * FROM scraper_logs WHERE scraper_id = ? ORDER BY run_at DESC'
      )
      .all(scraperId);
  }

  static getRecent(scraperId, limit = 10) {
    return db
      .prepare(
        'SELECT * FROM scraper_logs WHERE scraper_id = ? ORDER BY run_at DESC LIMIT ?'
      )
      .all(scraperId, limit);
  }

  static create(
    scraperId,
    status,
    message = null,
    eventsCreated = 0,
    eventsUpdated = 0
  ) {
    const stmt = db.prepare(`
      INSERT INTO scraper_logs (scraper_id, status, message, events_created, events_updated)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      scraperId,
      status,
      message,
      eventsCreated,
      eventsUpdated
    );
    return result.lastInsertRowid;
  }

  static deleteOlderThan(days = 30) {
    const stmt = db.prepare(`
      DELETE FROM scraper_logs
      WHERE run_at < datetime('now', '-' || ? || ' days')
    `);
    return stmt.run(days);
  }
}

module.exports = ScraperLog;
