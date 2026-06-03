import { z } from "zod";

/** Stock In — receive new stock, optionally as a tracked batch/lot. */
export const StockInSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  batchNumber: z.string().trim().optional(),
  costPrice: z.number().nonnegative().optional(),
  supplierName: z.string().trim().optional(),
  manufactureDate: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional(),
});
export type StockInValues = z.infer<typeof StockInSchema>;

/** Stock Out — manual issue/consume (not a customer order). FIFO across batches. */
export const StockOutSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  reason: z.string().trim().min(1, "Reason is required"),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional(),
});
export type StockOutValues = z.infer<typeof StockOutSchema>;

/** Adjust — set the absolute on-hand quantity (stock take correction). */
export const AdjustSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  newQuantity: z.number().int().nonnegative("Quantity cannot be negative"),
  reason: z.string().trim().min(1, "Reason is required"),
  note: z.string().trim().optional(),
});
export type AdjustValues = z.infer<typeof AdjustSchema>;

/** Damage / Loss — write off stock with a reason. */
export const DamageLossSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  type: z.enum(["DAMAGE", "LOSS"]),
  reason: z.string().trim().min(1, "Reason is required"),
  batchId: z.string().trim().optional(),
  note: z.string().trim().optional(),
});
export type DamageLossValues = z.infer<typeof DamageLossSchema>;
