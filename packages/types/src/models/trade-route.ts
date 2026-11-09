import { z } from 'zod';
import { resourcesSchema } from './resource';

export const tradeRouteScheduleSchema = z
  .strictObject({
    startHour: z.number().int().min(0).max(23),
    startMinute: z.number().int().min(0).max(59).default(0),
    intervalHours: z.number().int().min(0),
    intervalMinutes: z.number().int().min(0).max(59).default(0),
  })
  .refine(
    ({ intervalHours, intervalMinutes }) =>
      intervalHours * 60 + intervalMinutes > 0,
    {
      message: 'Interval must be at least 1 minute',
      path: ['intervalMinutes'],
    },
  );

export const tradeRouteSchema = z.strictObject({
  id: z.number(),
  villageId: z.number(),
  targetVillageId: z.number(),
  originTileId: z.number(),
  targetTileId: z.number(),
  resources: resourcesSchema,
  interval: z.number(),
  startsAt: z.number(),
  paused: z.boolean(),
  nextAt: z.number().nullable(),
});

export type TradeRoute = z.infer<typeof tradeRouteSchema>;
