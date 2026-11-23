import { z } from 'zod';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import { buildingIdSchema } from '@pillage-first/types/models/building';

export const scheduledBuildingUpgradeSchema = z.strictObject({
  id: z.number(),
  buildingId: buildingIdSchema,
  villageId: z.number(),
  buildingFieldId: z.number(),
  level: z.number(),
});

export const scheduleBuildingUpgradeSchema = z
  .strictObject({
    buildingId: buildingIdSchema,
    buildingFieldId: z.int().positive(),
    level: z.int().nonnegative(),
  })
  .refine(
    ({ buildingId, level }) =>
      level <= (getBuildingDefinition(buildingId)?.maxLevel ?? -1),
    { message: 'Building level cannot exceed max level', path: ['level'] },
  );

export const reorderScheduledBuildingUpgradesSchema = z.strictObject({
  scheduledUpgradeIds: z
    .array(z.int().positive())
    .max(5)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Scheduled upgrade IDs must be unique',
    }),
});
