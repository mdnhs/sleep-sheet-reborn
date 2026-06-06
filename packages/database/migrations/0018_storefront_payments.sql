-- Storefront online payments
-- Migration: 0018_storefront_payments

CREATE TABLE IF NOT EXISTS order_payment (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  providerRef TEXT,
  idempotencyKey TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS order_payment_org_idx ON order_payment(organizationId);
CREATE INDEX IF NOT EXISTS order_payment_order_idx ON order_payment(orderId);
CREATE UNIQUE INDEX IF NOT EXISTS order_payment_idempotency_idx ON order_payment(idempotencyKey);
