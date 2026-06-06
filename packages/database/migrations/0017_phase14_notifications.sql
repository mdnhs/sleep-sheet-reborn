-- Phase 14: Notifications
-- Migration: 0017_phase14_notifications

CREATE TABLE IF NOT EXISTS notification (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  userId TEXT,
  type TEXT NOT NULL DEFAULT 'INFO',
  title TEXT NOT NULL,
  body TEXT,
  entityType TEXT,
  entityId TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS notification_org_idx ON notification(organizationId);
CREATE INDEX IF NOT EXISTS notification_org_read_idx ON notification(organizationId, read);
CREATE INDEX IF NOT EXISTS notification_org_user_idx ON notification(organizationId, userId);
