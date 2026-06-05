-- Phase 7: Delivery — Partners, Riders, Shipments, Tracking
-- Migration: 0011_phase7_delivery

CREATE TABLE IF NOT EXISTS delivery_partner (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS delivery_partner_org_idx ON delivery_partner(organizationId);

CREATE TABLE IF NOT EXISTS rider (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rider_org_idx ON rider(organizationId);

CREATE TABLE IF NOT EXISTS shipment (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  orderId TEXT NOT NULL REFERENCES "order"(id) ON DELETE RESTRICT,
  trackingNumber TEXT NOT NULL,
  deliveryPartnerId TEXT REFERENCES delivery_partner(id) ON DELETE SET NULL,
  riderId TEXT REFERENCES rider(id) ON DELETE SET NULL,
  originLocationId TEXT REFERENCES location(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'CREATED',
  courierStatus TEXT,
  codAmount INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS shipment_org_idx ON shipment(organizationId);
CREATE INDEX IF NOT EXISTS shipment_org_status_idx ON shipment(organizationId, status);
CREATE INDEX IF NOT EXISTS shipment_org_order_idx ON shipment(organizationId, orderId);
CREATE UNIQUE INDEX IF NOT EXISTS shipment_org_tracking_idx ON shipment(organizationId, trackingNumber);

CREATE TABLE IF NOT EXISTS shipment_event (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  shipmentId TEXT NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS shipment_event_org_idx ON shipment_event(organizationId);
CREATE INDEX IF NOT EXISTS shipment_event_shipment_idx ON shipment_event(shipmentId);
