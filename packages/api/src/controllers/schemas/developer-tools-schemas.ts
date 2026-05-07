import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';

export const getDeveloperSettingsRowSchema = z
  .strictObject({
    is_instant_building_construction_enabled: z.number(),
    is_instant_unit_training_enabled: z.number(),
    is_instant_unit_improvement_enabled: z.number(),
    is_instant_unit_research_enabled: z.number(),
    is_instant_unit_travel_enabled: z.number(),
    is_free_building_construction_enabled: z.number(),
    is_free_unit_training_enabled: z.number(),
    is_free_unit_improvement_enabled: z.number(),
    is_free_unit_research_enabled: z.number(),
    is_instant_hero_revive_enabled: z.number(),
    is_free_hero_revive_enabled: z.number(),
  })
  .meta({ id: 'GetDeveloperSettingsRow' });

export const updateVillageResourcesSchema = z.strictObject({
  resource: resourceSchema,
  amount: z.union([z.literal(100), z.literal(1000), z.literal(10_000)]),
  direction: z.enum(['add', 'subtract']),
});
