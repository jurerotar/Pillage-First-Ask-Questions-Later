import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';

export const scheduledBuildingUpgradeSchema = z.strictObject({
  id: z.number(),
  buildingId: buildingIdSchema,
  villageId: z.number(),
  buildingFieldId: z.number(),
  level: z.number(),
});

export const scheduleBuildingUpgradeSchema = z.strictObject({
  buildingId: buildingIdSchema,
  buildingFieldId: z.number(),
  level: z.number(),
});

export const reorderScheduledBuildingUpgradesSchema = z.strictObject({
  scheduledUpgradeIds: z
    .array(z.number())
    .max(5)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Scheduled upgrade IDs must be unique',
    }),
});
