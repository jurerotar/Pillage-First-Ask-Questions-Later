import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const resourceFieldCompositionIdsSeeder = (database: DbFacade): void => {
  const resourceFieldCompositionIds = resourceFieldCompositionSchema.options;

  batchInsert(
    database,
    'resource_field_composition_ids',
    ['resource_field_composition'],
    resourceFieldCompositionIds.map((rfc) => [rfc]),
  );
};
