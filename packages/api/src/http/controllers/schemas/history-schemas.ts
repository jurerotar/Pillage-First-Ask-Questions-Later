import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { unitIdSchema } from '@pillage-first/types/models/unit';

const baseGetBuildingLevelChangeHistorySchema = z.strictObject({
  field_id: z.number(),
  building: buildingIdSchema,
  previous_level: z.number(),
  new_level: z.number(),
  timestamp: z.number(),
});

export const getBuildingLevelChangeHistoryRowSchema =
  baseGetBuildingLevelChangeHistorySchema.meta({
    id: 'GetBuildingLevelChangeHistoryRow',
  });

const baseGetUnitTrainingHistorySchema = z.strictObject({
  batch_id: z.string(),
  unit: unitIdSchema,
  building: buildingIdSchema,
  amount: z.number(),
  timestamp: z.number(),
});

export const getUnitTrainingHistoryRowSchema =
  baseGetUnitTrainingHistorySchema.meta({ id: 'GetUnitTrainingHistoryRow' });

export const getEventsHistorySchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('construction'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.discriminatedUnion('status', [
          z.strictObject({
            status: z.literal('completed'),
            fieldId: z.number(),
            building: buildingIdSchema,
            previousLevel: z.number(),
            newLevel: z.number(),
          }),
          z.strictObject({
            status: z.literal('cancelled'),
            fieldId: z.number(),
            building: buildingIdSchema,
            level: z.number(),
          }),
        ]),
      ),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('training'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.strictObject({
          batchId: z.string(),
          unit: unitIdSchema,
          building: buildingIdSchema,
          amount: z.number(),
        }),
      ),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('improvement'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.strictObject({
          unit: unitIdSchema,
          previousLevel: z.number(),
          newLevel: z.number(),
        }),
      ),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('research'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.strictObject({
          unit: unitIdSchema,
        }),
      ),
    }),
    z.strictObject({
      id: z.string(),
      villageId: z.number(),
      type: z.literal('founding'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.strictObject({
          tileId: z.number(),
          x: z.number(),
          y: z.number(),
        }),
      ),
    }),
  ])
  .meta({ id: 'GetEventsHistory' });
