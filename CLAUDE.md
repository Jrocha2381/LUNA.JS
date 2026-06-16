# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

LUNA.JS is a full-stack Point-of-Sale (POS) system. The backend is Express.js + Sequelize ORM (SQLite in dev, PostgreSQL in production). The frontend is vanilla HTML/CSS/JS — no build step, no framework.

## Common commands

```bash
# Start the server
npm run dev         # or: npm start   (both run node src/server.js)

# Database
npm run db:migrate  # run pending migrations
npm run db:seed     # seed test data
```

No linter, test runner, or build tool is configured.

## Architecture overview

### Backend (`src/`)

Entry point: `src/server.js` → loads `src/app.js` → starts on port 3000.

`src/app.js` mounts routes under **four URL prefixes** simultaneously for legacy compatibility:
- `/api` (current)
- `/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi`
- `/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi`
- A base prefix with spaces

All protected routes live under those prefixes: `/usuarios`, `/productos`, `/ventas`, `/compras`, `/clientes`, `/proveedores`, `/categorias`, `/descuentos`, `/faltantes`, `/reportes`, `/detalle_ventas`, `/detalle_compras`.

Middleware order in `src/app.js`: CORS → JWT auth (`src/middlewares/authJwt.js`) → role check (`src/middlewares/requireRole.js`) → logging → response sanitization (strips `password`, `_id` from responses).

Auth is JWT-based. `JWT_SECRET` is required at startup (`src/config/env.js` fails fast if missing). Tokens expire per `JWT_EXPIRES_IN` env var (default `1h`).

### Database

`config/config.js` selects the adapter by environment:
- **development** → SQLite (`./database.sqlite`)
- **production** → PostgreSQL via `DATABASE_URL` with SSL

Models live in `models/`. Key associations: `Venta` → `DetalleVenta` → `Producto`; `Compra` → `DetalleCompra` → `Producto`; `Usuario` has roles `ADMIN` / `USER`.

Schema changes must go through Sequelize migrations (`migrations/`), not direct model edits.

### Frontend (`carritopage/`, `js/`, root HTML files)

Static files served by Express. No bundler. Pages communicate with the backend via `js/api-service.js` (Fetch API wrapper that attaches the stored JWT token).

Key pages:
- `index.html` — login
- `carritopage/acceso-admin.html` — admin dashboard
- `carritopage/ventas.html` / `js/ventas.js` — sales with discounts, refunds, corrections
- `carritopage/factura.html` / `js/factura.js` — invoice generation
- `carritopage/compras.html` / `js/compras.js` — purchase orders
- `carritopage/faltantes.html` — inventory shortage tracking
- `carritopage/reportes.html` — report generation

### Environment variables

Copy `.env.example` to `.env`. Required:
```
PORT=3000
JWT_SECRET=<secret>
JWT_EXPIRES_IN=1h
```
In production add `DATABASE_URL` (PostgreSQL connection string).

## Deployment

Configured for Render.com via `render.yaml`. Migrations are expected to run before the server starts.
