const db = require('../config/database');
const ServiceConfig = require('./ServiceConfig');

class Service {
  static getAll() {
    return db
      .prepare('SELECT * FROM services ORDER BY display_order ASC')
      .all();
  }

  static getAllWithConfig() {
    const services = this.getAll();
    return services.map((service) => {
      const config = ServiceConfig.findByServiceId(service.id);
      return { ...service, config };
    });
  }

  static findById(id) {
    return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  }

  static findByIdWithConfig(id) {
    const service = this.findById(id);
    if (service) {
      const config = ServiceConfig.findByServiceId(service.id);
      return { ...service, config };
    }
    return null;
  }

  static create(name, url, icon, displayOrder, sectionId, cardType = 'link') {
    const createWithShift = db.transaction(
      (name, url, icon, displayOrder, sectionId, cardType) => {
        // Shift all services in the same section down by 1
        const shiftStmt = db.prepare(`
        UPDATE services
        SET display_order = display_order + 1
        WHERE section_id = ?
      `);
        shiftStmt.run(sectionId);

        // Insert the new service at display_order = 0
        const insertStmt = db.prepare(`
        INSERT INTO services (name, url, icon, display_order, section_id, card_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
        const result = insertStmt.run(
          name,
          url,
          icon,
          displayOrder,
          sectionId,
          cardType
        );
        return result.lastInsertRowid;
      }
    );

    const lastId = createWithShift(
      name,
      url,
      icon,
      displayOrder,
      sectionId,
      cardType
    );
    return this.findById(lastId);
  }

  static update(
    id,
    name,
    url,
    icon,
    displayOrder,
    sectionId,
    cardType = 'link'
  ) {
    const stmt = db.prepare(`
      UPDATE services
      SET name = ?, url = ?, icon = ?, display_order = ?, section_id = ?, card_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, url, icon, displayOrder, sectionId, cardType, id);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM services WHERE id = ?');
    return stmt.run(id);
  }

  static updateOrder(updates) {
    const stmt = db.prepare(`
      UPDATE services SET display_order = ? WHERE id = ?
    `);

    const updateMany = db.transaction((updates) => {
      for (const update of updates) {
        stmt.run(update.displayOrder, update.id);
      }
    });

    updateMany(updates);
  }
}

module.exports = Service;
