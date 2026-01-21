import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';

export const resourceFieldCompositionsSeeder: Seeder = (database): void => {
  const rfc: ResourceFieldComposition[] = [
    '4446',
    '5436',
    '5346',
    '4536',
    '3546',
    '4356',
    '3456',
    '4437',
    '4347',
    '3447',
    '3339',
    '11115',
    '00018',
  ];

  batchInsert(
    database,
    'resource_field_compositions',
    ['resource_field_composition'],
    rfc.map((rfc) => [rfc]),
  );
};
