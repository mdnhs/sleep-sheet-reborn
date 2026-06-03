# TESTING_STRATEGY.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Testing Strategy Documentation

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `BUSINESS_RULES.md` / `RBAC.md` / `API_CONVENTIONS.md` (v2.0).

---

# 1. Purpose

Defines the testing strategy.

Goals:

- Guarantee tenant isolation (no cross-org data access)
- Prevent business-critical bugs
- Protect inventory integrity
- Ensure financial + billing accuracy
- Enforce subscription/plan limits
- Validate business workflows
- Support safe deployments

---

# 2. Testing Philosophy

The system is:

```text
Multi-Tenant (isolated)
Inventory First
Financially Sensitive
Subscription Gated
Multi-Outlet
Transaction Driven
```

Therefore: business logic + tenant isolation testing is more important than UI testing. Tenant isolation is the **highest-priority** test category — a leak is a critical security failure.

---

# 3. Testing Pyramid

```text
Unit Tests

60%

↓

Integration Tests

30%

↓

E2E Tests

10%
```

---

# 4. Testing Levels

## Unit Tests

Test:

- Services
- Utilities
- Calculations
- Business Rules

---

## Integration Tests

Test:

- Database
- Repositories
- APIs
- Module Interactions

---

## E2E Tests

Test:

- Complete business workflows

---

# 5. Critical Business Flows

These flows are mandatory.

Must always be tested.

---

## Flow 1

Purchase

↓

Receive Inventory

↓

Inventory Updated

---

## Flow 2

Order

↓

Reserve Inventory

↓

Payment

↓

Delivery

↓

Inventory Deduction

---

## Flow 3

POS Sale

↓

Payment

↓

Inventory Deduction

↓

Transaction Creation

---

## Flow 4

Stock Transfer

↓

Approve

↓

Receive

↓

Inventory Updated

---

## Flow 5

Order Return

↓

Inventory Restore

↓

Refund

---

# 5b. Tenant Isolation Tests (HIGHEST PRIORITY)

Run every phase. Must never regress.

## Read isolation
```text
Org A creates product P
Org B queries products
Expected: B never sees P  (404 on direct fetch of P)
```

## Write isolation
```text
Org B attempts update/delete on Org A resource
Expected: 404 (not 403), no mutation
```

## Scope injection
```text
Request supplies organization_id in body/query
Expected: ignored; org_id taken from tenant context only
```

## Per-org uniqueness
```text
Org A SKU "X" and Org B SKU "X"
Expected: both allowed (unique is per-org, not global)
```

## Aggregate isolation
```text
Reports / analytics / inventory totals
Expected: include only the active org's rows
```

## Platform scope
```text
SUPER_ADMIN cross-org access
Expected: allowed only via platform routes; org users blocked from platform routes
```

---

# 5c. Subscription & Plan Tests

## Limit enforcement
```text
Plan products limit = 100, usage = 100
Create product → Expected: 422 PLAN_LIMIT_EXCEEDED
```

## Subscription gating
```text
Subscription EXPIRED/SUSPENDED → write
Expected: 402; read may remain (config)
```

## Lifecycle
```text
Trial → pay → ACTIVE; period end → EXPIRED → grace → SUSPENDED
Expected: correct transitions + access gate behavior
```

## Feature flags
```text
funnels flag off → funnel endpoint
Expected: 403 FEATURE_DISABLED
```

## Usage counters
```text
Create / archive resource
Expected: per-org usage count stays accurate (cache + source agree)
```

---

# 5d. Billing & Webhook Tests

```text
Provider success webhook (verified) → invoice PAID + subscription activated
Provider failure → invoice FAILED
Duplicate webhook (same Idempotency-Key) → no double activation / double charge
Unverified webhook → rejected
```

Invoices immutable; refund creates new record.

---

# 5e. Marketplace Tests

```text
Install theme → organization_themes row, R2 key stored
Activate theme → exactly one active per org (previous deactivated)
Install funnel → funnels row from template
Theme/funnel install → no ERP data mutation
Asset belongs to installing org only (isolation)
```

---

# 5f. Demo Data Tests

