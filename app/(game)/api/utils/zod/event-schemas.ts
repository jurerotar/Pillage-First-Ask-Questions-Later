import { z } from 'zod';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const eventSchema = z
  .strictObject({
    id: z.string(),
    type: z.string().brand<GameEvent['type']>(),
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
