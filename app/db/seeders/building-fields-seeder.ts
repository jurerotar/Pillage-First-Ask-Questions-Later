import type { Seeder } from 'app/interfaces/db';
import type { ResourceFieldComposition } from 'app/interfaces/models/game/village';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { buildingFieldsFactory } from 'app/db/factories/building-fields-factory';
import { PLAYER_ID } from 'app/constants/player';
import { getVillageSize } from 'app/db/utils/village-size';
import { batchInsert } from 'app/db/utils/batch-insert';

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
    SELECT v.id AS village_id,
           t.x,
           t.y,
           rfc.resource_field_composition AS resource_field_composition,
           p.tribe,
           p.id AS player_id
    FROM villages v
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
