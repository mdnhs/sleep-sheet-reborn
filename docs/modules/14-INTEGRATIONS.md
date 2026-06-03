# 14-INTEGRATIONS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Integrations Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `API_CONVENTIONS.md` / `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- `integration_settings` and `webhooks` carry `organization_id`. Each organization configures its **own** providers.
- Inbound webhooks resolve to the correct organization, then process idempotently within that tenant.
- Per-org provider credentials are stored encrypted (config), never in plaintext or client; platform-wide secrets stay in Cloudflare Secrets.
- One organization's integration config/keys are never visible to another.

---

# 1. Purpose

The Integrations module connects the ERP platform with third-party services.

It enables:

- Payments
- Delivery
- SMS
- Email
- Analytics
- Marketing
- Notifications

All external communication must go through the integration layer.

---

# 2. Integration Philosophy

Business modules must never directly communicate with third-party services.

Use:

```text
Business Module
       ↓
Integration Service
       ↓
Provider
```

---

## Incorrect

```text
Order Service
     ↓
bKash API
```

---

## Correct

```text
Order Service
      ↓
Payment Service
      ↓
bKash Provider
```

---

# 3. Integration Architecture

```text
Orders
POS
Finance
Marketing
Delivery
      │
      ▼
Integration Layer
      │
      ├── Payment Providers
      ├── Courier Providers
      ├── SMS Providers
      ├── Email Providers
      ├── Analytics Providers
      └── Webhooks
```

---

# 4. Supported Integrations

## Payments

- bKash
- Nagad
- SSLCommerz

---

## Delivery

- Pathao
- SteadFast
- RedX

---

## Marketing

- Facebook Pixel
- Meta Conversion API
- Google Analytics

---

## Communication

- SMS Gateway
- Email Provider
- WhatsApp API

---

# 5. Integration Settings

Purpose:

Store provider configuration.

---

## Fields

```text
Provider Name

API Key

Secret

Status

Environment
```

---

## Environment Types

```text
Sandbox

Production
```

---

# 6. Payment Integrations

Purpose:

Accept online payments.

---

Supported:

```text
bKash

Nagad

SSLCommerz
```

---

# 7. Payment Workflow

```text
Checkout
    ↓
Create Payment
    ↓
Redirect/User Action
    ↓
Provider Callback
    ↓
Verify Payment
    ↓
Update Order
```

---

## Rules

Payment success must be verified.

Never trust client-side responses.

---

# 8. bKash Integration

Purpose:

Mobile banking payments.

---

## Features

- Create Payment
- Execute Payment
- Refund Payment
- Payment Verification

---

## Rules

Store transaction IDs.

---

# 9. Nagad Integration

Purpose:

Mobile banking payments.

---

## Features

- Create Payment
- Verify Payment

---

## Rules

Store reference numbers.

---

# 10. SSLCommerz Integration

Purpose:

Gateway aggregation.

---

## Features

- Hosted Checkout
- Verification
- Webhook Support

---

# 11. Payment Webhooks

Purpose:

Receive payment updates.

---

## Examples

```text
Payment Success

Payment Failed

Refund Completed
```

---

## Rules

All webhooks must be verified.

---

# 12. Delivery Integrations

Purpose:

Courier automation.

---

Supported:

```text
Pathao

SteadFast

RedX
```

---

# 13. Delivery Workflow

```text
Order Confirmed
       ↓
Create Consignment
       ↓
Receive Tracking ID
       ↓
Track Delivery
```

---

## Rules

Store courier tracking numbers.

---

# 14. Pathao Integration

Purpose:

Courier management.

---

## Features

- Create Order
- Track Shipment
- Delivery Status

---

# 15. SteadFast Integration

Purpose:

Courier fulfillment.

---

## Features

- Create Consignment
- Track Shipment

---

# 16. RedX Integration

Purpose:

Courier fulfillment.

---

## Features

- Order Creation
- Shipment Tracking

---

# 17. Courier Status Mapping

External statuses must map to internal statuses.

---

## Example

```text
Courier Status

DELIVERED

↓

Internal Status

Delivered
```

---

## Rules

Never expose raw courier statuses internally.

---

# 18. SMS Integrations

Purpose:

Customer notifications.

---

## Events

```text
Order Created

Order Confirmed

Shipment Created

Delivered
```

---

# 19. SMS Providers

