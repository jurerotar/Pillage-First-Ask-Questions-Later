import { createController } from '../utils/controller';
import {
  getOccupiableOasisInRangeSchema,
  getVillageBySlugSchema,
} from './schemas/village-schemas';

export const getVillageBySlug = createController('/villages/:villageSlug')(
  ({ database, path: { villageSlug } }) => {
    return database.selectObject({
      sql: `
      SELECT
        v.id,
        v.tile_id,
        v.player_id,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.name,
        v.slug,
        rs.updated_at AS last_updated_at,
        rs.wood AS wood,
        rs.clay AS clay,
        rs.iron AS iron,
        rs.wheat AS wheat,
        rfc.resource_field_composition AS resource_field_composition,
        (
          SELECT
            JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'field_id', bf.field_id,
                'building_id', bi.building,
                'level', bf.level
              )
            )
          FROM
            building_fields bf
            LEFT JOIN building_ids bi ON bi.id = bf.building_id
          WHERE
            bf.village_id = v.id
          ) AS building_fields
      FROM
        villages v
          JOIN tiles t
               ON t.id = v.tile_id
          LEFT JOIN resource_sites rs
                    ON rs.tile_id = v.tile_id
          LEFT JOIN resource_field_composition_ids rfc
                    ON t.resource_field_composition_id = rfc.id
      WHERE
        v.slug = $slug
      LIMIT 1;
    `,
      bind: { $slug: villageSlug },
      schema: getVillageBySlugSchema,
    })!;
  },
);

export const getOccupiableOasisInRange = createController(
  '/villages/:villageId/occupiable-oasis',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: `
      WITH
        src_village AS (
          SELECT t.id AS vtile, t.x AS vx, t.y AS vy
          FROM
            villages v
              JOIN tiles t ON t.id = v.tile_id
          WHERE
            v.id = $village_id
          LIMIT 1
          ),

        -- aggregate oasis info (bonuses + occupying village)
        oasis_agg AS (
          SELECT
            ot.id AS tile_id,
            ot.x AS x,
            ot.y AS y,
            ot.oasis_graphics AS oasis_graphics,
            JSON_GROUP_ARRAY(o.bonus) AS bonuses_json,
            MAX(o.village_id) AS occupying_village_id
          FROM
            tiles ot
              JOIN src_village sv ON 1 = 1
              JOIN oasis o ON o.tile_id = ot.id
          WHERE
            ot.type = 'oasis'
            AND ot.x BETWEEN sv.vx - $radius AND sv.vx + $radius
            AND ot.y BETWEEN sv.vy - $radius AND sv.vy + $radius
          GROUP BY ot.id
          )

      SELECT
        oa.tile_id,
        oa.x AS tile_coordinates_x,
        oa.y AS tile_coordinates_y,
        oa.oasis_graphics,
        oa.bonuses_json,
        oa.occupying_village_id,
        v2.name AS occupying_village_name,
        v2.slug AS occupying_village_slug,
        vt2.x AS occupying_village_coordinates_x,
        vt2.y AS occupying_village_coordinates_y,
        p.id AS occupying_player_id,
        p.name AS occupying_player_name,
        p.slug AS occupying_player_slug
      FROM
        oasis_agg oa
          CROSS JOIN src_village sv
          LEFT JOIN villages v2 ON v2.id = oa.occupying_village_id
          LEFT JOIN tiles vt2 ON vt2.id = v2.tile_id
          LEFT JOIN players p ON p.id = v2.player_id
      ORDER BY
        (ABS(oa.x - sv.vx) + ABS(oa.y - sv.vy)),
        oa.tile_id;
    `,
    bind: {
      $village_id: villageId,
      $radius: 3,
    },
    schema: getOccupiableOasisInRangeSchema,
  });
});

export const rearrangeBuildingFields = createController(
  '/villages/:villageId/building-fields',
  'patch',
)(({ database, path: { villageId }, body: updates }) => {
  database.transaction(() => {
    // 1. Update building_fields
    database.exec({
      sql: `
        DELETE FROM building_fields
        WHERE village_id = $village_id
          AND field_id IN (SELECT value ->> '$.buildingFieldId' FROM JSON_EACH($updates));
      `,
      bind: { $village_id: villageId, $updates: JSON.stringify(updates) },
    });

    database.exec({
      sql: `
        WITH updates_raw(field_id, building_text) AS (
          SELECT CAST(value ->> '$.buildingFieldId' AS INTEGER), value ->> '$.buildingId'
          FROM JSON_EACH($updates)
        ),
        updates AS (
          SELECT ur.field_id, bi.id AS building_id, ur.building_text
          FROM updates_raw ur
          LEFT JOIN building_ids bi ON bi.building = ur.building_text
        ),
        current_state AS (
          SELECT building_id, level
          FROM building_fields
          WHERE village_id = $village_id
        ),
        new_state AS (
          SELECT
            u.field_id,
            u.building_id,
            COALESCE(cs.level, 0) as level
          FROM updates u
          LEFT JOIN current_state cs ON cs.building_id = u.building_id
          WHERE u.building_id IS NOT NULL
        )
        INSERT INTO building_fields (village_id, field_id, building_id, level)
        SELECT $village_id, field_id, building_id, level
        FROM new_state;
      `,
      bind: {
        $village_id: villageId,
        $updates: JSON.stringify(updates),
      },
    });

    // 2. Update events
    // We only update events of types that have buildingFieldId and buildingId in meta
    database.exec({
      sql: `
        WITH updates_raw(field_id, building_text) AS (
          SELECT CAST(value ->> '$.buildingFieldId' AS INTEGER), value ->> '$.buildingId'
          FROM JSON_EACH($updates)
        )
        UPDATE events
        SET meta = JSON_SET(meta, '$.buildingFieldId', ur.field_id)
        FROM updates_raw ur
        WHERE events.village_id = $village_id
          AND events.type IN ('buildingScheduledConstruction', 'buildingConstruction', 'buildingLevelChange', 'buildingDestruction')
          AND JSON_EXTRACT(meta, '$.buildingId') = ur.building_text
          AND ur.building_text IS NOT NULL;
      `,
      bind: {
        $village_id: villageId,
        $updates: JSON.stringify(updates),
      },
    });
  });
});
