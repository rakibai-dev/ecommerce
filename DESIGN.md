# Storefront design system — "the corner-shop sticker"

Direction chosen for the UI redesign: a corner-shop / utility-store system
grounded in what Acme actually sells (small everyday goods) rather than a
generic e-commerce kit. One loud device — the handwritten **price sticker** —
everything else stays quiet.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| putty paper | `#EFEFEA` | page background |
| lid white | `#FBFBF9` | panels, cards, photo tiles (`--card`) |
| ink | `#23221E` | type, primary buttons (`--primary`) |
| tape orange | `#FF5A1F` | the sticker only (`--sticker`) |
| shelf line | `#D6D4CB` | borders/dividers |
| stock green | `#276B48` | "in stock / only N left" states (`--stock`) |

## Type (src/lib/fonts.tsx)

- **Big Shoulders** (700/900 condensed) — signage voice: wordmark, hero, page
  titles (`font-heading`).
- **Archivo** — body, UI controls, data (`font-sans`).
- **Permanent Marker** — digits on the price sticker only (`font-sticker`,
  applied by the `.sticker` class in globals.css).
- **Geist Mono** — order numbers.

## The sticker

`.sticker` (globals.css, @layer components): fluorescent tape pill, marker
digits, rotated slightly, faint hard shadow (`0 2px 0`). Rules:

- Every price on the site is a sticker: hero, product cards, product page,
  cart subtotal, checkout total, order total.
- Sold-out items trade it for a gray sticker ("Sold out").
- Orange appears nowhere else except the active category tab underline (a
  taped marker). No orange buttons, links, or hover states.
- Sizes: text-lg (grid) → text-2xl (cart/checkout totals) → text-4xl
  (product page).

## Layout language

- Left-aligned shelf system; flat photo tiles (rounded-2xl, no shadows, no
  card chrome) in a 2/3/4-column grid.
- Hairline dividers only where a real list exists (cart rows, order lines).
- Category tabs: underline tabs with sticker-orange active marker.
- Quiet labels: stock as plain text ("Only 3 left" in stock green), no badges,
  no ALL-CAPS eyebrows, no middle-dot meta strings.

## Motion

None decorative. Only action-answered feedback (Add → "Added — go to cart"),
transitions under `transition-*` utilities which respect reduced motion via
plain color/opacity changes (no transforms/scaling). No entrance animations.

## Collateral decisions

- Hero = the goods themselves: signage headline + featured product tile with
  its sticker (dropped from the grid to avoid duplication).
- Footer: three quiet columns closed by a small-print row — identity
  (Big Shoulders wordmark + one-line identity + the payments-are-mocked
  disclaimer), a "Store" directory (Shop / Cart / Sign in / Create account /
  Store admin), "The fine print" (orders reserve stock, accounts optional,
  support email, prices in USD), and the © / "Open around the clock" row.
  Copy stays plain sentences (no `·` separators); the "demo, nothing is
  charged" honesty is kept everywhere. The footer is fully static — no DB
  reads or `auth()` in the root layout, since layout-level Suspense holes
  never reveal on this Next version.
- Destructive/away states keep shadcn tokens; error boxes are lid-white with a
  red border instead of tinted washes.

## Landing page (/) vs the shop (/)

`/` is the store's front door, `/shop` the full catalog (added 2026-10-29).

- Landing layout: static Big Shoulders hero ("A small store with honest
  prices.") + ink CTA; one Suspense boundary streams the rest —
  1. the **aisle directory board**: every category as a row (photo thumbnail,
     Big Shoulders name, live item count) linking to `/shop?cat=…`;
  2. today's pick: one in-stock photo tile with its price sticker + AddToCart
     (pick = last in-stock item by name, differing from the shop hero's pick
     so the two pages don't repeat the same product);
  3. the ink **"How this store works"** board: three plain honesty lines in
     putty-on-ink, closing CTA "Browse the shelves" (lid-white button) plus
     live totals ("N items on M shelves today").
- Sticker rules apply unchanged: the pick price is the only sticker on `/`;
  no stickers in the directory (counts are numbers, not prices).
- Uppercase display headings (Big Shoulders is the signage voice) are a
  deliberate system choice — no ALL-CAPS *eyebrow labels* exist anywhere.
- Cross-links: header gains a quiet "Shop" link; cart/checkout empty states,
  product breadcrumb, and order confirmation all point to `/shop`.
- DB reads on `/` stay inside the page-level Suspense children; the shell
  prerenders static (Cache Components rule).

## Explicitly rejected (AI-default tells per the design brief)

- Cream `#F4F1EA` + terracotta accent (flagged look). → cooler putty +
  fluorescent orange device instead.
- Near-black page with acid green. Not applicable.
- Broadsheet hairline-everything, zero radius. Not applicable.
- Uniform rounded cards + same soft shadow. → flat tiles, radius varies by
  element (tiles 2xl, sticker pill, controls lg), sticker shadow only.
- ALL-CAPS eyebrows, `A · B · C` metas, mono micro-labels, appended `→`.
  Checked keywords: sticker, putty, signage, shelf.
