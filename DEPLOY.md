# Deploying for free (Vercel + Neon)

A $0 production deployment. This app is a full Next.js server (Server Actions,
streaming, Cache Components, Auth.js) talking to Postgres through Prisma — it
needs a live Node server plus a hosted database. Static hosts and worker-only
runtimes (Cloudflare Workers) can't serve it.

| Piece   | Free choice       | Why this one                                                                          |
| ------- | ----------------- | ------------------------------------------------------------------------------------- |
| App     | **Vercel Hobby**  | Verified adapter for this Next version; supports streaming + Server Actions first-hand |
| Postgres | **Neon free tier** | Persistent free Postgres (0.5 GB); autosuspends idle compute (~1 s cold start, fine for a demo) |

Free-tier fine print: Vercel Hobby is non-commercial (fine for a demo store);
Neon powers down compute after ~5 min idle and wakes it automatically.

## 1. Push the repo to GitHub

```bash
git init
git add -A
git commit -m "Acme Store"
git remote add origin git@github.com:<you>/acme-store.git
git push -u origin main
```

`.gitignore` already excludes `.env*`, `node_modules/`, and `.vercel/` —
secrets stay local.

## 2. Create the Neon database

neon.tech → New Project → copy **both** connection strings from the dashboard:

- **Pooled** (hostname contains `-pooler`, URL has `sslmode=require`) — the
  app's runtime `DATABASE_URL`.
- **Direct** (unpooled) — required for `migrate deploy` and seeding.

## 3. Import the repo on Vercel

Add → Project → pick the GitHub repo. The preset is Next.js and the defaults
already work (`vercel.json` pins the build command; `package.json` pins
`engines.node >= 22`, and `build` runs `prisma generate && next build`).

Add environment variables (**Settings → Environment Variables**):

| Variable          | Value                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Neon **pooled** string                                                                                    |
| `AUTH_SECRET`     | Fresh secret — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — don't reuse the dev one |
| `AUTH_URL`        | `https://<your-app>.vercel.app` (or your custom domain). Required — Auth.js must not guess the origin.     |
| `AUTH_TRUST_HOST` | `true`                                                                                                    |

Do **not** set `STANDALONE=1`: that env is only for the Docker image build
(see `Dockerfile`). `next start` / platform builds cannot serve standalone
output.

Deploy and wait for the build.

## 4. Create the schema + demo data (once)

From this repo locally (with `npm install` done), PowerShell:

```powershell
$env:DATABASE_URL = "<neon-direct-url>"; npm run db:deploy-migrations
$env:DATABASE_URL = "<neon-pooled-url>";  npm run db:seed
```

(bash equivalent: `DATABASE_URL=... npm run db:deploy-migrations`)

- `db:deploy-migrations` = `prisma migrate deploy` — the only thing that may
  run against the hosted DB. (`db:migrate` is `migrate dev`, local dev only.)
- `db:seed` upserts the 12-product catalog and the admin user; idempotent, so
  re-running is harmless.

## 5. Verify on the live URL

- `/` paints the hero instantly and streams the shelves board / today's pick.
- Sign-in works → proves `AUTH_URL` + `AUTH_TRUST_HOST` are right. (This is
  the step this repo specifically has bitten people on: without `AUTH_URL`
  the auth redirects go to the bind address.)
- `admin@shop.local` / `admin1234` → `/admin` loads.
- Place a guest order → confirmation page renders an `ORD-…` number; stock
  decremented in the admin.

## Gotchas specific to this repo

- **`prisma generate` must run on the build machine** — engine binaries are
  platform-specific (a Linux build needs Linux binaries, not the Windows ones
  from local dev). Already wired into `npm run build`.
- **Before any real launch**: tighten `images.remotePatterns` in
  `next.config.ts` (currently permits any https host) and change the seeded
  admin password.

## Alternatives (also free)

| Option                                 | Catch                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| Oracle Cloud Always Free ARM VM        | Run this repo's `docker-compose.yml` verbatim (db + migrate + app) — truly free 24/7; more setup |
| Supabase free Postgres (instead of Neon) | Pauses the whole project after ~1 week of inactivity (one dashboard click to resume)      |
| Render free Web Service                | App sleeps after 15 min idle — first visit is slow; pair it with Neon (Render's own free DB expires ~30 days) |
| Hugging Face Spaces (Docker)           | Runs the existing `Dockerfile`; sleeps after 48 h idle, low memory                         |

Railway and Fly.io are no longer meaningfully free (one-time trial credit /
usage billing).
