# Rau Om

Cloudflare-hosted Next.js storefront for **Rau Om** with D1-backed dishes, checkout, orders, and admin basics.

## Stack

- Next.js App Router + TypeScript
- OpenNext Cloudflare adapter (`@opennextjs/cloudflare`)
- Cloudflare Workers runtime
- Cloudflare D1 (SQLite) for app data
- Cloudflare R2 binding placeholder for dish images
- Mapbox (optional) for driving-distance delivery quotes
- Resend (optional) for order/subscriber emails

## What is implemented

- Storefront homepage with featured carousel, dietary filters, and dish cards
- Dish detail pages with ingredients, optional nutrition, and add-to-cart
- Archive page for past dishes
- Cart + checkout (delivery/pickup, timeslot selection, manual payment method)
- Delivery fee + tax estimates using cents-only pricing math
- Lead-time and confirmation-buffer slot eligibility checks
- Order submission to D1 with idempotency key + slot reservation
- Newsletter double opt-in workflow (pending -> active)
- Admin basics:
  - token login fallback (`/admin/login`)
  - order list with status updates
  - dish create + lifecycle status updates
- SEO basics: metadata, sitemap, robots

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Configure local env vars.

```bash
cp .dev.vars.example .dev.vars
```

3. Log in to Cloudflare.

```bash
npx wrangler login
```

4. Create D1 database (first time only).

```bash
npx wrangler d1 create rauom-db
```

5. Put the returned `database_id` into [`wrangler.jsonc`](./wrangler.jsonc) under `d1_databases[0].database_id`.

6. Apply schema and seed data.

```bash
npm run db:migrate:local
npm run db:seed:local
```

7. Run local development.

```bash
npm run dev
```

8. Run Cloudflare preview (Worker runtime).

```bash
npm run preview
```

## Deploy to Cloudflare + D1

OpenNext deployment on native Windows can fail due path/module handling. If deploy fails, run deploy from WSL or Linux/macOS.

For full production setup (account creation, API keys, DNS/domain verification, secrets, migrations, deployment, and troubleshooting), use:

- [deploy-instructions.md](./deploy-instructions.md)

1. Apply migrations on remote D1.

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

2. Set production secrets/vars (examples).

```bash
npx wrangler secret put ADMIN_ACCESS_TOKEN
npx wrangler secret put MAPBOX_ACCESS_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
```

3. Deploy worker bundle.

```bash
npm run deploy
```

## Important bindings and vars

Configured in [`wrangler.jsonc`](./wrangler.jsonc):

- `DB` (D1)
- `DISH_IMAGES_BUCKET` (R2)
- `ORIGIN_ADDRESS`, `ORIGIN_LAT`, `ORIGIN_LNG`
- `MIN_LEAD_TIME_DAYS_DEFAULT`
- `MANUAL_PAYMENT_BUFFER_HOURS`
- `MAX_DELIVERY_DISTANCE_MI`

## Testing/validation run in this workspace

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npx opennextjs-cloudflare build`

All passed.
