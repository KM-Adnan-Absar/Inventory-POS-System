
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),

  sku: z.string().trim().min(2, "SKU is required"),

  barcode: z.string().trim().nullable().optional(),

  description: z.string().trim().nullable().optional(),

  costPrice: z.coerce.number().min(0, "Cost price cannot be negative"),

  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),

  reorderLevel: z.coerce.number().int().min(0),

  categoryId: z.string().min(1, "Please select a category"),

  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
