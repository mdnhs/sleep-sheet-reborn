-- Phase 5: Finance — Accounts, Transactions, Expenses
-- Migration: 0010_phase5_finance

CREATE TABLE IF NOT EXISTS fin_account (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  openingBalance INTEGER NOT NULL DEFAULT 0,
  currentBalance INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS fin_account_org_idx ON fin_account(organizationId);

CREATE TABLE IF NOT EXISTS fin_transaction (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  accountId TEXT NOT NULL REFERENCES fin_account(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  referenceType TEXT,
  referenceId TEXT,
  note TEXT,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS fin_transaction_org_idx ON fin_transaction(organizationId);
CREATE INDEX IF NOT EXISTS fin_transaction_org_account_idx ON fin_transaction(organizationId, accountId);
CREATE INDEX IF NOT EXISTS fin_transaction_org_type_idx ON fin_transaction(organizationId, type);

CREATE TABLE IF NOT EXISTS fin_expense (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  accountId TEXT REFERENCES fin_account(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  approvedBy TEXT,
  notes TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS fin_expense_org_idx ON fin_expense(organizationId);
CREATE INDEX IF NOT EXISTS fin_expense_org_status_idx ON fin_expense(organizationId, status);
