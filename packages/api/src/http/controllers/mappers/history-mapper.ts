import type { z } from 'zod';
import {
  buildingLevelChangeHistoryItemDtoSchema,
  unitTrainingHistoryItemDtoSchema,
} from '@pillage-first/types/dtos/history';
import type {
  getBuildingLevelChangeHistoryRowSchema,
  getUnitTrainingHistoryRowSchema,
} from '../schemas/history-schemas';

export const mapBuildingLevelChangeHistoryRowToDto = (
  row: z.infer<typeof getBuildingLevelChangeHistoryRowSchema>,
) =>
  buildingLevelChangeHistoryItemDtoSchema.parse({
    fieldId: row.field_id,
    building: row.building,
    previousLevel: row.previous_level,
    newLevel: row.new_level,
    timestamp: row.timestamp,
  });

export const mapUnitTrainingHistoryRowToDto = (
  row: z.infer<typeof getUnitTrainingHistoryRowSchema>,
) =>
  unitTrainingHistoryItemDtoSchema.parse({
    batchId: row.batch_id,
    unit: row.unit,
    building: row.building,
    amount: row.amount,
    timestamp: row.timestamp,
  });
