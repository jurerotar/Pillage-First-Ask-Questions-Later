import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getBuildingLevelChangeHistorySchema = z
  .strictObject({
    field_id: z.number(),
    building: buildingIdSchema,
    previous_level: z.number(),
    new_level: z.number(),
    timestamp: z.number(),
  })
  .transform((t) => ({
    fieldId: t.field_id,
    building: t.building,
    previousLevel: t.previous_level,
    newLevel: t.new_level,
    timestamp: t.timestamp,
  }))
  .meta({ id: 'GetBuildingLevelChangeHistory' });

export const getUnitTrainingHistorySchema = z
  .strictObject({
    batch_id: z.string(),
    unit: unitIdSchema,
    building: buildingIdSchema,
    amount: z.number(),
    timestamp: z.number(),
  })
  .transform((t) => ({
    batchId: t.batch_id,
    unit: t.unit,
    building: t.building,
    amount: t.amount,
    timestamp: t.timestamp,
  }))
  .meta({ id: 'GetUnitTrainingHistory' });
