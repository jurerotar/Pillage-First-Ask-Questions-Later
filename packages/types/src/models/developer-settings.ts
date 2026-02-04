import { z } from 'zod';

export const developerSettingsSchema = z.strictObject({
  isInstantBuildingConstructionEnabled: z.boolean(),
  isInstantUnitTrainingEnabled: z.boolean(),
  isInstantUnitImprovementEnabled: z.boolean(),
  isInstantUnitResearchEnabled: z.boolean(),
  isInstantUnitTravelEnabled: z.boolean(),
  isFreeBuildingConstructionEnabled: z.boolean(),
  isFreeUnitTrainingEnabled: z.boolean(),
  isFreeUnitImprovementEnabled: z.boolean(),
  isFreeUnitResearchEnabled: z.boolean(),
}).meta({ id: 'DeveloperSettings' });

export type DeveloperSettings = z.infer<typeof developerSettingsSchema>;
