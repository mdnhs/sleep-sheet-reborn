#!/usr/bin/env node
/**
 * Push all secrets from .dev.vars to Cloudflare Workers.
 *
 * Usage:
 *   node scripts/push-secrets.mjs               # push to both workers
 *   node scripts/push-secrets.mjs --api-only     # push to sleep-sheet-reborn-api only
 *   node scripts/push-secrets.mjs --web-only     # push to sleep-sheet-reborn only
 *   node scripts/push-secrets.mjs --dry-run      # print what would be pushed, push nothing
 *
 * Requires: wrangler login (run once: pnpm wrangler login)
 */

import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DEV_VARS_PATH = resolve(ROOT, '.dev.vars')

// ── Config ────────────────────────────────────────────────────────────────────

const WORKERS = {
  api: 'sleep-sheet-reborn-api',
  web: 'sleep-sheet-reborn',
}

// Which secrets go to which worker.
// Keys not listed here are skipped (e.g. NEXT_PUBLIC_* not needed in API worker).
const API_SECRETS = new Set([
  'BETTER_AUTH_SECRET',
  'TRUSTED_ORIGINS',
  'SUPER_ADMIN_EMAIL',
  'WEB_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_PASS',
  'NEXT_PUBLIC_EMAIL_USER',
  'STEADFAST_API_KEY',
  'STEADFAST_SECRET_KEY',
])

const WEB_SECRETS = new Set([
  'BETTER_AUTH_SECRET',
  'TRUSTED_ORIGINS',
  'SUPER_ADMIN_EMAIL',
  'WEB_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_PASS',
  'NEXT_PUBLIC_EMAIL_USER',
  'STEADFAST_API_KEY',
  'STEADFAST_SECRET_KEY',
])

// ── Parse .dev.vars ───────────────────────────────────────────────────────────

function parseDevVars(path) {
  const lines = readFileSync(path, 'utf8').split('\n')
  const vars = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

// ── Push a single secret ──────────────────────────────────────────────────────

function pushSecret(key, value, workerName, dryRun) {
  const display = value.length > 6
    ? value.slice(0, 3) + '***' + value.slice(-3)
    : '***'
  console.log(`  ${key} = ${display}  →  ${workerName}`)
  if (dryRun) return

  // wrangler secret put reads value from stdin
  execSync(
    `printf '%s' "${value.replace(/"/g, '\\"')}" | pnpm wrangler secret put ${key} --name ${workerName}`,
    { stdio: ['pipe', 'inherit', 'inherit'], cwd: ROOT }
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const apiOnly = args.includes('--api-only')
const webOnly = args.includes('--web-only')

if (dryRun) console.log('\n⚠  DRY RUN — nothing will be pushed\n')

let vars
try {
  vars = parseDevVars(DEV_VARS_PATH)
} catch {
  console.error(`Error: cannot read ${DEV_VARS_PATH}`)
  console.error('Copy .dev.vars.example to .dev.vars and fill in values.')
  process.exit(1)
}

const targets = []
if (!webOnly) targets.push({ name: WORKERS.api, allowed: API_SECRETS })
if (!apiOnly) targets.push({ name: WORKERS.web, allowed: WEB_SECRETS })

let errors = 0
for (const { name, allowed } of targets) {
  console.log(`\n── ${name} ──────────────────────────────────`)
  for (const [key, value] of Object.entries(vars)) {
    if (!allowed.has(key)) continue
    if (!value) {
      console.log(`  ${key}  (empty — skipped)`)
      continue
    }
    try {
      pushSecret(key, value, name, dryRun)
    } catch (err) {
      console.error(`  ✗ ${key}: ${err.message}`)
      errors++
    }
  }
}

console.log(dryRun ? '\nDry run complete.' : `\nDone. ${errors ? `${errors} error(s).` : 'All secrets pushed.'}`)
if (errors) process.exit(1)
