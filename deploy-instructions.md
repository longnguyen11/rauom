# Deploy Instructions (Cloudflare + D1) - Full Runbook

This guide is written for this repository in `c:\Users\caych\workspace\rauom` and assumes production deploy target is **Cloudflare Workers + D1**.

## Quick deploy commands

Once setup is complete, the two main production commands are:

```powershell
npm run db:migrate:remote
npm run deploy
```

If native Windows deploy fails, use WSL or GitHub Actions (section 8).

## 0) What you are deploying

- App runtime: Next.js via OpenNext on Cloudflare Workers
- Database: Cloudflare D1 (`rauom-db`)
- Routing + DNS: Cloudflare
- Optional integrations used by code:
  - Mapbox (delivery distance quotes)
  - Resend (order + newsletter emails)
  - Cloudflare Turnstile (checkout anti-bot)
  - Cloudflare Access (recommended for `/admin`)

## 1) One-time account setup

### 1.1 Cloudflare account

1. Go to `https://dash.cloudflare.com/sign-up`.
2. Create account and verify your email.
3. In Cloudflare dashboard, open **Billing** and add a payment method.
4. In dashboard, note your **Account ID** (right sidebar or account settings).
5. Complete Workers onboarding once and register a `workers.dev` subdomain:
   - Open `https://dash.cloudflare.com/<your-account-id>/workers/onboarding`
   - Choose any available subdomain (example: `rauom-prod`)
   - Finish onboarding

Important: GitHub Actions runs in non-interactive mode. If this onboarding is not done first, deploy fails with:
`You need to register a workers.dev subdomain before publishing to workers.dev`.

### 1.2 Install tooling on your machine

1. Install Node.js 20+ (`https://nodejs.org/en/download`).
2. Confirm versions:

```powershell
node -v
npm -v
```

3. Install git if needed (`https://git-scm.com/downloads`).

### 1.3 Sign in Wrangler CLI

From project root:

```powershell
npx wrangler login
npx wrangler whoami
```

You should see your Cloudflare account and permissions.

## 2) Prepare this project

1. Open terminal in repo root:

```powershell
cd c:\Users\caych\workspace\rauom
```

2. Install dependencies:

```powershell
npm install
```

3. Generate Cloudflare runtime types (safe to rerun any time):

```powershell
npm run cf-typegen
```

## 3) D1 database setup

### 3.1 Use existing DB or create a new one

This repo is currently configured with:

- DB name: `rauom-db`
- DB id in `wrangler.jsonc`: `821b444b-034f-40fa-a538-9b3f8da0903f`

If you want a fresh DB:

```powershell
npx wrangler d1 create rauom-db
```

Then copy returned `database_id` into [wrangler.jsonc](./wrangler.jsonc) at:

- `d1_databases[0].database_id`

### 3.2 Apply migrations (production)

```powershell
npm run db:migrate:remote
```

This applies:

- `migrations/0001_init.sql`
- `migrations/0002_seed.sql`
- `migrations/0003_required_dishes.sql`

Immediately after migrations, deploy the app:

```powershell
npm run deploy
```

### 3.3 Verify D1 data

```powershell
npx wrangler d1 execute rauom-db --remote --command "SELECT slug, status FROM dishes LIMIT 10;"
```

You should see seeded dishes (like `pho`, `pho-chay`, `goi-cuon`, `bo-kho`, `banh-xeo`).

## 4) Configure required keys/services

## 4.1 Mapbox (required for delivery quotes)

### Sign up + get token

1. Go to `https://account.mapbox.com/auth/signup/`.
2. Create/verify account.
3. Open **Tokens** page: `https://account.mapbox.com/access-tokens/`.
4. Copy your **Default public token** (or create a new one).
5. For best security, create a dedicated token with only:
   - Geocoding API
   - Directions API

### Add token to Cloudflare Worker secrets

```powershell
npx wrangler secret put MAPBOX_ACCESS_TOKEN
```

Paste token when prompted.

## 4.2 Resend (required for transactional email)

### Sign up + domain setup

