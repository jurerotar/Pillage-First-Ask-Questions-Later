import type { z } from 'zod';
import { developerSettingsSchema } from '@pillage-first/types/models/developer-settings';
import type { getDeveloperSettingsRowSchema } from '../schemas/developer-tools-schemas';

export const mapDeveloperSettingsRowToDto = (
  row: z.infer<typeof getDeveloperSettingsRowSchema>,
) =>
  developerSettingsSchema.parse({
    isInstantBuildingConstructionEnabled: Boolean(
      row.is_instant_building_construction_enabled,
    ),
    isInstantUnitTrainingEnabled: Boolean(row.is_instant_unit_training_enabled),
    isInstantUnitImprovementEnabled: Boolean(
      row.is_instant_unit_improvement_enabled,
    ),
    isInstantUnitResearchEnabled: Boolean(row.is_instant_unit_research_enabled),
    isInstantUnitTravelEnabled: Boolean(row.is_instant_unit_travel_enabled),
    isFreeBuildingConstructionEnabled: Boolean(
      row.is_free_building_construction_enabled,
    ),
    isFreeUnitTrainingEnabled: Boolean(row.is_free_unit_training_enabled),
    isFreeUnitImprovementEnabled: Boolean(row.is_free_unit_improvement_enabled),
    isFreeUnitResearchEnabled: Boolean(row.is_free_unit_research_enabled),
    isInstantHeroReviveEnabled: Boolean(row.is_instant_hero_revive_enabled),
    isFreeHeroReviveEnabled: Boolean(row.is_free_hero_revive_enabled),
  });
