import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS totalProducts, COALESCE(SUM(quantity_on_hand),0) AS totalUnits,
      COALESCE(SUM(CASE WHEN quantity_on_hand <= COALESCE(low_stock_threshold, (SELECT default_low_stock_threshold FROM organizations WHERE id = ?)) THEN 1 ELSE 0 END),0) AS lowStockCount,
      COALESCE(SUM(CASE WHEN quantity_on_hand = 0 THEN 1 ELSE 0 END),0) AS outOfStockCount,
      COALESCE(SUM(CASE WHEN cost_price IS NOT NULL THEN cost_price * quantity_on_hand ELSE 0 END),0) AS inventoryCostValue
     FROM products WHERE organization_id = ?`, [orgId, orgId]
  );
  const [lowStockItems] = await pool.execute(
    `SELECT id, name, sku, quantity_on_hand AS quantityOnHand,
      COALESCE(low_stock_threshold, (SELECT default_low_stock_threshold FROM organizations WHERE id = ?)) AS effectiveThreshold
     FROM products WHERE organization_id = ?
       AND quantity_on_hand <= COALESCE(low_stock_threshold, (SELECT default_low_stock_threshold FROM organizations WHERE id = ?))
     ORDER BY quantity_on_hand ASC, name ASC LIMIT 8`, [orgId, orgId, orgId]
  );
  const [recentProducts] = await pool.execute(
    `SELECT id, name, sku, quantity_on_hand AS quantityOnHand, selling_price AS sellingPrice, updated_at AS updatedAt
     FROM products WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 5`, [orgId]
  );
  res.json({ summary: { totalProducts: Number(summary.totalProducts), totalUnits: Number(summary.totalUnits), lowStockCount: Number(summary.lowStockCount), outOfStockCount: Number(summary.outOfStockCount), inventoryCostValue: Number(summary.inventoryCostValue) }, lowStockItems, recentProducts });
}));
export default router;
