import { z } from 'zod';
import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';

export const eventSchema = z
  .strictObject({
    id: z.number(),
    type: z.string() as z.ZodType<GameEvent['type']>,
    starts_at: z.number(),
    duration: z.number(),
    resolves_at: z.number(),
    village_id: z.number().nullable(),
    meta: z.string().nullable(),
  })
  .transform(
    (t) =>
      ({
        id: t.id,
        type: t.type,
        startsAt: t.starts_at,
        duration: t.duration,
        resolvesAt: t.resolves_at,
        villageId: t.village_id,
        ...(t.meta !== null ? JSON.parse(t.meta) : {}),
      }) as GameEvent,
  );

export const parseEvent = <T extends GameEventType>(row: unknown) => {
  return eventSchema.parse(row) as GameEvent<T>;
};