1. Go to `https://resend.com/signup`.
2. Create account.
3. In Resend dashboard, go to **Domains**.
4. Add your sending domain (example: `rauom.com` or subdomain `mail.rauom.com`).
5. Resend shows DNS records (SPF/DKIM). Add these DNS records in Cloudflare DNS.
6. Wait until domain status is **Verified** in Resend.

### Create API key

1. In Resend dashboard, go to **API Keys**.
2. Create API key with sending permission.
3. Copy key (shown once).

### Set Resend secrets

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put RESEND_OWNER_EMAIL
```

Use values like:

- `RESEND_FROM_EMAIL`: `orders@yourdomain.com`
- `RESEND_OWNER_EMAIL`: owner inbox to receive new order notifications

## 4.3 Cloudflare Turnstile (optional but strongly recommended)

### Create Turnstile site key + secret

1. Go to `https://dash.cloudflare.com/?to=/:account/turnstile`.
2. Click **Add site**.
3. Add hostname(s): your production domain.
4. Choose widget mode (Managed recommended).
5. Copy:
   - Site key (frontend)
   - Secret key (backend)

### Add backend secret

```powershell
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Note: current checkout UI has a manual token field, not embedded widget yet. If secret is set, backend requires a valid token.

## 4.4 Admin fallback token (if not using Access yet)

Generate a strong random token:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set it:

```powershell
npx wrangler secret put ADMIN_ACCESS_TOKEN
```

This enables `/admin/login` token-based auth fallback.

## 4.5 Cloudflare Access for `/admin` (recommended production path)

1. In Cloudflare dashboard, open **Zero Trust**.
2. If first time, follow onboarding.
3. Go to **Access > Applications > Add an application**.
4. Choose **Self-hosted**.
5. Application domain/path:
   - Domain: your production domain
   - Path: `/admin*`
6. Policy:
   - Include: your email(s) or identity provider group
   - Require identity verification
7. Save and enable app.

Keep `ADMIN_ACCESS_TOKEN` as emergency fallback, but Access should be primary protection.

## 5) Configure runtime vars in `wrangler.jsonc`

Check [wrangler.jsonc](./wrangler.jsonc):

- `name`: worker name (`rau-om`)
- `d1_databases` binding points to your D1 ID
- `vars` section values:
  - `NEXTJS_ENV=production`
  - `ORIGIN_ADDRESS`
  - `ORIGIN_LAT`
  - `ORIGIN_LNG`
  - `TIMEZONE=America/New_York`
  - `MIN_LEAD_TIME_DAYS_DEFAULT=1`
  - `MANUAL_PAYMENT_BUFFER_HOURS=12`
  - `MAX_DELIVERY_DISTANCE_MI=30`

These are non-secret config values and safe in source control.

## 6) Local pre-deploy checks

Run all before production deploy:

```powershell
npm run lint
npm run typecheck
npm run build
```

Optional worker bundle check:

```powershell
npx opennextjs-cloudflare build
```

## 7) Windows deployment caveat (important)

OpenNext deploy on native Windows can fail with missing `resvg.wasm?module` temp path issues.

### Recommended: deploy from WSL

1. Install WSL (if not installed):

```powershell
wsl --install
```

2. Reboot if prompted.
3. Open Ubuntu/WSL shell.
4. In WSL, clone/open repo and run:

```bash
npm install
npx wrangler login
npm run deploy
```

If WSL is not available, use Linux/macOS CI runner for deploy.

## 8) Deploy with GitHub Actions (recommended for Windows users)

This repo includes a workflow at:

- `.github/workflows/deploy.yml`

### 8.1 Add required GitHub repository secrets

In GitHub: **Repo Settings > Secrets and variables > Actions > New repository secret**.

Create:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

`CLOUDFLARE_ACCOUNT_ID` for this setup: `206bcb4ae42b51fb1b298c1a5ac283b6`.

### 8.2 Create Cloudflare API token for GitHub

1. Go to `https://dash.cloudflare.com/profile/api-tokens`.
2. Click **Create Token**.
3. Start from **Edit Cloudflare Workers** template, then include D1 access.
4. Ensure permissions include:
   - `Account - Workers Scripts:Edit`
   - `Account - D1:Edit`
