import { z } from 'zod';
import { unitIdSchema } from '../models/unit';

export const unitImprovementDtoSchema = z
  .strictObject({
    unitId: unitIdSchema,
    level: z.number(),
  })
  .meta({ id: 'UnitImprovementDto' });

export const unitCombatStatsDtoSchema = z
  .strictObject({
    unitId: unitIdSchema,
    attack: z.number(),
    infantryDefence: z.number(),
    cavalryDefence: z.number(),
  })
  .meta({ id: 'UnitCombatStatsDto' });

export const researchedUnitDtoSchema = z
  .strictObject({
    unitId: unitIdSchema,
  })
  .meta({ id: 'ResearchedUnitDto' });
