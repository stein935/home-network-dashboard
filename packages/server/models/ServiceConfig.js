const db = require('../config/database');

class ServiceConfig {
  static findByServiceId(serviceId) {
    const config = db
      .prepare('SELECT * FROM service_config WHERE service_id = ?')
      .get(serviceId);

    // Parse calendar_ids JSON array if it exists
    if (config && config.calendar_ids) {
      try {
        config.calendar_ids = JSON.parse(config.calendar_ids);
      } catch (e) {
        console.error('Error parsing calendar_ids JSON:', e);
        config.calendar_ids = [];
      }
    }

    // Backward compatibility: if calendar_ids doesn't exist but calendar_id does
    if (config && !config.calendar_ids && config.calendar_id) {
      config.calendar_ids = [config.calendar_id];
    }

    return config;
  }

  static create(serviceId, calendarIds, viewType = 'week') {
    // Validate and normalize calendar IDs
    const normalizedIds = this._normalizeCalendarIds(calendarIds);
    const calendarIdsJson = JSON.stringify(normalizedIds);

    // Also store first calendar ID in calendar_id for backward compatibility
    const primaryCalendarId = normalizedIds[0] || null;

    const stmt = db.prepare(`
      INSERT INTO service_config (service_id, calendar_id, calendar_ids, view_type)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(serviceId, primaryCalendarId, calendarIdsJson, viewType);
    return this.findByServiceId(serviceId);
  }

  static update(serviceId, calendarIds, viewType) {
    // Validate and normalize calendar IDs
    const normalizedIds = this._normalizeCalendarIds(calendarIds);
    const calendarIdsJson = JSON.stringify(normalizedIds);

    // Also store first calendar ID in calendar_id for backward compatibility
    const primaryCalendarId = normalizedIds[0] || null;

    const stmt = db.prepare(`
      UPDATE service_config
      SET calendar_id = ?, calendar_ids = ?, view_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE service_id = ?
    `);
    stmt.run(primaryCalendarId, calendarIdsJson, viewType, serviceId);
    return this.findByServiceId(serviceId);
  }

  static upsert(serviceId, calendarIds, viewType) {
    const existing = this.findByServiceId(serviceId);
    if (existing) {
      return this.update(serviceId, calendarIds, viewType);
    } else {
      return this.create(serviceId, calendarIds, viewType);
    }
  }

  static delete(serviceId) {
    const stmt = db.prepare('DELETE FROM service_config WHERE service_id = ?');
    return stmt.run(serviceId);
  }

  /**
   * Normalize calendar IDs input to an array with validation
   * @param {string|string[]} calendarIds - Single calendar ID or array of IDs
   * @returns {string[]} Validated and normalized array of calendar IDs
   * @throws {Error} If validation fails
   */
  static _normalizeCalendarIds(calendarIds) {
    // Convert single string to array
    let ids = Array.isArray(calendarIds) ? calendarIds : [calendarIds];

    // Filter out empty/null/undefined values
    ids = ids.filter((id) => id && typeof id === 'string' && id.trim());

    // Validation
    if (ids.length === 0) {
      throw new Error('At least one calendar ID is required');
    }

    if (ids.length > 5) {
      throw new Error('Maximum 5 calendars allowed per card');
    }

    // Remove duplicates
    ids = [...new Set(ids)];

    return ids;
  }
}

module.exports = ServiceConfig;
