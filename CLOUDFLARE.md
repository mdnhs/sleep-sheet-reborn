# Deploying to Cloudflare

Two Workers in this monorepo:

| Worker | Path | Description |
|--------|------|-------------|
| `sleep-sheet-reborn` | `apps/web/` | Next.js via OpenNext |
| `sleep-sheet-reborn-api` | `apps/worker/` | Hono REST API |

Both share one **D1** database and one **R2** bucket.

---

## 0. Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free plan works).
- Node.js 22+ and pnpm (`npm i -g pnpm`).
- `pnpm install` in repo root.

Log in to Cloudflare:

```bash
pnpm wrangler login
```

---

## 1. Create Cloudflare resources (one-time)

### 1a. D1 database

```bash
pnpm wrangler d1 create sleep-sheet-reborn
```

Paste the printed `database_id` into **both**:
- `apps/worker/wrangler.jsonc` → `d1_databases[0].database_id`
- `apps/web/wrangler.jsonc` → `d1_databases[0].database_id`

### 1b. R2 bucket (marketplace assets)

```bash
pnpm wrangler r2 bucket create sleep-sheet-reborn-marketplace
```

The bucket name is already wired in both `wrangler.jsonc` files as binding `BUCKET`.
No ID to paste — R2 uses the bucket name directly.

> **Local dev:** wrangler simulates R2 locally via `.wrangler/state/`. No extra setup.

### 1c. Apply D1 migrations

```bash
pnpm db:migrate:remote        # applies packages/database/migrations/ to live D1
# pnpm db:migrate:local       # local D1 only
```

---

## 2. Environment variables

### 2a. Local development

Copy and fill in:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` is git-ignored — never commit real secrets.

### 2b. Production secrets (push to Cloudflare)

Required secrets for **both** workers:

```bash
# Better Auth (must be ≥32 chars — generate: openssl rand -hex 32)
pnpm wrangler secret put BETTER_AUTH_SECRET --name sleep-sheet-reborn-api
pnpm wrangler secret put BETTER_AUTH_SECRET --name sleep-sheet-reborn

# Comma-separated allowed origins
pnpm wrangler secret put TRUSTED_ORIGINS --name sleep-sheet-reborn-api
pnpm wrangler secret put TRUSTED_ORIGINS --name sleep-sheet-reborn

# Platform super-admin email
pnpm wrangler secret put SUPER_ADMIN_EMAIL --name sleep-sheet-reborn-api
pnpm wrangler secret put SUPER_ADMIN_EMAIL --name sleep-sheet-reborn

# Web app URL (e.g. https://your-worker.workers.dev)
pnpm wrangler secret put WEB_URL --name sleep-sheet-reborn-api
pnpm wrangler secret put WEB_URL --name sleep-sheet-reborn

# Public URLs
pnpm wrangler secret put NEXT_PUBLIC_APP_URL --name sleep-sheet-reborn
pnpm wrangler secret put NEXT_PUBLIC_API_URL --name sleep-sheet-reborn

# Cloudinary (image storage)
pnpm wrangler secret put CLOUDINARY_CLOUD_NAME --name sleep-sheet-reborn-api
pnpm wrangler secret put CLOUDINARY_API_KEY    --name sleep-sheet-reborn-api
pnpm wrangler secret put CLOUDINARY_API_SECRET --name sleep-sheet-reborn-api

# Gmail SMTP (App Password, not login password)
pnpm wrangler secret put EMAIL_PASS             --name sleep-sheet-reborn-api
pnpm wrangler secret put NEXT_PUBLIC_EMAIL_USER --name sleep-sheet-reborn-api

# Steadfast courier (optional)
pnpm wrangler secret put STEADFAST_API_KEY    --name sleep-sheet-reborn-api
pnpm wrangler secret put STEADFAST_SECRET_KEY --name sleep-sheet-reborn-api
```

---

## 3. Local development

```bash
pnpm dev          # Next.js dev server (port 3000) — D1 via initOpenNextCloudflareForDev()
pnpm worker:dev   # Hono API worker (port 8787) — wrangler dev
```

Both use `.dev.vars` for secrets and local D1/R2 state in `.wrangler/state/`.

---

## 4. Deploy manually

```bash
# API worker
pnpm worker:deploy

# Next.js web (build then deploy)
pnpm web:cf:deploy
```

Or from the monorepo root:

```bash
pnpm web:cf:build    # build only (outputs to apps/web/.open-next/)
pnpm web:cf:deploy   # build + deploy
```

---

## 5. CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` triggers on every push to `main`:

1. **migrate** — applies D1 migrations remotely
2. **deploy-api** — deploys the Hono worker (runs in parallel with deploy-web after migrate)
3. **deploy-web** — builds OpenNext + deploys the Next.js worker

### GitHub repository secrets to set

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers + D1 + R2 write permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `BETTER_AUTH_SECRET` | ≥32-char random string |
| `TRUSTED_ORIGINS` | Comma-separated allowed origins |
| `SUPER_ADMIN_EMAIL` | Platform super-admin email |
| `WEB_URL` | Live web URL (e.g. `https://sleep-sheet-reborn.workers.dev`) |
| `NEXT_PUBLIC_APP_URL` | Same as WEB_URL (public) |
| `NEXT_PUBLIC_API_URL` | API worker URL (e.g. `https://sleep-sheet-reborn-api.workers.dev`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_PASS` | Gmail App Password |
| `NEXT_PUBLIC_EMAIL_USER` | Gmail address |
| `STEADFAST_API_KEY` | (optional) Steadfast courier key |
| `STEADFAST_SECRET_KEY` | (optional) Steadfast courier secret |

### Create a Cloudflare API token

Dashboard → **My Profile → API Tokens → Create Token**:
- Template: **Edit Cloudflare Workers**
- Add permissions: **D1 Edit**, **R2 Edit**
- Scope: your account

---

## 6. TypeScript types

After changing either `wrangler.jsonc`, regenerate CF env types:

```bash
# From apps/web/
pnpm cf-typegen

# Or from root
pnpm --filter @repo/web cf-typegen
```

---

## Deploy checklist

- [ ] `pnpm wrangler login`
- [ ] `pnpm wrangler d1 create sleep-sheet-reborn` → paste `database_id` into both `wrangler.jsonc`
- [ ] `pnpm wrangler r2 bucket create sleep-sheet-reborn-marketplace`
- [ ] `pnpm db:migrate:remote`
- [ ] Push all secrets (step 2b) to both workers
- [ ] `pnpm worker:deploy` + `pnpm web:cf:deploy`
- [ ] Set GitHub Actions secrets (step 5) for automated deploys
