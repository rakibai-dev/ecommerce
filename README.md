# Acme Store — full-stack demo e-commerce

A single-vendor storefront built as one Next.js app: public catalog, client cart, guest
checkout (mock payments), accounts, and an admin dashboard — with a Postgres database and
a Docker Compose runtime.

| Layer      | Choice                                                            |
| ---------- | ----------------------------------------------------------------- |
| Framework  | Next.js 16.4.3 (App Router, TypeScript, Turbopack)                |
| UI         | Tailwind CSS 4 + shadcn/ui (radix base, nova preset)              |
| Database   | PostgreSQL 17 + Prisma 6                                          |
| Auth       | Auth.js / NextAuth v5 beta — credentials + bcryptjs, JWT sessions |
| Payments   | **Mocked** — orders are DB records; no card ever charged          |
| Runtime    | Docker Compose (`db` + one-shot `migrate` + `app`)                |
| Packages   | npm                                                               |

## Quickstart (Docker)

```bash
docker compose up --build
# app:        http://localhost:3000
# migrations: applied by the one-shot `migrate` service before `app` starts
```

## Quickstart (local dev)

```bash
docker compose up -d db     # Postgres only
npm install
npm run db:migrate          # first setup / schema changes (creates + applies migrations)
npm run db:seed             # demo catalog + admin user
npm run dev                 # http://localhost:3000
```

Production server (`next start`) after `npm run build` requires the same `db` container and `.env`.

### Admin login

Seeded account (from `prisma/seed.ts`):

- **Email:** `admin@shop.local`
- **Password:** `admin1234`

Sign in on `/login` to unlock `/admin` (stats, product CRUD, order status).

## Features

- **Storefront** — home with category filter (`/?cat=…`), product detail pages, external
  product images via `next/image`.
- **Cart** — client-side (localStorage, key `acme-cart-v1`), quantity controls, badge in
  the header; survives refreshes, empty during SSR.
- **Checkout** — guests allowed; the server re-validates prices/stock from the DB inside a
  transaction, decrements stock, and writes an order (`ORD-…` number). No payment capture.
- **Orders** — public confirmation page per order number; password optional account
  creation + login.
- **Admin** — stats overview (orders, revenue, products, low stock, latest orders),
  product create/edit/delete, order list with status select
  (PENDING / SHIPPED / DELIVERED / CANCELLED). Protected server-side on every page and
  every action.

## npm scripts

| Script                      | What it does                          |
| --------------------------- | ------------------------------------- |
| `dev`                       | `next dev` (Turbopack)                |
| `build`                     | `prisma generate` + `next build` (type-checks too)   |
| `start`                     | `next start` (prod server)            |
| `lint`                      | ESLint                                |
| `test`                      | Vitest unit tests (single run)        |
| `test:watch`                | Vitest watch mode                     |
| `db:generate`               | `prisma generate`                     |
| `db:migrate`                | `prisma migrate dev`                  |
| `db:seed`                   | seed via tsx (idempotent)             |
| `db:deploy-migrations`      | `prisma migrate deploy` (CI/Compose)  |
| `db:studio`                 | Prisma Studio                         |

## Environment (`.env`)

| Variable          | Notes                                                          |
| ----------------- | -------------------------------------------------------------- |
| `DATABASE_URL`    | Local default points at the Compose Postgres (`store`/`store`). |
| `AUTH_SECRET`     | Replace with your own secret in any non-demo deployment.        |
| `AUTH_TRUST_HOST` | `true` needed when serving behind a proxy or via `next start`.  |
| `AUTH_URL`        | Public origin (e.g. `http://localhost:3000`). Required: without it Auth.js guesses the origin wrongly behind proxies/Docker and redirects sign-in/sign-out to the bind address (`0.0.0.0`). |

## Notes

- **UI design**: the storefront follows the "corner-shop sticker" system — tokens,
  `.sticker` pricing device, and fonts documented in `DESIGN.md` (palette lives
  in `src/app/globals.css`, fonts in `src/lib/fonts.tsx`).
- **Prices** are stored as integer cents (`priceCents`); helpers in `src/lib/format.ts`.
- **Images** are external `https://` URLs chosen by the admin; `next.config.ts` currently
  permits any https host (`remotePatterns`) — tighten to known hostnames before launch.
- The **Docker image** uses the Next.js standalone output (`STANDALONE=1` in the
  Dockerfile). Never set `output: "standalone"` unconditionally — `next start` cannot
  serve standalone builds (see `AGENTS.md` for the full rationale).
- Agent/repository conventions live in [`AGENTS.md`](AGENTS.md).
- **Deploying free** (Vercel + Neon recipe, env vars, alternatives): [`DEPLOY.md`](DEPLOY.md).
