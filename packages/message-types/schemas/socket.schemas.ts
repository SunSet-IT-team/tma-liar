import { z } from 'zod';

/**
 * Runtime-схема payload ошибки socket-события.
 */
export const SocketErrorPayloadSchema = z.object({
  errorCode: z.string().optional(),
  message: z.string().optional(),
  details: z.unknown().optional(),
});

/**
 * Runtime-схема ack-подтверждения socket-события.
 */
export const SocketAckPayloadSchema = z.object({
  ok: z.boolean(),
  errorCode: z.string().optional(),
  message: z.string().optional(),
});

