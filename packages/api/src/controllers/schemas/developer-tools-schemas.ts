import { z } from 'zod';

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
