-- Drop old prototype tables that conflict with new multi-tenant schema.
-- The old "User" table used JWT auth + no org scoping; replaced by Better Auth tables.
DROP TABLE IF EXISTS "product_reviews";
DROP TABLE IF EXISTS "order_timeline_events";
DROP TABLE IF EXISTS "order_items";
DROP TABLE IF EXISTS "payments";
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "cart_items";
DROP TABLE IF EXISTS "carts";
DROP TABLE IF EXISTS "wishlist_items";
DROP TABLE IF EXISTS "wishlists";
DROP TABLE IF EXISTS "otp_verifications";
DROP TABLE IF EXISTS "shipping_methods";
DROP TABLE IF EXISTS "OTPVerification";
DROP TABLE IF EXISTS "ShippingMethod";
DROP TABLE IF EXISTS "Wishlist";
DROP TABLE IF EXISTS "WishlistItem";
DROP TABLE IF EXISTS "Cart";
DROP TABLE IF EXISTS "CartItem";
DROP TABLE IF EXISTS "Payment";
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "OrderTimelineEvent";
DROP TABLE IF EXISTS "User";
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`expiresAt` integer,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`activeOrganizationId` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`phone` text,
	`address` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`expiresAt` integer NOT NULL,
	`inviterId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text DEFAULT 'EMPLOYEE' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`invitedAt` integer,
	`joinedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_org_user_idx` ON `member` (`organizationId`,`userId`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`metadata` text,
	`customDomain` text,
	`status` text DEFAULT 'TRIAL' NOT NULL,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`timezone` text DEFAULT 'Asia/Dhaka' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_customDomain_unique` ON `organization` (`customDomain`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`planId` text NOT NULL,
	`status` text DEFAULT 'TRIAL' NOT NULL,
	`trialEndsAt` integer,
	`currentPeriodStart` integer,
	`currentPeriodEnd` integer,
	`graceEndsAt` integer,
	`autoRenew` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planId`) REFERENCES `subscription_plan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_organizationId_unique` ON `subscription` (`organizationId`);--> statement-breakpoint
CREATE TABLE `subscription_invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`subscriptionId` text NOT NULL,
	`provider` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`periodStart` integer,
	`periodEnd` integer,
	`paidAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscriptionId`) REFERENCES `subscription`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscription_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`billingCycle` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`limitUsers` integer DEFAULT 5 NOT NULL,
	`limitOutlets` integer DEFAULT 1 NOT NULL,
	`limitWarehouses` integer DEFAULT 1 NOT NULL,
	`limitProducts` integer DEFAULT 100 NOT NULL,
	`limitOrdersPerMonth` integer DEFAULT 500 NOT NULL,
	`limitThemes` integer DEFAULT 1 NOT NULL,
	`limitFunnels` integer DEFAULT 3 NOT NULL,
	`featureFlags` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_plan_name_unique` ON `subscription_plan` (`name`);