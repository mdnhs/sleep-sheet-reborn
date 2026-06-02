// SQLite/D1 has no native enums. These mirror the enums that used to live in
// the Prisma schema, so existing `Enum.VALUE` access and z.nativeEnum() keep
// working. Stored in the DB as plain strings.

export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CampaignStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  ENDED: "ENDED",
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  COD: "COD",
  CARD: "CARD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const TestimonialUserRole = {
  FASHION_ENTHUSIAST: "FASHION_ENTHUSIAST",
  CUSTOMER: "CUSTOMER",
  INFLUENCER: "INFLUENCER",
  OTHER: "OTHER",
} as const;
export type TestimonialUserRole =
  (typeof TestimonialUserRole)[keyof typeof TestimonialUserRole];

export const OTPType = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  LOGIN_OTP: "LOGIN_OTP",
} as const;
export type OTPType = (typeof OTPType)[keyof typeof OTPType];
