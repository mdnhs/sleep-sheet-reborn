import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@repo/database/src/schema'

export type TestDb = ReturnType<typeof createTestDb>

/** Creates an isolated in-memory SQLite DB with the full schema for each test. */
export function createTestDb() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })

  // Bootstrap schema inline so tests don't depend on migration files
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      phone TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      activeOrganizationId TEXT
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      expiresAt INTEGER,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      metadata TEXT,
      customDomain TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'TRIAL',
      currency TEXT NOT NULL DEFAULT 'BDT',
      timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS member (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'EMPLOYEE',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      invitedAt INTEGER,
      joinedAt INTEGER,
      createdAt INTEGER NOT NULL,
      UNIQUE(organizationId, userId)
    );

    CREATE TABLE IF NOT EXISTS invitation (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      expiresAt INTEGER NOT NULL,
      inviterId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS subscription_plan (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      price INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BDT',
      interval TEXT NOT NULL DEFAULT 'monthly',
      trialDays INTEGER NOT NULL DEFAULT 14,
      maxUsers INTEGER,
      maxProducts INTEGER,
      maxOrders INTEGER,
      maxLocations INTEGER,
      features TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      planId TEXT NOT NULL REFERENCES subscription_plan(id),
      status TEXT NOT NULL DEFAULT 'TRIAL',
      trialEndsAt INTEGER,
      currentPeriodStart INTEGER,
      currentPeriodEnd INTEGER,
      cancelledAt INTEGER,
      suspendedAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `)

  return db
}

const now = Date.now()

export function makeUser(id: string, email: string) {
  return {
    id,
    name: `User ${id}`,
    email,
    emailVerified: false,
    image: null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    phone: null,
    address: null,
  }
}

export function makeOrg(id: string, slug: string) {
  return {
    id,
    name: `Org ${slug}`,
    slug,
    logo: null,
    metadata: null,
    customDomain: null,
    status: 'TRIAL' as const,
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }
}

export function makeMember(id: string, orgId: string, userId: string, role: schema.Member['role'] = 'OWNER') {
  return {
    id,
    organizationId: orgId,
    userId,
    role,
    status: 'ACTIVE' as const,
    invitedAt: null,
    joinedAt: new Date(now),
    createdAt: new Date(now),
  }
}
