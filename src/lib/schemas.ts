import { z } from "zod";

export const invoiceSchema = z.object({
  vendor: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  date: z
    .string()
    .nullable()
    .describe("The invoice date as YYYY-MM-DD when possible"),
  currency: z.string().nullable(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unitPrice: z.number().nullable(),
      total: z.number().nullable(),
    })
  ),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
});

export type Invoice = z.infer<typeof invoiceSchema>;