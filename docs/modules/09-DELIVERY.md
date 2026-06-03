# 09-DELIVERY.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Delivery Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Shipments, shipment events, delivery partners, and riders carry `organization_id`.
- `tracking_number` is unique **per organization**.
- Each organization configures its own courier integrations (Pathao, RedX, SteadFast); courier status syncs into the org's shipment events.
- All delivery queries auto-scoped to the resolved tenant.

---

# 1. Purpose

The Delivery module manages the shipment and fulfillment process.

It integrates with:

- Orders
- Customers
- Delivery Partners
- Riders
- Finance

The goal is to ensure successful delivery of customer orders.

---

# 2. Delivery Philosophy

Delivery is a fulfillment process.

Delivery does not:

- Create orders
- Modify products
- Manage inventory

Delivery only handles shipment and order fulfillment.

Inventory deductions follow Order Workflow rules.

---

# 3. Delivery Architecture

```text
Order
  │
  ▼
Shipment
  │
  ├── Delivery Zone
  │
  ├── Delivery Partner
  │
  ├── Rider
  │
  └── Tracking
```

---

# 4. Core Entities

## Shipment

Represents a deliverable package.

---

## Delivery Zone

Geographical delivery coverage.

---

## Delivery Partner

Third-party courier company.

---

## Rider

Person responsible for delivery.

---

## Tracking Event

Shipment activity history.

---

# 5. Shipment Lifecycle

```text
Created
   ↓
Assigned
   ↓
Picked Up
   ↓
In Transit
   ↓
Delivered
```

---

## Alternative Paths

```text
Created
   ↓
Cancelled
```

---

```text
Created
   ↓
Returned
```

---

# 6. Shipment Creation

Purpose:

Generate delivery shipment from order.

---

## Trigger

Order Confirmed

---

## Actions

- Create shipment
- Generate tracking number
- Assign delivery zone

---

## Rules

Cancelled orders cannot generate shipments.

---

# 7. Shipment Statuses

Supported statuses:

```text
Created

Assigned

Picked Up

In Transit

Delivered

Failed

Returned

Cancelled
```

---

# 8. Delivery Zones

Purpose:

Define delivery coverage areas.

---

## Examples

```text
Dhaka City

Gazipur

Narayanganj

Chattogram
```

---

## Uses

- Delivery Charges
- Courier Assignment
- Delivery Estimates

---

# 9. Delivery Charges

Purpose:

Calculate delivery cost.

---

## Types

```text
Inside City

Outside City

Express Delivery
```

---

## Rules

Charges configurable through settings.

---

# 10. Delivery Partners

Supported:

```text
Pathao

SteadFast

RedX

Paperfly

Sundarban
```

---

## Rules

Partners are configurable.

New partners can be added later.

---

# 11. Courier Assignment

Purpose:

Assign shipment to delivery partner.

---

## Flow

```text
Shipment Created
        ↓
Assign Partner
        ↓
Create Courier Consignment
```

---

## Rules

Shipment can have only one active courier.

---

# 12. Rider Management

Purpose:

Track delivery personnel.

---

## Rider Information

- Name
- Phone
- Status
- Assigned Deliveries

---

## Statuses

```text
Available

Busy

Inactive
```

---

# 13. Rider Assignment

Purpose:

Assign shipment to rider.

---

## Flow

```text
Shipment
    ↓
Assign Rider
    ↓
Delivery
```

---

## Rules

One shipment can have one active rider.

---

# 14. Tracking System

Purpose:

Track shipment movement.

---

## Example Events

```text
Shipment Created

Assigned To Rider

Picked Up

In Transit

Delivered
```

---

## Rules

Tracking events cannot be edited.

---

# 15. Delivery Timeline

Every shipment maintains timeline history.

---

## Example

```text
09:00 Created

10:30 Assigned

12:00 Picked Up

17:00 Delivered
```

---

# 16. Delivery Confirmation

Purpose:

Confirm successful delivery.

---

## Actions

- Update shipment
- Update order
- Create timeline event

---

## Rules

Only delivered shipments complete orders.

---

# 17. Failed Delivery

Purpose:

Handle unsuccessful deliveries.

