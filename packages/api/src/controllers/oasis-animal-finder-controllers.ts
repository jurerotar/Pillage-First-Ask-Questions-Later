import type { NatureUnitId } from '@pillage-first/types/models/unit';
import { createController } from '../utils/controller';
import { getOasesWithAnimalsSchema } from './schemas/oasis-animal-finder-schemas';

export const getOasesWithAnimals = createController('/oasis-animal-finder')(
  ({ database, query, body }) => {
    const { x, y } = query;
    const { animalFilters } = body;

    const sqlBindings: Record<string, number | string> = {
      $tile_x: x,
      $tile_y: y,
    };

    const uniqueFilters = new Map<NatureUnitId, number>();
    for (const { animal, amount } of animalFilters) {
      uniqueFilters.set(
        animal,
        Math.max(uniqueFilters.get(animal) ?? 0, amount),
      );
    }

    const filterClauses: string[] = [];
    for (const [index, [animal, amount]] of [
      ...uniqueFilters.entries(),
    ].entries()) {
      sqlBindings[`$animal_${index}`] = animal;
      sqlBindings[`$amount_${index}`] = amount;

      filterClauses.push(`
        EXISTS (
          SELECT 1
          FROM troops tr
          JOIN unit_ids ui ON ui.id = tr.unit_id
          WHERE tr.tile_id = t.id
            AND ui.unit = $animal_${index}
          GROUP BY tr.tile_id
          HAVING SUM(tr.amount) >= $amount_${index}
        )
      `);
    }

    return database.selectObjects({
      sql: `
        SELECT
          t.id AS tile_id,
          t.x AS coordinates_x,
          t.y AS coordinates_y,
          (
            SELECT JSON_GROUP_ARRAY(JSON_OBJECT('resource', o.resource, 'bonus', o.bonus))
            FROM
              oasis o
            WHERE
              o.tile_id = t.id
            ) AS bonuses_json,
          (
            SELECT JSON_GROUP_ARRAY(JSON_OBJECT('unitId', ui.unit, 'amount', tt.amount))
            FROM
              (
                SELECT tr.unit_id, SUM(tr.amount) AS amount
                FROM
                  troops tr
                WHERE
                  tr.tile_id = t.id
                GROUP BY tr.unit_id
                ) tt
                JOIN unit_ids ui ON ui.id = tt.unit_id
            ) AS animals_json,
          ((t.x - $tile_x) * (t.x - $tile_x) + (t.y - $tile_y) * (t.y - $tile_y)) AS distance_squared
        FROM
          tiles t
        WHERE
          t.type = 'oasis'
          ${filterClauses.length > 0 ? `AND ${filterClauses.join(' AND ')}` : ''}
        ORDER BY distance_squared ASC;
      `,
      bind: sqlBindings,
      schema: getOasesWithAnimalsSchema,
    });
  },
);
