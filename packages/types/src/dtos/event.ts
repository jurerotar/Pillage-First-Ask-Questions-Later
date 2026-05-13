import { z } from 'zod';
import { gameEventTypeSchema } from '../models/game-event';

// Base shape for API events; specific event types add extra fields via looseObject
export const baseEventDtoSchema = z
  .looseObject({
    id: z.number(),
    type: gameEventTypeSchema,
    startsAt: z.number(),
    duration: z.number(),
    resolvesAt: z.number(),
    villageId: z.number().nullable(),
  })
  .meta({ id: 'BaseEventDto' });

export const eventDtoSchema = baseEventDtoSchema.meta({ id: 'EventDto' });
