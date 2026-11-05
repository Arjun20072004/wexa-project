import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const makeToken = (user) => jwt.sign(
  { organizationId: user.organization_id, email: user.email },
  process.env.JWT_SECRET,
  { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
);

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, organizationName } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanOrg = String(organizationName || '').trim();
  if (!cleanName || cleanName.length > 100) return res.status(400).json({ message: 'Enter your name (maximum 100 characters).' });
  if (!emailPattern.test(cleanEmail) || cleanEmail.length > 190) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ message: 'Password must contain 8–72 characters.' });
  if (!cleanOrg || cleanOrg.length > 120) return res.status(400).json({ message: 'Enter an organization name (maximum 120 characters).' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length) { await connection.rollback(); return res.status(409).json({ message: 'An account with this email already exists.' }); }
    const [orgResult] = await connection.execute('INSERT INTO organizations (name) VALUES (?)', [cleanOrg]);
    const passwordHash = await bcrypt.hash(password, 12);
    const [userResult] = await connection.execute(
      'INSERT INTO users (organization_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [orgResult.insertId, cleanName, cleanEmail, passwordHash]
    );
    await connection.commit();
    const user = { id: userResult.insertId, organization_id: orgResult.insertId, name: cleanName, email: cleanEmail, organizationName: cleanOrg };
    res.status(201).json({ token: makeToken(user), user: { id: user.id, name: user.name, email: user.email, organizationId: Number(user.organization_id), organizationName: cleanOrg } });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account with this email already exists.' });
    throw error;
  } finally { connection.release(); }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  if (!emailPattern.test(email) || typeof password !== 'string' || !password) return res.status(400).json({ message: 'Enter a valid email and password.' });
  const [rows] = await pool.execute(
    `SELECT u.id, u.organization_id, u.name, u.email, u.password_hash, o.name AS organization_name
     FROM users u JOIN organizations o ON o.id = u.organization_id WHERE u.email = ? LIMIT 1`, [email]
  );
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ message: 'Incorrect email or password.' });
  const user = rows[0];
  res.json({ token: makeToken(user), user: { id: Number(user.id), name: user.name, email: user.email, organizationId: Number(user.organization_id), organizationName: user.organization_name } });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.organization_id, o.name AS organization_name
     FROM users u JOIN organizations o ON o.id = u.organization_id WHERE u.id = ? AND u.organization_id = ? LIMIT 1`,
    [req.user.id, req.user.organizationId]
  );
  if (!rows.length) return res.status(401).json({ message: 'Account not found.' });
  const u = rows[0];
  res.json({ user: { id: Number(u.id), name: u.name, email: u.email, organizationId: Number(u.organization_id), organizationName: u.organization_name } });
}));
export default router;
