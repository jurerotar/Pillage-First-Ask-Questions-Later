import {
  egyptianUnitIdSchema,
  gaulUnitIdSchema,
  heroUnitIdSchema,
  hunUnitIdSchema,
  natarUnitIdSchema,
  natureUnitIdSchema,
  romanUnitIdSchema,
  spartanUnitIdSchema,
  teutonUnitIdSchema,
} from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const unitIdsSeeder = (database: DbFacade): void => {
  const unitIds = [
    heroUnitIdSchema.value,
    ...romanUnitIdSchema.options,
    ...gaulUnitIdSchema.options,
    ...teutonUnitIdSchema.options,
    ...hunUnitIdSchema.options,
    ...egyptianUnitIdSchema.options,
    ...spartanUnitIdSchema.options,
    ...natarUnitIdSchema.options,
    ...natureUnitIdSchema.options,
  ];

  batchInsert(
    database,
    'unit_ids',
    ['unit'],
    unitIds.map((unit) => [unit]),
  );
};
