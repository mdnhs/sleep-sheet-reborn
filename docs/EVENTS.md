# EVENTS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Domain Events Documentation

Version: 2.0

> Aligned with `SRS.md` (v2.0), `SAAS_REQUIREMENTS.md` (v1.0), `ARCHITECTURE.md` / `BUSINESS_RULES.md` (v2.0).

---

# 1. Purpose

Defines all business events. Events decouple modules, trigger workflows, create audit logs, send notifications, update reports — within a single organization (or platform scope for SaaS events).

---

# 2. Event Philosophy

Modules communicate through events, not direct calls.

```text
Action → Event → Consumers
```

Correct:

```text
Order Service → order.created → { Inventory, Growth, Analytics } listeners
```

Layer rule: ERP Core emits events; Storefront/Growth/SaaS listen. ERP Core must not listen to Growth/SaaS events (no upward dependency).

---

# 3. Event Structure

Every event carries `organizationId` (except platform-scope SaaS events, which carry it as the subject).

```ts
{
  eventId: string;
  eventName: string;        // domain.action
  organizationId: string;   // tenant scope — present on every event
  scope: "organization" | "platform";
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
```

Rule: a consumer must only act within the event's `organizationId`. Never fan out across organizations.

---

# 4. Event Naming Convention

```text
domain.action
```

Examples: `order.created`, `inventory.stock_reserved`, `payment.completed`, `subscription.activated`, `theme.installed`.

---

# 5. SaaS / Organization Events (scope: platform)

## organization.created
Triggered: organization registered. Consumers: Subscription (start trial), Analytics.

## organization.suspended / organization.reactivated / organization.cancelled
Triggered: status change by SUPER_ADMIN or billing. Consumers: Access Gate, Notifications, Analytics.

## organization.settings_updated
Triggered: profile/currency/timezone/logo changed.

## demo.import_started / demo.import_completed / demo.cleared
Triggered: demo data import begins/finishes, or demo data cleared. Consumers: Notifications, Analytics.
Payload: `{ organizationId; datasetId; batchId; counts? }`

Payload (organization.*):
```ts
{ organizationId: string; status?: string; }
```

---

# 6. Subscription & Billing Events (scope: platform)

## subscription.trial_started
Triggered: org created / trial begins. Consumers: Notifications.

## subscription.activated
Triggered: plan paid/activated. Consumers: Access Gate, Analytics (MRR).

## subscription.renewed
Triggered: renewal succeeded.

## subscription.expired
Triggered: period end without renewal. Consumers: Access Gate (enter grace/suspend), Notifications.

## subscription.suspended
Triggered: grace ended / manual. Consumers: Access Gate (block writes).

## subscription.plan_changed
Payload: `{ organizationId; fromPlanId; toPlanId; }` Consumers: Limits (recompute), Feature Flags.

## plan.limit_reached
Triggered: org hits a plan limit. Payload: `{ organizationId; dimension; limit; usage; }` Consumers: Notifications (upgrade prompt), Analytics.

## invoice.created / invoice.paid / invoice.failed / invoice.refunded
Triggered: billing lifecycle. Consumers: Finance (platform), Notifications, Analytics.

## feature_flag.changed
Payload: `{ organizationId; flag; enabled; }`

---

# 7. Marketplace Events (scope: organization)

## theme.installed / theme.activated / theme.updated / theme.uninstalled
Consumers: Storefront, Audit.

## funnel.installed / funnel.imported / funnel.cloned / funnel.updated
Consumers: Growth, Audit.

## app.installed / app.configured / app.activated
Consumers: App runtime, Audit.

Payload (marketplace.*):
```ts
{ organizationId: string; assetId: string; version?: string; }
```

---

# 8. Inventory Events

## inventory.stock_received  — Purchase receiving completed
```ts
{ organizationId; variantId; locationId; quantity; }
```

## inventory.stock_reserved  — Order created
```ts
{ organizationId; orderId; variantId; quantity; }
```

## inventory.stock_released  — Order cancelled
## inventory.stock_deducted  — Order delivered / POS sale completed
## inventory.adjusted        — Manual adjustment
## inventory.transferred     — Transfer completed

---

# 9. Product Events

`product.created` · `product.updated` · `product.archived` · `product.price_changed`

---

# 10. Order Events

```text
order.created     → consumers: Inventory, Growth, Analytics
order.confirmed   → consumers: Delivery
order.processing
order.shipped
order.delivered   → consumers: Finance, Loyalty, Analytics
order.cancelled   → consumers: Inventory
order.returned
order.refunded    → consumers: Wallet, Finance
```

Order events include `source` + attribution (`campaignId`/`funnelId`/UTM) in payload when present.

---

# 11. POS Events

