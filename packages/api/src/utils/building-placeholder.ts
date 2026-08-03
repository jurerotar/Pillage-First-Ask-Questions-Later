import { z } from 'zod';
import {
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { updatePopulationEffectQuery } from '../queries/effect-queries';
import { demolishBuilding } from './village';

export const createBuildingPlaceholder = (
  database: DbFacade,
  villageId: Village['id'],
  buildingFieldId: BuildingField['id'],
  buildingId: Building['id'],
): void => {
  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      SELECT $village_id, $field_id, bi.id, 0
      FROM building_ids bi
      WHERE bi.building = $building_id;
    `,
    bind: {
      $village_id: villageId,
      $field_id: buildingFieldId,
      $building_id: buildingId,
    },
  });

  const { effects } = getBuildingDefinition(buildingId);

  database.exec({
    sql: `
      INSERT INTO effects (
        effect_id,
        value,
        type_id,
        scope_id,
        source_id,
        village_id,
        source_specifier
      )
      SELECT
        effect_ids.id,
        json_extract(effect.value, '$.value'),
        effect_type_ids.id,
        effect_scope_ids.id,
        effect_source_ids.id,
        $village_id,
        $source_specifier
      FROM
        json_each($effects) AS effect
        JOIN effect_ids
          ON effect_ids.effect = json_extract(effect.value, '$.effectId')
        JOIN effect_type_ids
          ON effect_type_ids.type = json_extract(effect.value, '$.type')
        JOIN effect_scope_ids
          ON effect_scope_ids.scope = 'local'
        JOIN effect_source_ids
          ON effect_source_ids.source = 'building';
    `,
    bind: {
      $effects: JSON.stringify(
        effects.map(({ effectId, valuesPerLevel, type }) => ({
          effectId,
          type,
          value: valuesPerLevel[0],
        })),
      ),
      $village_id: villageId,
      $source_specifier: buildingFieldId,
    },
  });

  const { population } = getBuildingDataForLevel(buildingId, 0);

  database.exec({
    sql: updatePopulationEffectQuery,
    bind: {
      $village_id: villageId,
      $value: population,
    },
  });
};

export const removeBuildingPlaceholder = (
  database: DbFacade,
  villageId: Village['id'],
  buildingFieldId: BuildingField['id'],
  buildingId: Building['id'],
): void => {
  if (buildingFieldId < 19 || buildingFieldId > 38) {
    return;
  }

  const hasMatchingPlaceholder = database.selectValue({
    sql: `
      SELECT EXISTS (
        SELECT 1
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id
          AND bf.field_id = $building_field_id
          AND bf.level = 0
          AND bi.building = $building_id
      );
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
      $building_id: buildingId,
    },
    schema: z.coerce.boolean(),
  })!;

  if (!hasMatchingPlaceholder) {
    return;
  }

  database.exec({
    sql: `
      DELETE FROM effects
      WHERE village_id = $village_id
        AND source_specifier = $building_field_id
        AND source_id = (
          SELECT id FROM effect_source_ids WHERE source = 'building'
        );
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
  });

  const { population } = getBuildingDataForLevel(buildingId, 0);

  database.exec({
    sql: updatePopulationEffectQuery,
    bind: {
      $village_id: villageId,
      $value: -population,
    },
  });

  demolishBuilding(database, villageId, buildingFieldId);
};
