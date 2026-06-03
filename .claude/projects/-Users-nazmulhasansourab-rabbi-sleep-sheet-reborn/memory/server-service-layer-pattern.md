---
name: server-service-layer-pattern
description: How feature server routes are structured — thin Hono controllers delegating to a service layer
metadata:
  type: project
---

Feature server code follows: `features/<name>/server/route.ts` = thin Hono controller (parse req → validate → call service → map errors to JSON). `features/<name>/server/<name>.service.ts` = all business logic (DB, calc, validation), imports `db` directly, throws `ServiceError` for known client-facing failures.

Shared helpers in `lib/`:
- `lib/service-error.ts` — `ServiceError(message, status)` + `isServiceError()`. Status typed as `ErrorStatusCode` (error codes only, NO 2xx).
- `lib/require-admin.ts` — `requireAdmin` middleware (403) and `requireRole(...roles)` factory. Run after `sessionMiddleware`. Note: settings/steadfast keep an inline 401 guard instead because their original returned 401 not 403 — preserve exact status when refactoring.

**Why ErrorStatusCode excludes 2xx:** Hono RPC client (`InferResponseType`) narrows `response.json()` by `response.ok`. If a route's error branch does `c.json({error}, error.status)` where `status` could be 200, the client can't drop the `{error}` shape after `if(!response.ok)`, breaking consumers like `use-login.ts`. Keeping error status off 2xx fixes it.

**Why error handling is inlined in handlers (not a helper):** a catch helper typed `(c: any, ...)` collapses Hono's chained-`.route()`/AppType inference — the RPC type loses every route after the first. Always `return c.json(...)` directly in both success and error branches. A helper that only returns a string/status (not `c`) is fine. See [[hono-rpc-type-inference]].