`pos.sale_created` · `pos.sale_completed` (→ Inventory, Finance, Reports) · `pos.sale_returned` · `pos.register_opened` · `pos.register_closed`

---

# 12. Purchase Events

`purchase.created` · `purchase.approved` · `purchase.received` (→ Inventory, Supplier Ledger) · `purchase.returned`

---

# 13. Supplier Events

`supplier.created` · `supplier.updated` · `supplier.payment_recorded` · `supplier.archived`

---

# 14. Customer Events

`customer.created` · `customer.updated`
`customer.wallet_credited` / `customer.wallet_debited` — `{ organizationId; customerId; amount; }`
`customer.loyalty_earned` / `customer.loyalty_redeemed` — `{ organizationId; customerId; points; }`

---

# 15. Finance Events

`payment.created` · `payment.completed` (→ Orders, Finance) · `payment.failed` · `expense.created` · `expense.approved` · `transaction.created`

---

# 16. Delivery Events

`shipment.created` · `shipment.assigned` · `shipment.picked_up` · `shipment.in_transit` · `shipment.delivered` (→ Orders, Finance) · `shipment.failed` · `shipment.returned`

---

# 17. Growth & Marketing Events

`campaign.created` · `campaign.published`
`campaign.visit` — `{ organizationId; campaignId; visitorId?; utm?; }`
`campaign.converted` — `{ organizationId; campaignId; orderId; revenue; }`
`funnel.visit` — `{ organizationId; funnelId; visitorId?; utm?; }`
`funnel.converted` — `{ organizationId; funnelId; orderId; revenue; }`
`coupon.applied` · `coupon.removed`

---

# 18. Storefront Events

`page.created` · `page.updated` · `page.published` · `blog.created` · `blog.published` · `menu.updated`

---

# 19. Employee Events

`employee.created` · `employee.updated` · `employee.suspended` · `attendance.checked_in` · `attendance.checked_out` · `payroll.generated` · `payroll.paid`

---

# 20. Notification Events

`notification.sms_sent` · `notification.email_sent` · `notification.push_sent` · `notification.failed`

---

# 21. Integration Events

`webhook.received` · `webhook.verified` · `webhook.failed` · `integration.connected` · `integration.disconnected`

(Billing webhooks: bKash/Nagad/SSLCommerz → emit `invoice.*`. Courier webhooks: Pathao/RedX/SteadFast → emit `shipment.*`.)

---

# 22. Audit Events

## audit.created — after critical actions
Examples: price change, stock adjustment, role change, payment approval, subscription change, organization suspension, theme activation.

---

# 23. Event Consumers (org-scoped unless noted)

```text
Inventory     ← order.created, order.cancelled, purchase.received
Finance       ← payment.completed, shipment.delivered, pos.sale_completed
Delivery      ← order.confirmed
Loyalty       ← order.delivered
Growth        ← order.created (attribution)
Analytics     ← campaign.visit, campaign.converted, funnel.visit, funnel.converted, order.delivered
Access Gate   ← subscription.activated/expired/suspended, organization.suspended   [platform]
Limits        ← subscription.plan_changed
SaaS Analytics← subscription.*, invoice.*, organization.created   [platform: MRR/ARR/churn]
Storefront    ← theme.installed/activated/updated
```

---

# 24. Event Storage

V1: no event store; events transient, used during execution.

Future: `event_store` table (org-scoped) for replay/audit.

---

# 25. Event Reliability Rules

Events must be idempotent, retryable, traceable.

- `order.created` firing twice must not reserve inventory twice.
- Billing webhooks use `Idempotency-Key`; `invoice.paid` twice must not double-activate.
- Every event/consumer is bound to `organizationId`; a retry never crosses tenants.

---

# 26. Event Ordering Rules

Critical sequence:

```text
order.created → inventory.stock_reserved → payment.completed →
order.confirmed → shipment.created → shipment.delivered → inventory.stock_deducted
```

SaaS sequence:

```text
organization.created → subscription.trial_started →
invoice.paid → subscription.activated
```

---

# 27. Cloudflare Workers Strategy

```text
Service → Emit Event → Internal Event Bus → Listeners
```

Avoid `Service → call 10 other services`.

---

# 28. Golden Rules

```text
A.  Events describe something that already happened; they are immutable.
B.  Every event carries organizationId; consumers act only within that scope.
C.  Events are idempotent; consumers handle retries safely.
D.  Events contain no business logic; payloads are minimal.
E.  Modules communicate through events whenever possible.
F.  ERP Core emits; Storefront/Growth/SaaS listen — no upward dependency.
G.  Critical operations (incl. subscription/billing changes) emit events.
H.  Event names follow domain.action.
I.  Retries and fan-out never cross organizations.
```
