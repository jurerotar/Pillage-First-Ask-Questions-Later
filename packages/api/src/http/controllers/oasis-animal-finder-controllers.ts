import { z } from 'zod';
import { oasisByAnimalsSearchResultItemDtoSchema } from '@pillage-first/types/dtos/oasis-search';
import type { NatureUnitId } from '@pillage-first/types/models/unit';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import { createController } from '../controller';
import { mapOasisWithAnimalsRowToDto } from './mappers/oasis-finder-mapper';
import { getOasesWithAnimalsRowSchema } from './schemas/oasis-animal-finder-schemas';

export const getOasesWithAnimals = createController(
  '/search/oases/by-animals',
  'post',
  {
    summary: 'Find oasis tiles with specific nature troop amounts',
    requestBody: z.strictObject({
      x: z.number(),
      y: z.number(),
      animalFilters: z.array(
        z.strictObject({
          animal: natureUnitIdSchema,
          amount: z.number().min(1),
        }),
      ),
    }),
    response: z.array(oasisByAnimalsSearchResultItemDtoSchema),
  },
)(({ database, body }) => {
  const { x, y, animalFilters } = body;

  const uniqueFilters = new Map<NatureUnitId, number>();
  for (const { animal, amount } of animalFilters) {
    uniqueFilters.set(animal, Math.max(uniqueFilters.get(animal) ?? 0, amount));
  }

  const rows = database.selectObjects({
    sql: `
        WITH
          requested_animals AS (
            SELECT
              JSON_EXTRACT(value, '$[0]') AS animal_unit,
              JSON_EXTRACT(value, '$[1]') AS requested_amount
            FROM JSON_EACH($animal_filters)
          ),
          animal_amounts AS (
            SELECT
              tr.tile_id,
              ui.unit AS animal_unit,
              SUM(tr.amount) AS amount
            FROM troops tr
            JOIN unit_ids ui ON ui.id = tr.unit_id
            GROUP BY tr.tile_id, tr.unit_id
          ),
          matching_oases AS (
            SELECT t.id AS tile_id
            FROM tiles t
            WHERE
              t.type_id = 2
              AND NOT EXISTS (
                SELECT 1
                FROM requested_animals ra
                LEFT JOIN animal_amounts aa
                  ON aa.tile_id = t.id
                  AND aa.animal_unit = ra.animal_unit
                WHERE COALESCE(aa.amount, 0) < ra.requested_amount
              )
          ),
          bonuses_by_tile AS (
            SELECT
              o.tile_id,
              JSON_GROUP_ARRAY(JSON_OBJECT('resource', ri.resource, 'bonus', o.bonus)) AS bonuses_json
            FROM oasis o
            JOIN resource_ids ri ON ri.id = o.resource_id
            GROUP BY o.tile_id
          ),
          animals_by_tile AS (
            SELECT
              tile_id,
              JSON_GROUP_ARRAY(JSON_OBJECT('unitId', animal_unit, 'amount', amount)) AS animals_json
            FROM animal_amounts
            GROUP BY tile_id
          )
        SELECT
          t.id AS tile_id,
          t.x AS coordinates_x,
          t.y AS coordinates_y,
          COALESCE(b.bonuses_json, '[]') AS bonuses_json,
          COALESCE(a.animals_json, '[]') AS animals_json,
          ((t.x - $tile_x) * (t.x - $tile_x) + (t.y - $tile_y) * (t.y - $tile_y)) AS distance_squared
        FROM matching_oases mo
        JOIN tiles t ON t.id = mo.tile_id
        LEFT JOIN bonuses_by_tile b ON b.tile_id = t.id
        LEFT JOIN animals_by_tile a ON a.tile_id = t.id
        WHERE
          t.type_id = 2
        ORDER BY distance_squared ASC;
      `,
    bind: {
      $animal_filters: JSON.stringify([...uniqueFilters.entries()]),
      $tile_x: x,
      $tile_y: y,
    },
    schema: getOasesWithAnimalsRowSchema,
  });
  return rows.map(mapOasisWithAnimalsRowToDto);
});
