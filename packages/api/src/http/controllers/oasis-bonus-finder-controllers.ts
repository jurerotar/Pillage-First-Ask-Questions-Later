import { z } from 'zod';
import { oasisByBonusSearchResultItemDtoSchema } from '@pillage-first/types/dtos/oasis-search';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { createController } from '../controller';
import {
  mapTileWithBonusesRowToDto,
  parseOasisOwnersJson,
} from './mappers/oasis-finder-mapper';
import {
  getTilesWithBonusesRowSchema,
  oasisBonusSlotSchema,
  ownedOasisRowSchema,
} from './schemas/oasis-bonus-finder-schemas';
import {
  createOwnedOasesByCoordinates,
  getNearbyOwnedOasisOwners,
} from './utils/oasis-bonus-finder';

export const getTilesWithBonuses = createController(
  '/search/oases/by-bonus',
  'post',
  {
    summary: 'Find tiles with specific oasis bonuses',
    requestBody: z.strictObject({
      x: z.number(),
      y: z.number(),
      resourceFieldComposition: resourceFieldCompositionSchema.or(
        z.literal('any-cropper'),
      ),
      bonuses: z.strictObject({
        firstOasis: oasisBonusSlotSchema,
        secondOasis: oasisBonusSlotSchema,
        thirdOasis: oasisBonusSlotSchema,
      }),
    }),
    response: z.array(oasisByBonusSearchResultItemDtoSchema),
  },
)(({ database, body }) => {
  const { x, y, resourceFieldComposition, bonuses } = body;
  const { firstOasis, secondOasis, thirdOasis } = bonuses;

  const requestedSlotBonuses = [
    ...firstOasis.map((bonus) => ({ slot: 1, ...bonus })),
    ...secondOasis.map((bonus) => ({ slot: 2, ...bonus })),
    ...thirdOasis.map((bonus) => ({ slot: 3, ...bonus })),
  ];

  if (requestedSlotBonuses.length === 0) {
    const rows = database.selectObjects({
      sql: `
        WITH
          src_village(x, y) AS (
            VALUES ($tile_x, $tile_y)
          ),
          cropper_resource_field_compositions(resource_field_composition) AS (
            VALUES ('3339'), ('11115'), ('00018')
          )
        SELECT
          t.id AS tile_id,
          t.x AS coordinates_x,
          t.y AS coordinates_y,
          rfc.resource_field_composition AS resource_field_composition,
          '[]' AS oasis_owners_json,
          ((t.x - sv.x) * (t.x - sv.x) + (t.y - sv.y) * (t.y - sv.y)) AS distance_squared
        FROM tiles t
        LEFT JOIN resource_field_composition_ids rfc
          ON rfc.id = t.resource_field_composition_id
        CROSS JOIN src_village sv
        WHERE
          t.type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
          AND (
            (
              $rfc_param = 'any-cropper'
              AND rfc.resource_field_composition IN (
                SELECT resource_field_composition
                FROM cropper_resource_field_compositions
              )
            )
            OR (
              $rfc_param <> 'any-cropper'
              AND rfc.resource_field_composition = $rfc_param
            )
          )
        ORDER BY distance_squared ASC;
      `,
      bind: {
        $tile_x: x,
        $tile_y: y,
        $rfc_param: resourceFieldComposition,
      },
      schema: getTilesWithBonusesRowSchema,
    });

    const ownedOases = database.selectObjects({
      sql: `
        SELECT
          o.tile_id AS oasis_tile_id,
          ot.x AS oasis_x,
          ot.y AS oasis_y,
          ov.id AS owner_village_id,
          ov.name AS owner_village_name,
          ov.slug AS owner_village_slug,
          vt.x AS owner_village_x,
          vt.y AS owner_village_y
        FROM oasis o
        JOIN tiles ot ON ot.id = o.tile_id
        JOIN villages ov ON ov.id = o.village_id
        JOIN tiles vt ON vt.id = ov.tile_id
        WHERE o.village_id IS NOT NULL
        ORDER BY o.tile_id;
      `,
      schema: ownedOasisRowSchema,
    });

    const ownedOasesByCoordinates = createOwnedOasesByCoordinates(ownedOases);

    return rows.map((row) => {
      const oasisOwners = getNearbyOwnedOasisOwners(
        row,
        ownedOasesByCoordinates,
      );

      return mapTileWithBonusesRowToDto(row, oasisOwners);
    });
  }

  const rows = database.selectObjects({
    sql: `
      WITH
        src_village(x, y) AS (
          VALUES ($tile_x, $tile_y)
        ),
        cropper_resource_field_compositions(resource_field_composition) AS (
          VALUES ('3339'), ('11115'), ('00018')
        ),
        requested_slot_bonuses AS (
          SELECT
            CAST(key AS INTEGER) AS request_id,
            CAST(JSON_EXTRACT(value, '$.slot') AS INTEGER) AS slot_index,
            JSON_EXTRACT(value, '$.resource') AS resource,
            CAST(JSON_EXTRACT(value, '$.bonus') AS INTEGER) AS bonus
          FROM JSON_EACH($requested_slot_bonuses)
        ),
        slot_bonus_counts AS (
          SELECT
            slot_index,
            COUNT(*) AS required_bonus_count
          FROM requested_slot_bonuses
          GROUP BY slot_index
        ),
        ranked_slots AS (
          SELECT
            slot_index,
            ROW_NUMBER() OVER (ORDER BY slot_index) AS slot_rank
          FROM slot_bonus_counts
        ),
        active_slot_count AS (
          SELECT COUNT(*) AS value
          FROM slot_bonus_counts
        ),
        candidates AS (
          SELECT
            t.id,
            t.x,
            t.y,
            rfc.resource_field_composition
          FROM tiles t
          LEFT JOIN resource_field_composition_ids rfc
            ON rfc.id = t.resource_field_composition_id
          WHERE
            t.type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
            AND (
              (
                $rfc_param = 'any-cropper'
                AND rfc.resource_field_composition IN (
                  SELECT resource_field_composition
                  FROM cropper_resource_field_compositions
                )
              )
              OR (
                $rfc_param <> 'any-cropper'
                AND rfc.resource_field_composition = $rfc_param
              )
            )
        ),
        slot_matches AS (
          SELECT
            c.id AS candidate_tile,
            rsb.slot_index,
            o.tile_id AS oasis_tile
          FROM candidates c
          JOIN tiles ot
            ON ot.x BETWEEN c.x - 3 AND c.x + 3
            AND ot.y BETWEEN c.y - 3 AND c.y + 3
          JOIN oasis o ON o.tile_id = ot.id
          JOIN resource_ids ri ON ri.id = o.resource_id
          JOIN requested_slot_bonuses rsb
            ON rsb.resource = ri.resource
            AND rsb.bonus = o.bonus
          GROUP BY c.id, rsb.slot_index, o.tile_id
          HAVING COUNT(DISTINCT rsb.request_id) = (
            SELECT required_bonus_count
            FROM slot_bonus_counts sbc
            WHERE sbc.slot_index = rsb.slot_index
          )
        ),
        valid_candidates AS (
          SELECT c.id AS candidate_tile
          FROM candidates c
          WHERE (SELECT value FROM active_slot_count) = 0

          UNION

          SELECT m1.candidate_tile
          FROM active_slot_count active_slots
          JOIN ranked_slots r1 ON r1.slot_rank = 1
          JOIN slot_matches m1 ON m1.slot_index = r1.slot_index
          WHERE active_slots.value = 1

          UNION

          SELECT m1.candidate_tile
          FROM active_slot_count active_slots
          JOIN ranked_slots r1 ON r1.slot_rank = 1
          JOIN ranked_slots r2 ON r2.slot_rank = 2
          JOIN slot_matches m1 ON m1.slot_index = r1.slot_index
          JOIN slot_matches m2
            ON m2.candidate_tile = m1.candidate_tile
            AND m2.slot_index = r2.slot_index
            AND m2.oasis_tile <> m1.oasis_tile
          WHERE active_slots.value = 2

          UNION

          SELECT m1.candidate_tile
          FROM active_slot_count active_slots
          JOIN ranked_slots r1 ON r1.slot_rank = 1
          JOIN ranked_slots r2 ON r2.slot_rank = 2
          JOIN ranked_slots r3 ON r3.slot_rank = 3
          JOIN slot_matches m1 ON m1.slot_index = r1.slot_index
          JOIN slot_matches m2
            ON m2.candidate_tile = m1.candidate_tile
            AND m2.slot_index = r2.slot_index
            AND m2.oasis_tile <> m1.oasis_tile
          JOIN slot_matches m3
            ON m3.candidate_tile = m1.candidate_tile
            AND m3.slot_index = r3.slot_index
            AND m3.oasis_tile <> m1.oasis_tile
            AND m3.oasis_tile <> m2.oasis_tile
          WHERE active_slots.value = 3
        ),
        candidate_oasis_matches AS (
          SELECT DISTINCT
            sm.candidate_tile,
            sm.oasis_tile
          FROM slot_matches sm
          WHERE (SELECT value FROM active_slot_count) > 0

          UNION

          SELECT DISTINCT
            c.id AS candidate_tile,
            o.tile_id AS oasis_tile
          FROM candidates c
          JOIN tiles ot
            ON ot.x BETWEEN c.x - 3 AND c.x + 3
            AND ot.y BETWEEN c.y - 3 AND c.y + 3
          JOIN oasis o ON o.tile_id = ot.id
          WHERE
            (SELECT value FROM active_slot_count) = 0
            AND o.village_id IS NOT NULL
        ),
        candidate_oasis_owners AS (
          SELECT
            m.candidate_tile,
            m.oasis_tile,
            ov.id AS owner_village_id,
            ov.name AS owner_village_name,
            ov.slug AS owner_village_slug,
            vt.x AS owner_village_x,
            vt.y AS owner_village_y
          FROM candidate_oasis_matches m
          JOIN oasis oo ON oo.tile_id = m.oasis_tile
          LEFT JOIN villages ov ON ov.id = oo.village_id
          LEFT JOIN tiles vt ON vt.id = ov.tile_id
        )
      SELECT
        c.id AS tile_id,
        c.x AS coordinates_x,
        c.y AS coordinates_y,
        c.resource_field_composition AS resource_field_composition,
        (
          SELECT COALESCE(
            JSON_GROUP_ARRAY(
              JSON_OBJECT(
                'oasisTileId', matched.oasis_tile,
                'ownerVillage', JSON(
                  CASE
                    WHEN matched.owner_village_id IS NULL THEN 'null'
                    ELSE JSON_OBJECT(
                      'id', matched.owner_village_id,
                      'name', matched.owner_village_name,
                      'slug', matched.owner_village_slug,
                      'coordinates', JSON_OBJECT(
                        'x', matched.owner_village_x,
                        'y', matched.owner_village_y
                      )
                    )
                  END
                )
              )
            ),
            '[]'
          )
          FROM (
            SELECT
              oasis_tile,
              owner_village_id,
              owner_village_name,
              owner_village_slug,
              owner_village_x,
              owner_village_y
            FROM candidate_oasis_owners
            WHERE candidate_tile = c.id
            ORDER BY oasis_tile
          ) matched
        ) AS oasis_owners_json,
        ((c.x - sv.x) * (c.x - sv.x) + (c.y - sv.y) * (c.y - sv.y)) AS distance_squared
      FROM candidates c
      JOIN valid_candidates vc ON vc.candidate_tile = c.id
      CROSS JOIN src_village sv
      ORDER BY distance_squared ASC;
    `,
    bind: {
      $tile_x: x,
      $tile_y: y,
      $rfc_param: resourceFieldComposition,
      $requested_slot_bonuses: JSON.stringify(requestedSlotBonuses),
    },
    schema: getTilesWithBonusesRowSchema,
  });

  return rows.map((row) => {
    const oasisOwners = parseOasisOwnersJson(row.oasis_owners_json);

    return mapTileWithBonusesRowToDto(row, oasisOwners);
  });
});
