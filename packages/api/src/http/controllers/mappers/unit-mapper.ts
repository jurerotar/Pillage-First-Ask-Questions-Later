import type { z } from 'zod';
import {
  researchedUnitDtoSchema,
  unitImprovementDtoSchema,
} from '@pillage-first/types/dtos/unit';
import type { getUnitImprovementsRowSchema } from '../schemas/unit-improvement-schemas';
import type { getResearchedUnitsRowSchema } from '../schemas/unit-research-schemas';

export const mapUnitImprovementRowToDto = (
  row: z.infer<typeof getUnitImprovementsRowSchema>,
) =>
  unitImprovementDtoSchema.parse({
    unitId: row.unit_id,
    level: row.level,
  });

export const mapResearchedUnitRowToDto = (
  row: z.infer<typeof getResearchedUnitsRowSchema>,
) => researchedUnitDtoSchema.parse({ unitId: row.unit_id });