Provider configurable.

Examples:

```text
BulkSMS

Masking SMS

Non-Masking SMS
```

---

# 20. Email Integrations

Purpose:

Customer communication.

---

## Events

```text
Order Confirmation

Password Reset

Campaign Email
```

---

## Providers

Configurable.

Examples:

```text
Resend

SendGrid

SMTP
```

---

# 21. WhatsApp Integration

Purpose:

Customer engagement.

---

## Events

```text
Order Updates

Delivery Updates

Campaign Messages
```

---

## Status

Optional Feature.

---

# 22. Analytics Integrations

Purpose:

Measure business performance.

---

Supported:

```text
Google Analytics

Meta Pixel

Meta CAPI
```

---

# 23. Google Analytics

Track:

```text
Page View

View Item

Add To Cart

Checkout

Purchase
```

---

# 24. Facebook Pixel

Track:

```text
ViewContent

AddToCart

InitiateCheckout

Purchase
```

---

# 25. Meta Conversion API

Purpose:

Server-side tracking.

---

## Benefits

- Better attribution
- Ad blocker resistant

---

## Rules

Use alongside Pixel.

---

# 26. Campaign Attribution

Store:

```text
utm_source

utm_medium

utm_campaign
```

---

## Rules

Campaign attribution is immutable.

---

# 27. Webhook System

Purpose:

Handle external callbacks.

---

## Sources

```text
bKash

SSLCommerz

Pathao

SteadFast

RedX
```

---

# 28. Webhook Verification

Every webhook must verify:

- Signature
- Token
- Provider Source

---

## Rules

Reject unverified requests.

---

# 29. Retry Mechanism

Purpose:

Handle provider failures.

---

## Workflow

```text
Failed Request
      ↓
Retry Queue
      ↓
Retry Attempt
```

---

## Rules

Retry count configurable.

---

# 30. Integration Logging

Purpose:

Debug provider issues.

---

## Log Fields

```text
Provider

Request

Response

Status

Timestamp
```

---

## Rules

Sensitive data must be masked.

---

# 31. Error Handling

All provider failures should:

- Log Error
- Notify System
- Retry If Applicable

---

## Rules

Failures must not crash core business operations.

---

# 32. Rate Limiting

Purpose:

Prevent provider abuse.

---

## Applies To

- SMS
- Email
- Payment Requests

---

# 33. API Keys

Stored in:

```text
Cloudflare Secrets
```

---

## Never Store

```text
Database

Client Side

Source Code
```

---

# 34. Multi-Tenant Support

Integrations are **organization-scoped**.

- Every organization configures its own providers in `integration_settings` (`organization_id`).
- Inbound webhooks resolve the target organization, then process within that tenant only.
- Provider credentials and logs are isolated per organization.
- Webhook idempotency (`Idempotency-Key`) is enforced per organization.

---

# 35. Integration Reports

Supported Reports:

- Payment Success Rate
- Courier Success Rate
- SMS Delivery Rate
- Email Delivery Rate

---

# 36. Audit Logging

Mandatory For:

- Integration Creation
- Integration Update
- API Key Changes
- Provider Activation

---

# 37. Permissions

Required permissions:

```text
integrations.view

integrations.manage

integrations.webhooks

integrations.logs
```

---

# 38. API Responsibilities

Integration APIs must:

- Validate providers
- Verify callbacks
- Log activities
- Handle retries

---

## Integration APIs Must Never

❌ Expose API Secrets

❌ Trust unverified callbacks

❌ Skip logging

❌ Store credentials in database

---

# 39. Future Integrations

Future support:

```text
Messenger API

Telegram Bot

Google Merchant Center

TikTok Pixel

Daraz Integration

Amazon Integration
```

---

# 40. Golden Rules

Rule A

All third-party communication goes through Integration Layer.

---

Rule B

Secrets belong in Cloudflare Secrets.

---

Rule C

Webhooks must be verified.

---

Rule D

External statuses must be mapped internally.

---

Rule E

Provider failures must be logged.

---

Rule F

Retries must be supported.

---

Rule G

Analytics must support server-side tracking.

---

Rule H

Sensitive data must be masked.

---

Rule I

Business logic must never depend on provider responses alone.

---

Rule J

Integrations are replaceable components.

---

Rule K

Integrations are organization-scoped; each org configures its own providers and webhooks resolve per tenant.
