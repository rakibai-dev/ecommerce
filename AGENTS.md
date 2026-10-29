<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Acme Store — agent notes

Single-vendor demo store. Verified facts only; anything marked "(observed)" was reproduced in this repo, not read from docs.

## Stack

- Next.js **16.4.3**, App Router, TypeScript, Turbopack; `src/` dir; React 19.3.
  - `next.config.ts` enables **`cacheComponents: true`** + **`partialPrefetching: true`** — every build asserts "Cache Components enabled". Do not remove these; several patterns below depend on them.
  - `output: "standalone"` is set **only when env `STANDALONE=1`** (Dockerfile builder sets it). Never enable it unconditionally: **`next start` cannot serve standalone builds** (observed: constant warning + streamed chunks/hydration broken at runtime — duplicated DOM and unreplaced `<template id="B:0">` boundaries).
- Tailwind 4 + shadcn/ui (init: `-b radix -p nova`; components in `src/components/ui/`). Note: generated components import `{ cn } from "cn"` (the `cn` package), not `@/lib/utils`.
- PostgreSQL 17 (Docker) + **Prisma 6** (`prisma@6.19.3`, pinned away from Prisma 8-RC). Migrations: `prisma/migrations/20261025075338_init/`. `prisma.seed` = `tsx prisma/seed.ts`.
- Auth.js / **next-auth v5 beta** (`5.0.0-beta.32`), credentials provider + JWT sessions, bcryptjs v3 (`import bcrypt from "bcryptjs"`, default export).
- Payments: **mocked**. `createGuestOrder` (`src/app/actions.ts`) just writes Order rows (transaction: re-derive prices/stock from DB, decrement stock, `orderNumber` = `ORD-<base36 time>-<rand4>` with P2002 retry).

## Commands / package manager (npm)

- Setup order for fresh local dev: `docker compose up -d db` → `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`.
- Scripts: `dev`, `build` = `prisma generate && next build` (any Node host needs the generate step — engine binaries are platform-specific), `start`, `lint` (bare `eslint`), plus `db:generate`, `db:migrate`, `db:seed`, `db:deploy-migrations`, `db:studio`. Lint is currently clean (0 problems). `engines.node` is pinned `>=22` and `vercel.json` pins the Vercel build command to `npm run build` (the Next.js preset would otherwise use bare `next build` and skip generate). Do not set `STANDALONE=1` outside the Docker builder. Free-deploy recipe: `DEPLOY.md`.
- npm 12 gates lifecycle scripts; `allowScripts` in `package.json` whitelists `@prisma/client`, `prisma`, `@prisma/engines`, `esbuild`, `unrs-resolver`. Fresh installs rely on this.
- `npm run build` type-checks; it runs fine with no live DB (all DB reads stream inside Suspense at request time).

## Tests (Vitest)

- Framework: **Vitest 5** (`vitest.config.mts` at repo root). `npm run test` = single run, `npm run test:watch` = watch mode. Tests live in `tests/*.test.ts`; only pure/framework-agnostic logic is unit-tested (no React rendering — this Next version's docs note async Server Components aren't supported by Vitest; use E2E for those).
- Alias resolution: `resolve: { tsconfigPaths: true }` (native Vite 8 option). **`vite-tsconfig-paths` was removed** after the runtime warned it is superseded.
- Default env is `node`; browser-API tests opt in per file with the `// @vitest-environment happy-dom` docblock (the cart store test does; `happy-dom` is installed).
- What's covered (`70 tests, all passing`): `src/lib/format.ts` (money/slug parsing), `src/lib/cart-store.ts` (add/setQty clamping, persistence roundtrip, corrupt-JSON resilience, snapshot identity, subscriptions), `createGuestOrder` (validation, DB-derived totals/unit prices via mocked `prisma.$transaction` running the callback against a fake `tx`, P2002 retry → friendly error, non-P2002 propagation), `product-actions` (price conversion, slug derivation, picsum fallback, https-only images, P2002 messages, per-action `assertAdmin` redirect), `requireAdmin` (redirect for non-admins/anon, pass for admin).
- Mock pattern: `vi.hoisted(() => ({…}))` + `vi.mock("@/lib/prisma", …)`/`@/lib/auth`/`next/navigation`/`next/cache`/`next/server` — mocks must be registered because importing the real modules loads Prisma engines or requires the Next request store.
- `next build` type-checks `tests/` too (`tsconfig.json` includes `**/*.ts`), so tests must stay type-clean or the build breaks; they're excluded from the app by not living under `src/`.
- vitest 5 pins an optional peer on `@types/node >= 22`; this repo upgraded `@types/node` to `^24` to match the actual Node 24 runtime.

