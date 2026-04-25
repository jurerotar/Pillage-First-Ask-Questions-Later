import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';

export const scheduledUpgradeSchema = z.strictObject({
  id: z.number(),
  buildingId: buildingIdSchema,
  villageId: z.number(),
  buildingFieldId: z.number(),
  level: z.number(),
});

export const getScheduledBuildingUpgradesSchema = z
  .array(scheduledUpgradeSchema)
  .meta({ id: 'GetScheduledBuildingUpgrades' });

export const scheduleBuildingUpgradeSchema = z.strictObject({
  buildingId: buildingIdSchema,
  buildingFieldId: z.number(),
  level: z.number(),
});
