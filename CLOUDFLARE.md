# Deploying to Cloudflare Workers (D1 + OpenNext)

This app runs on **Cloudflare Workers** with a **D1 (SQLite)** database via
`@opennextjs/cloudflare`. Images go to **Cloudinary**, email uses **Gmail SMTP**
via `worker-mailer` (plain nodemailer cannot run on Workers).

This guide takes you from a fresh clone to a **live deployment on your own
Cloudflare account**. Follow top to bottom.

---

## 0. Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free plan works).
- **Node.js 20+** and **pnpm** (`npm i -g pnpm`).
- The project source (this repo).

Install dependencies:

```bash
pnpm install
```

`wrangler` (the Cloudflare CLI) ships as a dev dependency — run it with
`pnpm wrangler ...` or `pnpm dlx wrangler ...`. Log in once:

```bash
pnpm wrangler login
```

---

## 1. Point the project at YOUR Cloudflare account

Everything account-specific lives in [`wrangler.jsonc`](wrangler.jsonc).

### 1a. Create your own D1 database

```bash
pnpm wrangler d1 create sleep-sheet-reborn
```

This prints a block like:

```jsonc
{
  "binding": "DB",
  "database_name": "sleep-sheet-reborn",
  "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Open [`wrangler.jsonc`](wrangler.jsonc) and replace the existing
`database_id` under `d1_databases` with **your** new id. Keep
`"database_name": "sleep-sheet-reborn"` and `"binding": "DB"` as-is — the npm
scripts and app code reference those names.

> Want a different database name? Then also update the name in the
> `db:migrate:local` / `db:migrate:remote` scripts in
> [`package.json`](package.json) and the seed command in step 3. Easiest path:
> keep the name `sleep-sheet-reborn`.

### 1b. (Optional) Rename the Worker

`"name": "sleep-sheet-reborn"` in [`wrangler.jsonc`](wrangler.jsonc) becomes your
`*.workers.dev` subdomain. Change it if you want a different URL.

---

## 2. Apply the database schema (migrations)

Migrations live in [`migrations/d1/`](migrations/d1/).

```bash
pnpm db:migrate:remote      # apply schema to the LIVE D1 database
# pnpm db:migrate:local     # ...or to the local dev D1 instead
```

---

## 3. Load seed / starter data (optional)

A data dump is bundled at [`migrations/data-d1.sql`](migrations/data-d1.sql):

```bash
pnpm wrangler d1 execute sleep-sheet-reborn --remote --file=./migrations/data-d1.sql
```

Notes:
- Array columns (`productImages`, `tags`, …) and campaign JSON columns are
  stored as JSON strings; booleans as `1/0`; timestamps as ISO strings.
- New image uploads go straight to Cloudinary
  (`https://res.cloudinary.com/...` URLs).
- Large tables may hit D1 file-size limits — split the SQL file if the import
  fails.

---

## 4. Configure secrets and variables

The app needs the following keys (see [`.dev.vars.example`](.dev.vars.example)):

| Key | What it is | Secret? |
|-----|-----------|---------|
| `JWT_SECRET` | random string for signing auth tokens | yes |
| `EMAIL_PASS` | Gmail **App Password** | yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | yes |
| `STEADFAST_API_KEY` | Steadfast courier API key | yes |
| `STEADFAST_SECRET_KEY` | Steadfast courier secret | yes |
| `NEXT_PUBLIC_APP_URL` | public URL of YOUR deployment | no |
| `NEXT_PUBLIC_EMAIL_USER` | Gmail address that sends mail | no |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | no |
| `CLOUDINARY_API_KEY` | Cloudinary API key | no |

### 4a. Local development

Copy the example and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` is git-ignored — never commit real secrets.

### 4b. Production (Cloudflare)

Push secrets one at a time (you'll be prompted to paste each value):

```bash
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put EMAIL_PASS              # Gmail App Password
pnpm wrangler secret put CLOUDINARY_API_SECRET
pnpm wrangler secret put STEADFAST_API_KEY
pnpm wrangler secret put STEADFAST_SECRET_KEY
```

Non-secret vars can either be pushed the same way, or added to a `vars` block in
[`wrangler.jsonc`](wrangler.jsonc):

```jsonc
"vars": {
  "NEXT_PUBLIC_APP_URL": "https://your-worker.workers.dev",
  "NEXT_PUBLIC_EMAIL_USER": "you@gmail.com",
  "CLOUDINARY_CLOUD_NAME": "your-cloud",
  "CLOUDINARY_API_KEY": "your-key"
}
```

> **Gmail App Password:** enable 2-Step Verification on the Google account, then
> create an App Password at <https://myaccount.google.com/apppasswords>. Use that
> 16-char value for `EMAIL_PASS` (not the normal account password).
>
> **Cloudinary:** sign up at <https://cloudinary.com>; cloud name + key + secret
> are on the dashboard.

---

## 5. Develop, preview, deploy

```bash
pnpm dev        # next dev, with D1 binding via initOpenNextCloudflareForDev()
pnpm preview    # build with OpenNext + run the Workers runtime locally
pnpm cf:deploy  # build + deploy to Cloudflare
```

After `pnpm cf:deploy`, wrangler prints the live URL
(`https://<name>.workers.dev`). Set `NEXT_PUBLIC_APP_URL` to that URL (or your
custom domain) and redeploy so absolute links/emails point to the right place.

### Type generation

Regenerate binding/var TypeScript types after changing
[`wrangler.jsonc`](wrangler.jsonc):

```bash
pnpm cf-typegen
```

---

## Deploy checklist (handoff summary)

- [ ] `pnpm install`
- [ ] `pnpm wrangler login`
- [ ] `pnpm wrangler d1 create sleep-sheet-reborn` → paste `database_id` into [`wrangler.jsonc`](wrangler.jsonc)
- [ ] `pnpm db:migrate:remote`
- [ ] (optional) load seed data — step 3
- [ ] push secrets — step 4b
- [ ] set `NEXT_PUBLIC_APP_URL` + non-secret vars
- [ ] `pnpm cf:deploy`

---

## Architecture notes (Postgres → SQLite caveats)

- **enums → strings**: see [`lib/enums.ts`](lib/enums.ts) (allowed values unchanged).
- **`String[]` / `Json` → TEXT (JSON)**: (de)serialized at the route boundary via
  [`lib/json-fields.ts`](lib/json-fields.ts). Clients still receive real arrays.
- **`mode: 'insensitive'`** removed (Postgres-only). SQLite `LIKE` is
  case-insensitive for ASCII.
- **Analytics**: `DATE_TRUNC`/`INTERVAL` raw SQL replaced with JS aggregation.
- **D1 access** is request-scoped ([`lib/db.ts`](lib/db.ts) compatibility shim)
  because D1 bindings only exist per request.

## Verify on a live D1

- Date/time storage + comparison in analytics date ranges and OTP `expiresAt`.
- The bulk [`data-d1.sql`](migrations/data-d1.sql) import for large tables (split
  if it hits D1 file-size limits).
</content>
</invoke>