## Cache Components rules (critical)

- A page/render that touches **request-time data — `prisma.*`, `auth()`, `searchParams`, `params` — must sit inside a page-level `<Suspense>` child**. The page component stays synchronous (it prerenders the static shell) and passes `props.params` / `props.searchParams` **as promises** into the Suspense child, which `await`s them.
  - Type idiom: `PageProps<"/route">` globals type `params`/`searchParams` as promises — type child-component props as `PageProps<...>["params"]` etc. **without `Awaited<>`** (adding `Awaited` caused TS2741/TS2322 errors during build).
- **No `'use cache'` anywhere.** All DB reads are deliberately uncached; mutations use `revalidatePath` (verified working for `/`, `/admin/*`).
- **Observed bug/limitation (16.4.3): root- and layout-level `<Suspense>` holes never reveal.** A boundary in `src/app/layout.tsx` or `src/app/admin/layout.tsx` renders its fallback forever (`<template id="B:0">` stuck) in both dev and prod, even though page-level boundaries with identical content reveal fine. Consequences in this repo:
  - Header auth is a **client component** (`AuthBar`, `next-auth/react` `useSession` + `SessionProvider` in `src/components/auth-bar.tsx`) — no RSC session read in the layout.
  - Admin protection = **`requireAdmin()`** (`src/lib/require-admin.ts`: `await connection()` → `auth()` → redirect non-ADMIN to `/login?callbackUrl=/admin`), called **first** inside every admin page's Suspense child (`admin/page.tsx`, `admin/products/page.tsx` + `[id]` + `new`, `admin/orders/page.tsx`), **and** re-verified in every admin server action (`assertAdmin()` in `product-actions.ts`; inline check in `order-actions.ts`). Do not "simplify" this back into the layout.
- `next-auth`'s internals call `crypto.getRandomValues()`, which Cache Components flags as an unstable prerender value ("unstable value `crypto.getRandomValues()`" build/runtime errors on `/`, `/product/[slug]`). Fix used: **`await connection()` from `next/server` immediately before every `auth()` call in server components**.
- `/api/auth/[...nextauth]` route handler needs no special treatment (route handlers run at request time by default).

## Auth.js specifics

- `pages` config in `src/lib/auth.ts`: `signIn`/`error` → `/login`, `signOut` → `/`, `newUser` → `/register`. Without it, failed sign-ins land on `/api/auth/signin?error=…` (observed).
- **`AUTH_TRUST_HOST="true"` is required in `.env`** for prod `next start` / proxied hosting — otherwise every `/api/auth/*` request 500s `[auth][error] UntrustedHost` (observed).
- **`AUTH_URL="http://localhost:3000"` is required too** (observed bug): with `AUTH_TRUST_HOST` and no explicit origin, Auth.js derives the request origin from the server bind address. The standalone/Docker runner binds `HOSTNAME=0.0.0.0`, so every auth redirect (`location: …`) pointed to `http://0.0.0.0:3000/` (sign-in redirected the browser to `0.0.0.0:3000`; reproduced via `curl -D -` POST `/api/auth/callback/credentials`). Setting `AUTH_URL` pins the origin; change it to the real public origin when deployed. `.env`, `.env.example`, and the `docker-compose.yml` app environment all carry it.
- `.env` holds `DATABASE_URL` (`postgresql://store:store@localhost:5432/store?schema=public`), `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`. Mirror in `.env.example` (without real secret).
- **Module augmentation of `next-auth/jwt` does not work** (`jwt.d.ts` is a barrel re-export of `@auth/core/jwt`; TS fails to resolve the augmentation). `src/lib/auth.ts` casts instead: `(token as { role?: string }).role`. Keep the `declare module "next-auth"` blocks for `User`/`Session` only.
- Seeded admin: `admin@shop.local` / `admin1234` (role ADMIN). Seed (`prisma/seed.ts`) is idempotent (upserts) and also creates the 12-product demo catalog with images form `https://picsum.photos/seed/<slug>/800/800`.

## Cart & client patterns

