<<<<<<< HEAD
# Wexa — Inventory Management SaaS

A full-stack, multi-tenant inventory management MVP built to the supplied six-hour assessment PRD.

## Features

- Email/password registration and login (bcrypt password hashing, JWT authentication)
- Automatic organization creation during registration
- Organization-scoped product records and queries
- Product create, list, search, edit, delete and stock adjustment
- Dashboard summary: product count, total units, low-stock count, out-of-stock count and recorded inventory cost value
- Low-stock rules: product threshold takes priority; otherwise the organization default is used
- Workspace settings for the default low-stock threshold
- Responsive React interface with dashboard, catalog, settings, empty/loading/error states and toast feedback
- MySQL schema with foreign keys, unique email, organization-scoped SKU uniqueness and non-negative stock constraint

## Technology

- Frontend: React 18, Vite, React Router, Lucide icons, custom responsive CSS
- Backend: Node.js, Express, MySQL 8+, mysql2
- Security: bcryptjs, JWT, Helmet, CORS allow-list, authentication rate limit, server-side validation

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MySQL 8.0 or newer

## Local setup

### 1. Create the database

Open MySQL Workbench or a MySQL terminal and execute:

```sql
SOURCE /absolute/path/to/Wexa/server/database/schema.sql;
```

Alternatively, paste the contents of `server/database/schema.sql` into your SQL client.

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Update `.env` with your MySQL credentials. Set `JWT_SECRET` to a random value of at least 32 characters. Do not commit `.env`.

### 3. Configure the frontend

```bash
cd ../client
cp .env.example .env
```

For local development, the default API URL is `http://localhost:5000/api`.

### 4. Install and run

From the project root:

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Frontend: `http://localhost:5173`
Backend health check: `http://localhost:5000/api/health`

If you prefer separate terminals:

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```


## Demo admin login (local development)

The database schema does not create a login automatically. After importing `server/database/schema.sql` and configuring `server/.env`, create a demo workspace-owner account by running this from the project root:

```bash
npm run seed:admin --prefix server
```

Default local demo credentials:

- Email: `admin@wexa.local`
- Password: `Wexa@2026!`
- Workspace: `Wexa Admin Workspace`

This is an owner account for one workspace, not a separate platform-wide super-admin role. The current MVP has no role-based admin system. The seed script will not overwrite an account if that email already exists. To use different credentials, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_ORGANIZATION` in the environment before running the script. Change the demo password before any public deployment; do not use these demo credentials in production.

## Support contact

The in-app sidebar help link uses `youronehubb@gmail.com`. It opens the user's configured email application via `mailto:`; it does not send messages automatically.

## API overview

All protected endpoints require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create organization and owner account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user and organization |
| GET | `/api/dashboard` | Dashboard metrics and low-stock/recent products |
| GET | `/api/products?search=` | List/search organization products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| PATCH | `/api/products/:id/adjust` | Add/remove stock using `{ "delta": 5 }` |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/settings` | Read organization settings |
| PUT | `/api/settings` | Update default threshold |
| GET | `/api/health` | API and database health |

## Deployment outline

### Backend (Render, Railway, etc.)

- Create a managed MySQL database (or use a MySQL host with network access enabled).
- Deploy the `server` directory as a Node web service.
- Build command: `npm install`
- Start command: `npm start`
- Set `PORT`, `NODE_ENV=production`, `CLIENT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and all `DB_*` variables in the host environment.
- Run `server/database/schema.sql` against the production database before opening the app.

### Frontend (Vercel, Netlify, etc.)

- Deploy the `client` directory as a Vite app.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed backend URL plus `/api` (for example `https://your-api.example.com/api`).
- Configure SPA fallback to `index.html` if the host does not do this automatically.

Update backend `CLIENT_URL` to the exact deployed frontend origin. For multiple origins, provide a comma-separated allow-list.

## Assessment verification checklist

1. Register a new organization and owner account.
2. Sign out and sign back in.
3. Add a product with a unique SKU and quantity.
4. Add a second product and confirm duplicate SKU is rejected within the same organization.
5. Edit product details and verify the list updates.
6. Adjust stock up and down; verify a negative resulting quantity is rejected.
7. Set a product threshold and confirm it overrides the organization default.
8. Leave a product threshold blank and confirm the organization default is applied.
9. Verify low-stock and out-of-stock statuses and dashboard counts.
10. Create a second organization and confirm it cannot see the first organization's products.
11. Verify invalid/expired tokens are rejected.
12. Verify `/api/health` reports the database connection.

## Notes and MVP boundaries

- Currency is displayed as INR in the starter UI. Change the currency formatter in `client/src/pages/Products.jsx` and `client/src/pages/Dashboard.jsx` if the assessment expects another currency.
- Password reset, staff invitations, warehouse management, order management, suppliers, notifications, CSV import, billing and detailed stock movement history are outside the supplied MVP scope.
- The frontend stores the JWT in localStorage to keep the MVP simple. For a production system with higher security requirements, consider secure, HttpOnly, SameSite cookies, CSRF protections, refresh-token rotation and a stricter deployment security review.
- The sample authentication screen includes illustrative dashboard figures for visual presentation only. Actual application data comes from the API.

## Header controls

The top-bar search opens with the search button or `Ctrl+K` and searches products by name or SKU within the signed-in organization. Selecting a result opens the Products page with that search applied. The bell opens live low-stock inventory alerts from the dashboard API. The profile menu shows the signed-in account and organization and provides sign out.
=======
# wexa-project
>>>>>>> 68bbca2f03b3da91026988683815c1c00d5164d4
