import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pingDatabase, pool } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set and contain at least 32 characters.');
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()), credentials: false }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', async (_req, res) => {
  try { await pingDatabase(); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : error.message });
});
const port = Number(process.env.PORT || 5000);
const server = app.listen(port, async () => {
  try { await pingDatabase(); console.log(`Wexa API listening on port ${port}; MySQL connected.`); }
  catch (error) { console.error('API started, but MySQL connection failed:', error.message); }
});
const shutdown = async () => { server.close(); await pool.end(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
