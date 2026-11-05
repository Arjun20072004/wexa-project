# Deployment configuration quick reference

## API service

Root directory: `server`

Build/install: `npm install`

Start: `npm start`

Required environment variables:

- `NODE_ENV=production`
- `PORT` (provided by most hosting platforms)
- `CLIENT_URL=https://your-frontend-domain.example`
- `JWT_SECRET` (32+ random characters)
- `JWT_EXPIRES_IN=1d`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Execute `server/database/schema.sql` on the hosted MySQL instance before first use.

## Frontend service

Root directory: `client`

Build: `npm install && npm run build`

Publish directory: `dist`

Environment variable:

- `VITE_API_URL=https://your-api-domain.example/api`

Set the API CORS `CLIENT_URL` to the frontend's exact origin.


## Admin account safety

Do not use the local demo credentials on a public deployment. Create a unique admin/owner account with a strong password, and configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` if using the seed script. This MVP has workspace ownership but does not implement a platform-wide administrator role.

Support contact displayed in the application: `youronehubb@gmail.com`.
