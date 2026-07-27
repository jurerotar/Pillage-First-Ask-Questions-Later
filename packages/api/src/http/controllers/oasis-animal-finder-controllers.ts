import type { BindableValue } from '@sqlite.org/sqlite-wasm';
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

  const sqlBindings: Record<string, BindableValue> = {};

  const uniqueFilters = new Map<NatureUnitId, number>();
  for (const { animal, amount } of animalFilters) {
    uniqueFilters.set(animal, Math.max(uniqueFilters.get(animal) ?? 0, amount));
  }

  const filterClauses: string[] = [];
  for (const [index, [animal, amount]] of [
    ...uniqueFilters.entries(),
  ].entries()) {
    sqlBindings[`$animal_${index}`] = animal;
    sqlBindings[`$amount_${index}`] = amount;

    filterClauses.push(`
        (animal_unit = $animal_${index} AND amount >= $amount_${index})
      `);
  }

  const rows = database.selectObjects({
    sql: `
        WITH
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
            ${
              filterClauses.length > 0
                ? `
                  SELECT tile_id
                  FROM animal_amounts
                  WHERE ${filterClauses.join(' OR ')}
                  GROUP BY tile_id
                  HAVING COUNT(*) = ${uniqueFilters.size}
                `
                : `
                  SELECT id AS tile_id
                  FROM tiles
                  WHERE type_id = 2
                `
            }
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
      ...sqlBindings,
      $tile_x: x,
      $tile_y: y,
    },
    schema: getOasesWithAnimalsRowSchema,
  });
  return rows.map(mapOasisWithAnimalsRowToDto);
});
