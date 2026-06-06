-- Phase 6: Customers — Customers, Groups, Addresses, Wallet, Loyalty
-- Migration: 0012_phase6_customers

CREATE TABLE IF NOT EXISTS customer_group (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discountPercent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_group_org_idx ON customer_group(organizationId);
CREATE UNIQUE INDEX IF NOT EXISTS customer_group_org_name_idx ON customer_group(organizationId, name);

CREATE TABLE IF NOT EXISTS customer (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  groupId TEXT REFERENCES customer_group(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dateOfBirth INTEGER,
  type TEXT NOT NULL DEFAULT 'REGISTERED',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  walletBalance INTEGER NOT NULL DEFAULT 0,
  loyaltyPoints INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_org_idx ON customer(organizationId);
CREATE INDEX IF NOT EXISTS customer_org_status_idx ON customer(organizationId, status);
CREATE UNIQUE INDEX IF NOT EXISTS customer_org_phone_idx ON customer(organizationId, phone);

CREATE TABLE IF NOT EXISTS customer_address (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  customerId TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'SHIPPING',
  name TEXT,
  phone TEXT,
  addressLine TEXT NOT NULL,
  area TEXT,
  city TEXT,
  postalCode TEXT,
  isDefault INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_address_org_idx ON customer_address(organizationId);
CREATE INDEX IF NOT EXISTS customer_address_customer_idx ON customer_address(customerId);

CREATE TABLE IF NOT EXISTS customer_wallet_transaction (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  customerId TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balanceAfter INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  referenceType TEXT,
  referenceId TEXT,
  note TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_wallet_txn_org_idx ON customer_wallet_transaction(organizationId);
CREATE INDEX IF NOT EXISTS customer_wallet_txn_customer_idx ON customer_wallet_transaction(customerId);

CREATE TABLE IF NOT EXISTS customer_loyalty_transaction (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  customerId TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  balanceAfter INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  referenceType TEXT,
  referenceId TEXT,
  note TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_loyalty_txn_org_idx ON customer_loyalty_transaction(organizationId);
CREATE INDEX IF NOT EXISTS customer_loyalty_txn_customer_idx ON customer_loyalty_transaction(customerId);
