-- Immutable audit trail for all critical mutations (product, inventory, billing, etc.)

CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`action` text NOT NULL,
	`actorId` text,
	`changes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `audit_log_org_idx` ON `audit_log` (`organizationId`);--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`organizationId`,`entityType`,`entityId`);
