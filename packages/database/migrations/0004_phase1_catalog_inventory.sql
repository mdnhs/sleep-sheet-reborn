-- Phase 1: Catalog + Inventory tables (all org-scoped)

CREATE TABLE `brand` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brand_org_slug_idx` ON `brand` (`organizationId`,`slug`);--> statement-breakpoint
CREATE INDEX `brand_org_idx` ON `brand` (`organizationId`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`parentId` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_org_slug_idx` ON `category` (`organizationId`,`slug`);--> statement-breakpoint
CREATE INDEX `category_org_idx` ON `category` (`organizationId`);--> statement-breakpoint
CREATE TABLE `unit` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`name` text NOT NULL,
	`shortName` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `unit_org_idx` ON `unit` (`organizationId`);--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`categoryId` text,
	`brandId` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_org_slug_idx` ON `product` (`organizationId`,`slug`);--> statement-breakpoint
CREATE INDEX `product_org_idx` ON `product` (`organizationId`);--> statement-breakpoint
CREATE TABLE `product_variant` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`productId` text NOT NULL,
	`unitId` text,
	`sku` text NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`costPrice` integer DEFAULT 0 NOT NULL,
	`sellingPrice` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variant_org_sku_idx` ON `product_variant` (`organizationId`,`sku`);--> statement-breakpoint
CREATE INDEX `product_variant_org_idx` ON `product_variant` (`organizationId`);--> statement-breakpoint
CREATE INDEX `product_variant_product_idx` ON `product_variant` (`productId`);--> statement-breakpoint
CREATE TABLE `product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`productId` text NOT NULL,
	`cloudinaryPublicId` text NOT NULL,
	`url` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_image_org_idx` ON `product_image` (`organizationId`);--> statement-breakpoint
CREATE INDEX `product_image_product_idx` ON `product_image` (`productId`);--> statement-breakpoint
CREATE TABLE `branch` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branch_org_code_idx` ON `branch` (`organizationId`,`code`);--> statement-breakpoint
CREATE INDEX `branch_org_idx` ON `branch` (`organizationId`);--> statement-breakpoint
CREATE TABLE `location` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`branchId` text,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branchId`) REFERENCES `branch`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `location_org_code_idx` ON `location` (`organizationId`,`code`);--> statement-breakpoint
CREATE INDEX `location_org_idx` ON `location` (`organizationId`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`variantId` text NOT NULL,
	`locationId` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variantId`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`locationId`) REFERENCES `location`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_org_variant_location_idx` ON `inventory` (`organizationId`,`variantId`,`locationId`);--> statement-breakpoint
CREATE INDEX `inventory_org_idx` ON `inventory` (`organizationId`);--> statement-breakpoint
CREATE TABLE `inventory_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`variantId` text NOT NULL,
	`locationId` text NOT NULL,
	`movementType` text NOT NULL,
	`quantity` integer NOT NULL,
	`referenceType` text,
	`referenceId` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variantId`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`locationId`) REFERENCES `location`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `inventory_movement_org_idx` ON `inventory_movement` (`organizationId`);--> statement-breakpoint
CREATE INDEX `inventory_movement_variant_idx` ON `inventory_movement` (`variantId`);--> statement-breakpoint
CREATE TABLE `transfer` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`fromLocationId` text NOT NULL,
	`toLocationId` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`approvedBy` text,
	`receivedBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fromLocationId`) REFERENCES `location`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`toLocationId`) REFERENCES `location`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `transfer_org_idx` ON `transfer` (`organizationId`);--> statement-breakpoint
CREATE TABLE `transfer_item` (
	`id` text PRIMARY KEY NOT NULL,
	`transferId` text NOT NULL,
	`variantId` text NOT NULL,
	`quantity` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`transferId`) REFERENCES `transfer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variantId`) REFERENCES `product_variant`(`id`) ON UPDATE no action ON DELETE restrict
);
