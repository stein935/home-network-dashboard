const db = require('../config/database');

class ServiceConfig {
  static findByServiceId(serviceId) {
    return db.prepare('SELECT * FROM service_config WHERE service_id = ?').get(serviceId);
  }

  static create(serviceId, calendarId, viewType = 'week') {
    const stmt = db.prepare(`
      INSERT INTO service_config (service_id, calendar_id, view_type)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(serviceId, calendarId, viewType);
    return this.findByServiceId(serviceId);
  }

  static update(serviceId, calendarId, viewType) {
    const stmt = db.prepare(`
      UPDATE service_config
      SET calendar_id = ?, view_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE service_id = ?
    `);
    stmt.run(calendarId, viewType, serviceId);
    return this.findByServiceId(serviceId);
  }

  static upsert(serviceId, calendarId, viewType) {
    const existing = this.findByServiceId(serviceId);
    if (existing) {
      return this.update(serviceId, calendarId, viewType);
    } else {
      return this.create(serviceId, calendarId, viewType);
    }
  }

  static delete(serviceId) {
    const stmt = db.prepare('DELETE FROM service_config WHERE service_id = ?');
    return stmt.run(serviceId);
  }
}

module.exports = ServiceConfig;
