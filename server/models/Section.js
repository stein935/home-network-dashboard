const db = require('../config/database');

class Section {
  static getAll() {
    return db
      .prepare('SELECT * FROM sections ORDER BY display_order ASC')
      .all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
  }

  static getDefault() {
    return db.prepare('SELECT * FROM sections WHERE is_default = 1').get();
  }

  static create(name, displayOrder) {
    const stmt = db.prepare(`
      INSERT INTO sections (name, display_order, is_default)
      VALUES (?, ?, 0)
    `);
    const result = stmt.run(name, displayOrder);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, name, displayOrder) {
    const stmt = db.prepare(`
      UPDATE sections
      SET name = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, displayOrder, id);
    return this.findById(id);
  }

  static delete(id) {
    // Don't allow deleting the default section
    const section = this.findById(id);
    if (section && section.is_default) {
      throw new Error('Cannot delete the default section');
    }

    // Move all services in this section to the default section
    const defaultSection = this.getDefault();
    if (!defaultSection) {
      throw new Error('Default section not found');
    }

    const moveServices = db.prepare(`
      UPDATE services SET section_id = ? WHERE section_id = ?
    `);
    moveServices.run(defaultSection.id, id);

    // Delete the section
    const stmt = db.prepare('DELETE FROM sections WHERE id = ?');
    return stmt.run(id);
  }

  static updateOrder(updates) {
    const stmt = db.prepare(`
      UPDATE sections SET display_order = ? WHERE id = ?
    `);

    const updateMany = db.transaction((updates) => {
      for (const update of updates) {
        stmt.run(update.displayOrder, update.id);
      }
    });

    updateMany(updates);
  }

  static getWithServices() {
    const Service = require('./Service');
    const sections = this.getAll();
    const services = Service.getAllWithConfig();

    return sections.map((section) => ({
      ...section,
      services: services.filter((service) => service.section_id === section.id),
    }));
  }
}

module.exports = Section;
