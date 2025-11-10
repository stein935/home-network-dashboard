const db = require('../config/database');

class Service {
  static getAll() {
    return db.prepare('SELECT * FROM services ORDER BY display_order ASC').all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  }

  static create(name, url, icon, displayOrder, sectionId) {
    const stmt = db.prepare(`
      INSERT INTO services (name, url, icon, display_order, section_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, url, icon, displayOrder, sectionId);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, name, url, icon, displayOrder, sectionId) {
    const stmt = db.prepare(`
      UPDATE services
      SET name = ?, url = ?, icon = ?, display_order = ?, section_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, url, icon, displayOrder, sectionId, id);
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
