const db = require('../config/database');

/**
 * Data Function Log Model
 * Manages execution logs for data functions.
 *
 * This model works with the data_function_logs table.
 */
class DataFunctionLog {
  static getAllForFunction(functionId) {
    return db
      .prepare(
        'SELECT * FROM data_function_logs WHERE function_id = ? ORDER BY run_at DESC'
      )
      .all(functionId);
  }

  static getRecent(functionId, limit = 10) {
    return db
      .prepare(
        'SELECT * FROM data_function_logs WHERE function_id = ? ORDER BY run_at DESC LIMIT ?'
      )
      .all(functionId, limit);
  }

  static create(
    functionId,
    status,
    message = null,
    eventsCreated = 0,
    eventsUpdated = 0
  ) {
    const stmt = db.prepare(`
      INSERT INTO data_function_logs (function_id, status, message, events_created, events_updated)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      functionId,
      status,
      message,
      eventsCreated,
      eventsUpdated
    );
    return result.lastInsertRowid;
  }

  static deleteOlderThan(days = 30) {
    const stmt = db.prepare(`
      DELETE FROM data_function_logs
      WHERE run_at < datetime('now', '-' || ? || ' days')
    `);
    return stmt.run(days);
  }
}

module.exports = DataFunctionLog;
