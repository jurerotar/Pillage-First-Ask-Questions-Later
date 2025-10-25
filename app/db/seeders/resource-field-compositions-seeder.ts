import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { ResourceFieldComposition } from 'app/interfaces/models/game/resource-field-composition';

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
