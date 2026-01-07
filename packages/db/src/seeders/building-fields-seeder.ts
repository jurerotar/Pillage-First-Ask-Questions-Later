import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { PlayableTribe } from '@pillage-first/types/models/tribe';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';
import { buildingFieldsFactory } from './factories/building-fields-factory';

type QueryResultRow = {
  village_id: number;
  x: number;
  y: number;
  tribe: PlayableTribe;
  resource_field_composition: ResourceFieldComposition;
  player_id: number;
};

export const buildingFieldsSeeder: Seeder = (database, server): void => {
  // villageId, fieldId, buildingId, level
  const results = [];

  const villages = database.selectObjects(`
    SELECT
      v.id AS village_id,
      t.x,
      t.y,
      rfc.resource_field_composition AS resource_field_composition,
      p.tribe,
      p.id AS player_id
    FROM
      villages v
        JOIN tiles t ON v.tile_id = t.id
        LEFT JOIN resource_field_compositions rfc ON t.resource_field_composition_id = rfc.id
        JOIN players p ON v.player_id = p.id;
  `) as QueryResultRow[];

  for (const {
    player_id,
    resource_field_composition,
    tribe,
    village_id,
    x,
    y,
  } of villages) {
    if (player_id === PLAYER_ID) {
      const buildingFieldsWithoutVillageId = buildingFieldsFactory(
        'player',
        tribe,
        resource_field_composition,
      );
      const buildingFields = buildingFieldsWithoutVillageId.map(
        ({ field_id, building_id, level }) => [
          village_id,
          field_id,
          building_id,
          level,
        ],
      );
      results.push(...buildingFields);
      continue;
    }

    const villageSize = getVillageSize(server.configuration.mapSize, x, y);
    const buildingFieldsWithoutVillageId = buildingFieldsFactory(
      villageSize,
      tribe,
      resource_field_composition,
    );
    const buildingFields = buildingFieldsWithoutVillageId.map(
      ({ field_id, building_id, level }) => [
        village_id,
        field_id,
        building_id,
        level,
      ],
    );
    results.push(...buildingFields);
  }

  batchInsert(
    database,
    'building_fields',
    ['village_id', 'field_id', 'building_id', 'level'],
    results,
  );
};
