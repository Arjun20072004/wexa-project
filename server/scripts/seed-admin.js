import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

dotenv.config();

// Local demo owner account. Override these values with ADMIN_* environment
// variables before running the script if you prefer different credentials.
const email = String(process.env.ADMIN_EMAIL || 'youronehubb@gmail.com').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Wexa@2026!';
const name = process.env.ADMIN_NAME || 'Wexa Admin';
const organizationName = process.env.ADMIN_ORGANIZATION || 'Wexa Admin Workspace';

if (password.length < 8 || password.length > 72) {
  throw new Error('ADMIN_PASSWORD must contain 8–72 characters.');
}

try {
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) {
    console.log(`An account already exists for ${email}. No changes were made.`);
    console.log('If this is the demo admin account, sign in with the credentials in README.md.');
    process.exitCode = 0;
  } else {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [org] = await connection.execute('INSERT INTO organizations (name) VALUES (?)', [organizationName]);
      const passwordHash = await bcrypt.hash(password, 12);
      await connection.execute(
        'INSERT INTO users (organization_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
        [org.insertId, name, email, passwordHash]
      );
      await connection.commit();
      console.log('Wexa demo admin account created successfully.');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Workspace: ${organizationName}`);
      console.log('Change the demo password before using this account outside local development.');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
} finally {
  await pool.end();
}