---

## Reasons

- Customer Unavailable
- Wrong Address
- Phone Unreachable
- Refused Delivery

---

## Actions

- Update shipment
- Create tracking event

---

# 18. Return To Origin (RTO)

Purpose:

Return undelivered package.

---

## Workflow

```text
Failed Delivery
       ↓
Return To Origin
       ↓
Received Back
```

---

## Actions

- Create return shipment
- Update order

---

# 19. COD Collection

Purpose:

Cash collection from customer.

---

## Workflow

```text
Delivered
      ↓
Collect Cash
      ↓
Courier Settlement
```

---

## Rules

Only COD orders require collection.

---

# 20. Courier Settlement

Purpose:

Receive COD payments from courier.

---

## Actions

- Record settlement
- Create financial transaction

---

# 21. Delivery Estimates

Purpose:

Provide expected delivery dates.

---

## Examples

```text
Inside City

1-2 Days
```

---

```text
Outside City

2-5 Days
```

---

# 22. Order Integration

Shipments belong to orders.

---

## Rules

One order may have:

- One Shipment

V1

---

## Future

Multiple shipments per order.

---

# 23. Customer Integration

Customers receive:

- Tracking Updates
- Delivery Notifications

---

## Channels

- SMS
- Push Notifications
- Email

---

# 24. Inventory Integration

Delivery module does not directly modify inventory.

---

## Ecommerce Flow

Inventory reserved:

```text
Order Created
```

---

Inventory deducted:

```text
Order Delivered
```

---

## Rules

Delivery must follow order workflow.

---

# 25. Finance Integration

Delivery creates:

- Delivery Charges
- Courier Settlements

---

## Rules

Financial records must be auditable.

---

# 26. Delivery Reports

Supported Reports:

- Delivery Summary
- Courier Performance
- Rider Performance
- Delivery Time Analysis
- Failed Deliveries
- RTO Report

---

# 27. Courier Performance Metrics

Track:

- Total Deliveries
- Delivery Success Rate
- Average Delivery Time
- Return Rate

---

# 28. Rider Performance Metrics

Track:

- Deliveries Completed
- Failed Deliveries
- Average Delivery Time

---

# 29. Multi-Outlet Support

Shipments can originate from:

- Warehouse
- Outlet

---

## Rules

Origin location must be recorded.

---

# 30. Notifications

Send notifications for:

- Shipment Created
- Shipment Assigned
- Out For Delivery
- Delivered
- Failed Delivery

---

# 31. Permissions

Required permissions:

```text
delivery.view

delivery.create

delivery.assign

delivery.track

delivery.reports
```

---

# 32. Audit Logging

Mandatory For:

- Shipment Creation
- Rider Assignment
- Courier Assignment
- Delivery Completion
- Failed Delivery
- RTO Processing

---

# 33. API Responsibilities

Delivery APIs must:

- Create shipments
- Track status changes
- Generate tracking events
- Create audit logs

---

## Delivery APIs Must Never

❌ Modify inventory directly

❌ Modify order totals

❌ Skip tracking events

❌ Bypass services

---

# 34. Common Mistakes To Avoid

❌ Deducting inventory inside delivery module

❌ Marking shipment delivered without order update

❌ Deleting tracking history

❌ Multiple active couriers

❌ Missing delivery events

---

# 35. Future Enhancements

Future support:

- Multi-Shipment Orders
- Live GPS Tracking
- Delivery Route Optimization
- Rider Mobile App
- Auto Courier Selection

Not included in V1.

---

# 36. Golden Rules

Rule A

Delivery manages fulfillment, not inventory.

---

Rule B

Every shipment belongs to an order.

---

Rule C

Tracking history is immutable.

---

Rule D

Failed deliveries create tracking events.

---

Rule E

Delivered shipments complete fulfillment.

---

Rule F

COD settlements create financial records.

---

Rule G

Delivery partners are configurable.

---

Rule H

Rider assignments must be traceable.

---

Rule I

Inventory changes follow order workflows.

---

Rule J

Delivery performance must be measurable.

---

Rule K

Delivery is organization-scoped; tracking_number is unique per organization.
