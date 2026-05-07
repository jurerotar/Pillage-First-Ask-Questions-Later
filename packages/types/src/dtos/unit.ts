import { z } from 'zod';
import { unitIdSchema } from '../models/unit';

export const unitImprovementDtoSchema = z
  .strictObject({
    unitId: unitIdSchema,
    level: z.number(),
  })
  .meta({ id: 'UnitImprovementDto' });

export const researchedUnitDtoSchema = z
  .strictObject({
    unitId: unitIdSchema,
  })
  .meta({ id: 'ResearchedUnitDto' });
