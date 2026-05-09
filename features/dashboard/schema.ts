import { z } from "zod";

export const ProductSchema = z.object({
  productName: z.string().trim().min(1, "Required"),
  productDescription: z.string().trim().min(1, "Required"),
  productPrice: z.number().min(1, "Required"),
  productStock: z.number().min(1, "Required"),
  productCategory: z.string().trim().min(1, "Required"),
  productSKU: z.string().trim().min(1, "Required"),
  productVariants: z.array(z.string()).min(1, "Required"),
  productImages: z.array(z.union([z.string(), z.instanceof(File)])).min(1, "Required"),
  productTags: z.array(z.string()).min(1, "Required"),
  productSize: z.array(z.string()).min(1, "Required").optional(),
  specifications: z
  .array(
    z.object({
      key: z.string().min(1, "Required"),
      value: z.string().min(1, "Required"),
    })
  )
  .min(1, "At least one specification required"),
  productFeatures: z.array(z.string()).min(1, "At least one feature is required"),
  careInstructions: z.string().min(1, "Care instructions are required").optional(),
  isFeatured:z.boolean().optional(),

});

export type ProductFormValues = z.infer<typeof ProductSchema>;