import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT name AS organizationName, default_low_stock_threshold AS defaultLowStockThreshold FROM organizations WHERE id = ?', [req.user.organizationId]);
  if (!rows.length) return res.status(404).json({ message: 'Organization not found.' });
  res.json({ settings: rows[0] });
}));
router.put('/', asyncHandler(async (req, res) => {
  const threshold = Number(req.body?.defaultLowStockThreshold);
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 1000000000) return res.status(400).json({ message: 'Default threshold must be a non-negative whole number.' });
  const [existing] = await pool.execute('SELECT id FROM organizations WHERE id = ?', [req.user.organizationId]);
  if (!existing.length) return res.status(404).json({ message: 'Organization not found.' });
  await pool.execute('UPDATE organizations SET default_low_stock_threshold = ? WHERE id = ?', [threshold, req.user.organizationId]);
  const [rows] = await pool.execute('SELECT name AS organizationName, default_low_stock_threshold AS defaultLowStockThreshold FROM organizations WHERE id = ?', [req.user.organizationId]);
  res.json({ settings: rows[0], message: 'Settings saved.' });
}));
export default router;
