import z from 'zod';

export const YooKassaWebhookSchema = z.object({
  type: z.string().optional(),
  event: z.string(),
  object: z.object({
    id: z.string().min(1),
    status: z.string().optional(),
    metadata: z
      .object({
        deckId: z.string().min(1).optional(),
        telegramId: z.string().min(1).optional(),
      })
      .optional(),
  }),
});

export type YooKassaWebhookPayload = z.infer<typeof YooKassaWebhookSchema>;
