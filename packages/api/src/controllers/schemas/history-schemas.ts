import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const baseGetBuildingLevelChangeHistorySchema = z.strictObject({
  field_id: z.number(),
  building: buildingIdSchema,
  previous_level: z.number(),
  new_level: z.number(),
  timestamp: z.number(),
});

export const getBuildingLevelChangeHistorySchema =
  baseGetBuildingLevelChangeHistorySchema
    .transform((t) => ({
      fieldId: t.field_id,
      building: t.building,
      previousLevel: t.previous_level,
      newLevel: t.new_level,
      timestamp: t.timestamp,
    }))
    .meta({ id: 'GetBuildingLevelChangeHistory' });

export const baseGetUnitTrainingHistorySchema = z.strictObject({
  batch_id: z.string(),
  unit: unitIdSchema,
  building: buildingIdSchema,
  amount: z.number(),
  timestamp: z.number(),
});

export const getUnitTrainingHistorySchema = baseGetUnitTrainingHistorySchema
  .transform((t) => ({
    batchId: t.batch_id,
    unit: t.unit,
    building: t.building,
    amount: t.amount,
    timestamp: t.timestamp,
  }))
  .meta({ id: 'GetUnitTrainingHistory' });

export const baseGetEventsHistorySchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: z.number(),
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
    id: z.number(),
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
    id: z.number(),
    type: z.literal('improvement'),
    timestamp: z.number(),
    data: z.strictObject({
      unit: unitIdSchema,
      previousLevel: z.number(),
      newLevel: z.number(),
    }),
  }),
  z.strictObject({
    id: z.number(),
    type: z.literal('research'),
    timestamp: z.number(),
    data: z.strictObject({
      unit: unitIdSchema,
    }),
  }),
]);

export const getEventsHistorySchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      id: z.number(),
      type: z.literal('construction'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.strictObject({
          fieldId: z.number(),
          building: buildingIdSchema,
          previousLevel: z.number(),
          newLevel: z.number(),
        }),
      ),
    }),
    z.strictObject({
      id: z.number(),
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
      id: z.number(),
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
      id: z.number(),
      type: z.literal('research'),
      timestamp: z.number(),
      data: z.preprocess(
        (val) => (typeof val === 'string' ? JSON.parse(val) : val),
        z.strictObject({
          unit: unitIdSchema,
        }),
      ),
    }),
  ])
  .meta({ id: 'GetEventsHistory' });
