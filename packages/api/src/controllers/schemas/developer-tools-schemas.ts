import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';

export const getDeveloperSettingsSchema = z
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
  })
  .transform((t) => {
    return {
      isInstantBuildingConstructionEnabled: Boolean(
        t.is_instant_building_construction_enabled,
      ),
      isInstantUnitTrainingEnabled: Boolean(t.is_instant_unit_training_enabled),
      isInstantUnitImprovementEnabled: Boolean(
        t.is_instant_unit_improvement_enabled,
      ),
      isInstantUnitResearchEnabled: Boolean(t.is_instant_unit_research_enabled),
      isInstantUnitTravelEnabled: Boolean(t.is_instant_unit_travel_enabled),
      isFreeBuildingConstructionEnabled: Boolean(
        t.is_free_building_construction_enabled,
      ),
      isFreeUnitTrainingEnabled: Boolean(t.is_free_unit_training_enabled),
      isFreeUnitImprovementEnabled: Boolean(t.is_free_unit_improvement_enabled),
      isFreeUnitResearchEnabled: Boolean(t.is_free_unit_research_enabled),
    };
  });

export const updateVillageResourcesSchema = z.strictObject({
  resource: resourceSchema,
  amount: z.union([z.literal(100), z.literal(1000), z.literal(10_000)]),
  direction: z.enum(['add', 'subtract']),
});
