import { z } from 'zod';
import { buildingIdSchema } from '../models/building';
import { unitIdSchema } from '../models/unit';

export const buildingLevelChangeHistoryItemDtoSchema = z
  .strictObject({
    fieldId: z.number(),
    building: buildingIdSchema,
    previousLevel: z.number(),
    newLevel: z.number(),
    timestamp: z.number(),
  })
  .meta({ id: 'BuildingLevelChangeHistoryItemDto' });

export const unitTrainingHistoryItemDtoSchema = z
  .strictObject({
    batchId: z.string(),
    unit: unitIdSchema,
    building: buildingIdSchema,
    amount: z.number(),
    timestamp: z.number(),
  })
  .meta({ id: 'UnitTrainingHistoryItemDto' });

export const eventsHistoryItemDtoSchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('construction'),
      timestamp: z.number(),
      data: z.strictObject({
        fieldId: z.number(),
        building: buildingIdSchema,
        previousLevel: z.number(),
        newLevel: z.number(),
      }),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('training'),
      timestamp: z.number(),
      data: z.strictObject({
        batchId: z.string(),
        unit: unitIdSchema,
        building: buildingIdSchema,
        amount: z.number(),
      }),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('improvement'),
      timestamp: z.number(),
      data: z.strictObject({
        unit: unitIdSchema,
        previousLevel: z.number(),
        newLevel: z.number(),
      }),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('research'),
      timestamp: z.number(),
      data: z.strictObject({
        unit: unitIdSchema,
      }),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('founding'),
      timestamp: z.number(),
      data: z.strictObject({
        tileId: z.number(),
        x: z.number(),
        y: z.number(),
      }),
    }),
  ])
  .meta({ id: 'EventsHistoryItemDto' });
