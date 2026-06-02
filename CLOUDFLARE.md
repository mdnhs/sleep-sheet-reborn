# Deploying to Cloudflare Workers (D1 + OpenNext)

This app was migrated off Neon (Postgres) to **Cloudflare D1 (SQLite)** and now
runs on **Workers** via `@opennextjs/cloudflare`. Images go to **Cloudinary**,
email uses **Gmail SMTP** via `worker-mailer` (plain nodemailer cannot run on
Workers).

## One-time setup

```bash
wrangler login

# 1. Create the D1 database, then paste the printed database_id into wrangler.jsonc
wrangler d1 create sleep-sheet-reborn

# 2. Apply the D1 migrations
pnpm db:migrate:remote       # applies migrations to the live D1 db
# pnpm db:migrate:local      # ...or to the local dev D1 instead
```

## Migrate existing Neon data

```bash
# Point at the OLD Postgres db, then generate INSERTs and load them into D1.
NEON_DATABASE_URL="postgresql://...neon..." npx tsx scripts/migrate-neon-to-d1.ts
wrangler d1 execute sleep-sheet-reborn --remote --file=./migrations/data-d1.sql
```

Array columns (productImages, tags, …) and the campaign JSON columns are written
as JSON strings; booleans become 1/0; timestamps become ISO strings.

> Existing product images were on the local filesystem. New uploads go straight
> to Cloudinary (absolute `https://res.cloudinary.com/...` URLs). Old image URLs
> that pointed at `/api/products/images/<file>` no longer resolve — re-upload
> those products' images, or migrate the files into Cloudinary and update the
> rows.

## Secrets / vars

Local: copy `.dev.vars.example` → `.dev.vars`.
Production:

```bash
wrangler secret put JWT_SECRET
wrangler secret put EMAIL_PASS              # Gmail App Password
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put STEADFAST_API_KEY
wrangler secret put STEADFAST_SECRET_KEY
# Non-secret vars (NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_EMAIL_USER,
# CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY) can go in [vars] in wrangler.jsonc
```

## Dev / preview / deploy

```bash
pnpm dev        # next dev, with D1 binding via initOpenNextCloudflareForDev()
pnpm preview    # build with OpenNext + run the Workers runtime locally
pnpm cf:deploy  # build + deploy to Cloudflare
```

## What changed (Postgres → SQLite caveats)

- **enums → strings**: see `lib/enums.ts` (allowed values unchanged).
- **String[] / Json → TEXT (JSON)**: (de)serialized at the route boundary via
  `lib/json-fields.ts`. Clients still receive real arrays.
- **`mode: 'insensitive'`** removed (Postgres-only). SQLite `LIKE` is
  case-insensitive for ASCII.
- **Analytics**: `DATE_TRUNC`/`INTERVAL` raw SQL replaced with JS aggregation.
- **D1 access** is request-scoped (`lib/db.ts` compatibility shim for now)
  because D1 bindings only exist per request.

## Needs verification on a live D1 (could not be tested locally)

- Date/time storage + comparison in analytics date ranges and OTP `expiresAt`.
- The bulk `data-d1.sql` import for large tables (D1 file-size limits — split if
  needed).
- Prefer the data-migration path or direct `wrangler d1 execute` imports until
  Drizzle migrations/seeds are added.