5. Scope the token to your account.
6. Copy token and save it as `CLOUDFLARE_API_TOKEN` in GitHub secrets.

### 8.3 Run deploy workflow

1. Push to `main`, or
2. In GitHub, open **Actions > Deploy to Cloudflare > Run workflow**.

Workflow steps:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run db:migrate:remote`
5. `npm run deploy`

## 9) Deploy to production manually

After keys, vars, and migrations are ready:

```powershell
npm run deploy
```

This runs:

1. Next.js production build
2. OpenNext worker bundle generation
3. Wrangler deploy to Cloudflare Workers

After success, Wrangler outputs worker URL (for example `https://rau-om.<subdomain>.workers.dev`).

## 10) Attach custom domain (recommended)

1. In Cloudflare dashboard, open **Workers & Pages > rau-om > Settings > Domains & Routes**.
2. Add custom domain (example `rauom.com` or `www.rauom.com`).
3. If domain is already on Cloudflare, route activation is mostly automatic.
4. If domain is external, update nameservers at registrar to Cloudflare first.

## 11) Post-deploy smoke test checklist

Run these checks immediately after deploy:

1. Home page loads and dish list appears.
2. Dish detail page opens and Add-to-Cart works.
3. Checkout:
   - Pickup estimate works.
   - Delivery estimate works for in-range address.
   - Delivery blocks if >30 miles.
4. Submit test order and verify:
   - Order row exists in `orders` table.
   - Email sent to owner + customer (if Resend configured).
5. Admin page:
   - Access protection is active.
   - Status update works.
   - Dish create/status updates work.

Useful query:

```powershell
npx wrangler d1 execute rauom-db --remote --command "SELECT order_number,status,total_after_tax_cents,created_at_utc FROM orders ORDER BY created_at_utc DESC LIMIT 10;"
```

## 12) Ongoing deploy workflow (every update)

For each new release:

1. Pull latest code.
2. If schema changed, add migration SQL file (next sequence number).
3. Run checks:

```powershell
npm run lint
npm run typecheck
npm run build
```

4. Apply remote migrations:

```powershell
npm run db:migrate:remote
```

5. Deploy:

```powershell
npm run deploy
```

## 13) Backup and recovery basics

### D1 backup export

```powershell
npx wrangler d1 export rauom-db --remote --output rauom-db-backup.sql
```

### Restore idea

- Create new D1 DB
- Import backup SQL into new DB
- Update `database_id` in `wrangler.jsonc`
- Redeploy

## 14) Troubleshooting

### `code: 10042` on R2 bucket creation

Your Cloudflare account has not enabled R2. This project currently deploys without R2 binding, so deploy can proceed.

### Missing `resvg.wasm?module` during deploy

Deploy from WSL/Linux/macOS instead of native Windows.

### `MAPBOX_ACCESS_TOKEN is not configured`

Set it with:

```powershell
npx wrangler secret put MAPBOX_ACCESS_TOKEN
```

### No emails sent

Check:

- `RESEND_API_KEY` secret exists
- sending domain is verified in Resend
- `RESEND_FROM_EMAIL` uses verified domain
- `RESEND_OWNER_EMAIL` is valid mailbox

### Admin inaccessible

- If Access enabled, verify your identity policy allows your user.
- If token fallback used, set `ADMIN_ACCESS_TOKEN` and login at `/admin/login`.

## 15) Exact files involved in deploy

- [wrangler.jsonc](./wrangler.jsonc)
- [package.json](./package.json)
- [migrations/0001_init.sql](./migrations/0001_init.sql)
- [migrations/0002_seed.sql](./migrations/0002_seed.sql)
- [open-next.config.ts](./open-next.config.ts)
- [deploy-instructions.md](./deploy-instructions.md)

## 16) Recommended next hardening tasks

1. Add real Turnstile widget to checkout UI and pass token automatically.
2. Put `/admin*` behind Cloudflare Access only, disable token fallback.
3. Add CI pipeline (lint/typecheck/build/deploy from Linux runner).
4. Add uptime checks and error alerts for `/api/orders`.