```text
Import into Org A → rows tagged is_demo + demo_batch_id; visible only to Org A
Import respects plan limits → over-limit dataset capped/rejected (422)
Import via services → inventory seeded through movements; no negative stock; rules hold
Blocked if real (non-demo) transactional data exists
Clear → hard-deletes only is_demo rows; real data untouched
Import/clear idempotent (per batch); double-call no duplicate / no error
Cross-tenant: Org B never sees Org A demo data
```

---

# 6. Unit Testing

Target:

```text
80%+
```

Coverage. Tenancy + billing services target 100% on enforcement paths.

---

# 7. Services Requiring Unit Tests

Mandatory:

```text
Inventory Service

Order Service

POS Service

Purchase Service

Finance Service
```

---

# 8. Inventory Tests

Must Validate:

- Stock Increase
- Stock Decrease
- Reservation
- Release Reservation
- Transfers
- Adjustments

---

## Example

```text
Stock = 100

Reserve = 10

Available = 90
```

Expected:

Pass.

---

# 9. Inventory Negative Stock Test

Example:

```text
Stock = 5

Order = 10
```

Expected:

Fail.

---

## Rule

Inventory cannot be negative.

---

# 10. Reservation Tests

Test:

```text
Reserve
Release
Expire
```

---

## Validate

Reserved quantity is always accurate.

---

# 11. Inventory Movement Tests

Every inventory change must create movement.

---

Example:

```text
Purchase Receive
```

Must create:

```text
inventory_movement
```

record.

---

# 12. Order Tests

Must Validate:

- Create Order
- Confirm Order
- Cancel Order
- Return Order
- Refund Order

---

# 13. Order Creation Test

Expected:

```text
Order Created

Inventory Reserved
```

---

# 14. Order Cancellation Test

Expected:

```text
Reservation Released
```

---

# 15. Order Delivery Test

Expected:

```text
Inventory Deducted
```

---

# 16. POS Tests

Must Validate:

- Sale Creation
- Payment
- Return

---

# 17. POS Inventory Test

Expected:

```text
Sale Complete

↓

Inventory Deduct
```

Immediately.

---

# 18. POS Return Test

Expected:

```text
Inventory Restore
```

---

# 19. Purchase Tests

Must Validate:

- Purchase Creation
- Receiving
- Return

---

# 20. Purchase Receiving Test

Expected:

```text
Inventory Increase
```

---

# 21. Purchase Return Test

Expected:

```text
Inventory Decrease
```

---

# 22. Finance Tests

Must Validate:

- Transactions
- Wallet
- Due
- Expenses

---

# 23. Transaction Tests

Expected:

```text
Transaction Created

Account Updated
```

---

# 24. Wallet Tests

Expected:

```text
Credit

Debit

Balance
```

Always accurate.

---

# 25. Customer Due Tests

Validate:

```text
Purchase

Payment

Outstanding Due
```

---

# 26. Supplier Due Tests

Validate:

```text
Purchase

Supplier Payment

Remaining Due
```

---

# 27. Loyalty Tests

Must Validate:

- Earn Points
- Redeem Points
- Reverse Points

---

# 28. Delivery Tests

Must Validate:

- Shipment Creation
- Delivery
- Return To Origin

---

# 29. Shipment Delivery Test

Expected:

```text
Order Delivered
```

status update.

---

# 30. Campaign Tests

Must Validate:

- Visit Tracking
- Conversion Tracking
- Attribution

---

# 31. Campaign Conversion Test

Expected:

```text
Campaign Order

↓

Conversion Recorded
```

---

# 32. RBAC Tests

Must Validate:

- Role Access
- Permission Checks

---

# 33. Permission Test (two-scope)

```text
Cashier → Finance Module        Expected: denied
Org user → /api/v1/admin/*      Expected: denied (platform scope)
SUPER_ADMIN → tenant business   Expected: only via platform routes
OWNER → billing.manage          Expected: allowed
```

---

# 34. Authentication Tests

Must Validate:

- Login
- Logout
- Session Expiry

---

# 35. API Tests

Must Validate:

- Validation
- Authorization
- Error Handling

---

# 36. API Response Tests

Every API must return:

```ts
{
 success: boolean;
 data?: unknown;
 error?: string;
}
```

---

# 37. Integration Tests

Test:

- D1
- Better Auth
- Cloudinary

---

# 38. Payment Integration Tests

Must Validate:

- Success
- Failure
- Duplicate Callbacks

---

# 39. Webhook Tests

Must Validate:

```text
Verified

Rejected

Duplicate
```

