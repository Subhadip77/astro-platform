const db = require('../db');

class UserModel {
  static async findById(id) {
    const rows = await db.query(
      'SELECT id, email, phone, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1;',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const rows = await db.query(
      'SELECT id, email, phone, password_hash, role, status, created_at, updated_at FROM users WHERE email = ? LIMIT 1;',
      [email]
    );
    return rows[0] || null;
  }

  static async findByPhone(phone) {
    const rows = await db.query(
      'SELECT id, email, phone, password_hash, role, status, created_at, updated_at FROM users WHERE phone = ? LIMIT 1;',
      [phone]
    );
    return rows[0] || null;
  }

  static async create({ email = null, phone = null, passwordHash = null, role = 'user', status = 'active' }) {
    const result = await db.query(
      `INSERT INTO users (email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?);`,
      [email, phone, passwordHash, role, status]
    );
    return result.insertId;
  }
}

module.exports = UserModel;
