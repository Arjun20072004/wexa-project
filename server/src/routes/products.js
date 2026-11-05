import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
const parseProduct = (body) => {
  const name = String(body.name || '').trim();
  const sku = String(body.sku || '').trim().toUpperCase();
  const description = String(body.description || '').trim() || null;
  const quantity = Number(body.quantityOnHand);
  const costPrice = body.costPrice === '' || body.costPrice == null ? null : Number(body.costPrice);
  const sellingPrice = body.sellingPrice === '' || body.sellingPrice == null ? null : Number(body.sellingPrice);
  const threshold = body.lowStockThreshold === '' || body.lowStockThreshold == null ? null : Number(body.lowStockThreshold);
  if (!name || name.length > 160) throw Object.assign(new Error('Product name is required (maximum 160 characters).'), { status: 400 });
  if (!sku || sku.length > 80 || !/^[A-Z0-9._-]+$/.test(sku)) throw Object.assign(new Error('SKU is required and may contain letters, numbers, dots, underscores and hyphens.'), { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 0) throw Object.assign(new Error('Quantity must be a non-negative whole number.'), { status: 400 });
  for (const [label, value] of [['Cost price', costPrice], ['Selling price', sellingPrice]]) if (value !== null && (!Number.isFinite(value) || value < 0 || value > 9999999999)) throw Object.assign(new Error(`${label} must be a valid non-negative amount.`), { status: 400 });
  if (threshold !== null && (!Number.isInteger(threshold) || threshold < 0 || threshold > 1000000000)) throw Object.assign(new Error('Low-stock threshold must be a non-negative whole number.'), { status: 400 });
  return { name, sku, description, quantity, costPrice, sellingPrice, threshold };
};
const selectFields = `id, name, sku, description, quantity_on_hand AS quantityOnHand,
  cost_price AS costPrice, selling_price AS sellingPrice,
  low_stock_threshold AS lowStockThreshold, created_at AS createdAt, updated_at AS updatedAt`;

router.get('/', asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 100);
  const params = [req.user.organizationId];
  let sql = `SELECT ${selectFields} FROM products WHERE organization_id = ?`;
  if (search) { sql += ' AND (name LIKE ? OR sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY updated_at DESC, id DESC';
  const [rows] = await pool.execute(sql, params);
  res.json({ products: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const p = parseProduct(req.body || {});
  try {
    const [result] = await pool.execute(
      `INSERT INTO products (organization_id, name, sku, description, quantity_on_hand, cost_price, selling_price, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.organizationId, p.name, p.sku, p.description, p.quantity, p.costPrice, p.sellingPrice, p.threshold]
    );
    const [rows] = await pool.execute(`SELECT ${selectFields} FROM products WHERE id = ? AND organization_id = ?`, [result.insertId, req.user.organizationId]);
    res.status(201).json({ product: rows[0] });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This SKU already exists in your organization.' }); throw error; }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid product ID.' });
  const p = parseProduct(req.body || {});
  const [existing] = await pool.execute('SELECT id FROM products WHERE id = ? AND organization_id = ?', [id, req.user.organizationId]);
  if (!existing.length) return res.status(404).json({ message: 'Product not found.' });
  try {
    await pool.execute(
      `UPDATE products SET name=?, sku=?, description=?, quantity_on_hand=?, cost_price=?, selling_price=?, low_stock_threshold=?
       WHERE id=? AND organization_id=?`,
      [p.name, p.sku, p.description, p.quantity, p.costPrice, p.sellingPrice, p.threshold, id, req.user.organizationId]
    );
    const [rows] = await pool.execute(`SELECT ${selectFields} FROM products WHERE id = ? AND organization_id = ?`, [id, req.user.organizationId]);
    res.json({ product: rows[0] });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This SKU already exists in your organization.' }); throw error; }
}));

router.patch('/:id/adjust', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const delta = Number(req.body?.delta);
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000000000) return res.status(400).json({ message: 'Enter a valid non-zero stock adjustment.' });
  const [result] = await pool.execute(
    'UPDATE products SET quantity_on_hand = quantity_on_hand + ? WHERE id = ? AND organization_id = ? AND quantity_on_hand + ? >= 0',
    [delta, id, req.user.organizationId, delta]
  );
  if (!result.affectedRows) return res.status(400).json({ message: 'Product not found or adjustment would make stock negative.' });
  const [rows] = await pool.execute(`SELECT ${selectFields} FROM products WHERE id = ? AND organization_id = ?`, [id, req.user.organizationId]);
  res.json({ product: rows[0] });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid product ID.' });
  const [result] = await pool.execute('DELETE FROM products WHERE id = ? AND organization_id = ?', [id, req.user.organizationId]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Product deleted.' });
}));
export default router;