---

# 40. Courier Integration Tests

Must Validate:

- Shipment Creation
- Tracking Updates

---

# 41. Multi-Outlet Tests

Critical.

---

## Test

Outlet A:

```text
100
```

Stock

Outlet B:

```text
50
```

Stock

Sale From Outlet A:

Expected:

```text
Outlet A = 99

Outlet B = 50
```

---

# 42. Transfer Tests

Example:

```text
Transfer 20
```

Expected:

```text
Source -20

Destination +20
```

---

# 43. Database Tests

Validate:

- Foreign Keys
- Unique Constraints
- Relations

---

# 44. Constraint Tests

Examples:

```text
Duplicate SKU

Duplicate Barcode

Duplicate Order Number
```

Expected:

Fail.

---

# 45. Audit Tests

Must Validate:

- Inventory Adjustment
- Price Change
- Role Change

Creates:

```text
audit_log
```

record.

---

# 46. E2E Tests

Mandatory Flows:

---

## E2E 01

Customer Order

↓

Payment

↓

Delivery

↓

Inventory Deduction

---

## E2E 02

POS Sale

↓

Payment

↓

Inventory Deduction

---

## E2E 03

Purchase

↓

Receiving

↓

Inventory Increase

---

## E2E 04

Transfer

↓

Receive

↓

Inventory Updated

---

## E2E 05

Campaign

↓

Landing Page

↓

Order

↓

Revenue

---

## E2E 06

Sign Up

↓

Create Organization

↓

Trial Started

↓

Subscribe (pay)

↓

Active → Business Operations

---

## E2E 07

Funnel

↓

Landing Page

↓

Order (attribution)

↓

Conversion Recorded

---

## E2E 08

Plan Limit Reached

↓

Upgrade Plan

↓

Action Now Allowed

---

# 47. Performance Tests

Targets:

```text
Product Search < 300ms

Order Create < 500ms

POS Sale < 300ms

Inventory Query < 200ms
```

---

# 48. Load Testing

Test:

- Concurrent Orders
- Concurrent POS Sales
- Concurrent Reservations

---

# 49. Concurrency Tests

Critical.

---

Example:

```text
Stock = 1

User A Checkout

User B Checkout
```

Expected:

Only one succeeds.

---

# 50. Security Tests

Validate:

- Authentication
- Authorization
- Rate Limits
- Input Validation

---

# 51. SQL Injection Tests

Expected:

Blocked.

---

# 52. XSS Tests

Expected:

Sanitized.

---

# 53. Regression Testing

Required Before:

- Production Release
- Inventory Changes
- Finance Changes

---

# 54. Release Checklist

Must Pass:

```text
Unit Tests

Integration Tests

E2E Tests

Security Tests
```

---

# 55. CI/CD Rules

Every Pull Request:

```text
Run Tests

↓

Run Lint

↓

Run Type Check

↓

Deploy
```

---

# 56. Testing Tools

Recommended:

```text
Vitest

Testing Library

Playwright

MSW
```

---

# 57. Critical Zero-Tolerance Bugs

Never Release If:

```text
Cross-Tenant Data Leak
Tenant Scope Bypass
Plan Limit Bypass
Negative Inventory
Double Deduction
Double Payment / Double Activation
Wrong Due Calculation
Wrong Wallet Balance
Permission Bypass (org or platform)
```

---

# 58. Golden Rules

Rule A

Inventory integrity is the highest priority.

---

Rule B

Financial accuracy is mandatory.

---

Rule C

Critical workflows require E2E tests.

---

Rule D

Every bug must have a regression test.

---

Rule E

Multi-outlet stock must remain isolated.

---

Rule F

Reservations must be tested.

---

Rule G

Payment callbacks must be idempotent.

---

Rule H

Permissions must be enforced server-side.

---

Rule I

Audit logs must be validated.

---

Rule J

No production deployment without passing tests.

---

Rule K

Tenant isolation is the highest-priority test; it runs every phase and never regresses.

---

Rule L

Plan limits, subscription gating, and feature flags are tested server-side.

---

Rule M

Billing webhooks are tested for verification + idempotency (no double activation/charge).

---

Rule N

Per-org uniqueness (not global) is validated for SKU/slug/order_number.

---

Rule O

Demo data import is rule-compliant, plan-capped, tagged, isolated, and fully reversible.