- Cart is client-side only; persistence key `acme-cart-v1` in localStorage; provider `src/lib/cart-provider.tsx`, store logic in `src/lib/cart-store.ts` (framework-agnostic export surface: `parseCart`/`subscribe`/`getSnapshot`/`getServerSnapshot`/`commit` + `add`/`setQty`/`remove`/`clear`; unit-tested, tests/cart-store.test.ts gives each test a fresh module via `vi.resetModules()` + dynamic re-import because the module holds module-level state).
- The provider is a thin **`useSyncExternalStore`** shell over that store (`subscribe`/`getSnapshot`/`getServerSnapshot` = empty array). Do not rewrite it as `useState` + mount-effect `setLines(readCart())`: that is exactly what the `react-hooks/set-state-in-effect` ESLint **error** flags (and it double-renders). The store is cached by raw localStorage string for referential stability; `commit()` writes then notifies.
- Checkout view calls the guest-order server action inside `useTransition`, `clear()`s the cart before `router.push` to the confirmation page.

## Images

- Product images are external `https://` URLs (admin-entered; empty → picsum fallback). `next images.remotePatterns` is currently permissive: `[{ protocol: "https", hostname: "**" }]` — **tighten to known hosts before any real launch**.

## Server actions / forms

- Admin product CRUD: `useActionState` forms (`product-form.tsx`) → `createProduct`/`updateProduct` return `{ error? | ok }`; price is submitted as a **dollars string** and converted with `dollarsToCents` server-side. Slug auto-derived via `slugify`, uniqueness via P2002 → friendly error.
- Order status: native `<select>` inside a form that submits via `requestSubmit()` on change (radix/shadcn `Select` is div-based and **doesn't participate in native form submission** — rejected earlier).
- Admin delete: plain `<form action={deleteProduct}>` per row.

## Docker

- `docker-compose.yml`: `db` (postgres:17-alpine, healthcheck `pg_isready`, volume `pgdata`, port 5432), `migrate` (one-shot `npx prisma migrate deploy` from the `deps` target; `condition: service_completed_successfully`), `app` (port 3000, env injects `DATABASE_URL`/`AUTH_SECRET`/`AUTH_TRUST_HOST`/`AUTH_URL` — the last one pins the auth redirect origin, see Auth.js section).
- `Dockerfile` (multi-stage): `deps` = npm ci + `npx prisma generate` with schema present so `@prisma/client`'s postinstall finds it; `builder` sets `STANDALONE=1` and runs the build; `runner` copies `.next/standalone` + static + public, non-root user.
- **containerd buildkit quirk (observed): multi-source `COPY a b dir ./dir` fails** with "cannot copy to non-directory". Split manifest files and the `prisma/` folder into separate `COPY` lines (already done — keep them split).
- Full stack verified: `docker compose build` builds `ecommerce-app` + `ecommerce-migrate`; `docker compose up -d` → `db` healthy, one-shot `migrate` applies/verify migrations then exits, `app` serves the seeded catalog on :3000.

## Storefront design system

- Direction: "corner-shop sticker" (see `DESIGN.md` for tokens and rejected alternatives). One loud device — the orange handwritten **price sticker** (`.sticker` class in `globals.css`); everything else stays flat/quiet. Every price on the site is a sticker; orange appears nowhere else except the active category tab underline.
- Palette tokens live in `globals.css` `:root`: background putty `#EFEFEA`, card/lid `#FBFBF9`, primary ink `#23221E`, border `#D6D4CB`, plus custom `--sticker` `#FF5A1F`, `--stock` `#276B48` (mapped to `bg-sticker` / `text-stock` in `@theme inline`).
- Fonts (src/lib/fonts.tsx): **Big Shoulders** = display voice (`font-heading`), **Archivo** body (`font-sans`), **Permanent Marker** only inside `.sticker` (`font-sticker`), Geist_Mono for order numbers (`font-mono`). Layout suspends pages in Big Shoulders uppercase titles; grids are flat rounded-2xl photo tiles without card borders/shadows.
- Product pages/cards categorize with plain-text stock lines (stock green "Only N left"), not badges; no decorative motion anywhere (only action feedback like Add → "Added — go to cart").

## Misc gottenchas

- PowerShell (this environment): no `&&`/`||`; use `;`. `-WebSession $var` needs the `$` variable (bare names bind as strings).
- React controlled inputs can't be set by direct `.value=` in browser automation — use the native value setter + `input` event (or real form-fill tooling).
- Routes: `/` is a dedicated landing page (brand hero + streaming shelves directory / today's pick / rules board); `/shop` is the catalog (category filtering via `?cat=`). Cross-links point at `/shop`; the header has a "Shop" link. Landing DB reads sit inside page-level Suspense children; the hero is static.
- Products list code imports its `Product` type from `src/lib/product.ts` (shared module, no longer exported by the shop page).
- Version-matched docs live in `node_modules/next/dist/docs/` (01-getting-started, 02-guides incl. `ai-agents.md` and `authentication-with-cache-components.md`, 03-api-reference). Prefer them over web docs for this Next version.
