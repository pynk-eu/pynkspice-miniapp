import { z } from 'zod';

export const IncomingOrderItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive().max(99),
  images: z.array(z.string()).optional(),
  name_de: z.string().optional(),
});

export const IncomingOrderSchema = z.object({
  items: z.array(IncomingOrderItemSchema).min(1),
  delivery: z.object({ method: z.enum(['pickup','delivery']), address: z.any().optional() }),
  telegramUserId: z.union([z.string(), z.number()]).optional(),
  telegramUsername: z.string().optional(),
  telegramFirstName: z.string().optional(),
  telegramLastName: z.string().optional(),
  customer: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    language: z.enum(['en','de']).optional()
  }).optional(),
  notes: z.string().max(1000).optional(),
  total: z.number().nonnegative(),
});

export type IncomingOrder = z.infer<typeof IncomingOrderSchema>;
