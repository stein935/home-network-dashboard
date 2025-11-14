const db = require('../config/database');

class Note {
  static findAll() {
    return db
      .prepare('SELECT * FROM notes ORDER BY section_id, display_order ASC')
      .all();
  }

  static findBySection(sectionId) {
    return db
      .prepare(
        'SELECT * FROM notes WHERE section_id = ? ORDER BY display_order ASC'
      )
      .all(sectionId);
  }

  static findById(id) {
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  }

  static create({
    sectionId,
    title,
    message,
    authorEmail,
    authorName,
    dueDate,
    color,
  }) {
    // Get the highest display_order for this section and add 1
    const maxOrder = db
      .prepare(
        'SELECT MAX(display_order) as max FROM notes WHERE section_id = ?'
      )
      .get(sectionId);
    const displayOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO notes (section_id, title, message, author_email, author_name, due_date, color, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      sectionId,
      title,
      message,
      authorEmail,
      authorName,
      dueDate || null,
      color,
      displayOrder,
      now,
      now
    );
    return this.findById(result.lastInsertRowid);
  }

  static update(id, { title, message, dueDate, color }) {
    const now = new Date().toISOString();

    // Build dynamic UPDATE query based on provided fields
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (message !== undefined) {
      updates.push('message = ?');
      values.push(message);
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(dueDate || null);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    values.push(now);

    // Add id for WHERE clause
    values.push(id);

    const stmt = db.prepare(`
      UPDATE notes
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
    return this.findById(id);
  }

  static updateOrder(id, { sectionId, displayOrder }) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE notes
      SET section_id = ?, display_order = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(sectionId, displayOrder, now, id);
    return this.findById(id);
  }

  static reorderBatch(updates) {
    const stmt = db.prepare(`
      UPDATE notes SET section_id = ?, display_order = ?, updated_at = ? WHERE id = ?
    `);

    const now = new Date().toISOString();
    const updateMany = db.transaction((updates) => {
      for (const update of updates) {
        stmt.run(update.sectionId, update.displayOrder, now, update.id);
      }
    });

    updateMany(updates);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = Note;
