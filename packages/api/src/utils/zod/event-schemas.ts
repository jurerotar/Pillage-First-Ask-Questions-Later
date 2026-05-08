import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';

export const baseEventRowSchema = z.strictObject({
  id: z.number(),
  type: z.string() as z.ZodType<GameEvent['type']>,
  starts_at: z.number(),
  duration: z.number(),
  resolves_at: z.number(),
  village_id: z.number().nullable(),
  meta: z.string().nullable(),
});

export const mapEventRowToTypedEvent = (
  row: z.infer<typeof baseEventRowSchema>,
) =>
  ({
    id: row.id,
    type: row.type,
    startsAt: row.starts_at,
    duration: row.duration,
    resolvesAt: row.resolves_at,
    villageId: row.village_id,
    ...(row.meta !== null ? JSON.parse(row.meta) : {}),
  }) as GameEvent;
