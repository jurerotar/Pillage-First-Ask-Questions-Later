import { z } from 'zod';
import type { Resource } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';
import type { Controller } from '../types/controller';

const createSqlBindings = (slot: OasisBonus[]) => {
  if (slot.length === 0) {
    return null;
  }

  if (slot.length === 1) {
    return {
      count: 1,
      r1: slot[0].resource,
      b1: slot[0].bonus,
    };
  }

  return {
    count: 2,
    r1: slot[0].resource,
    b1: slot[0].bonus,
    r1_2: slot[1].resource,
    b1_2: slot[1].bonus,
  };
};

const getTilesWithBonusesSchema = z
  .strictObject({
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    resource_field_composition: resourceFieldCompositionSchema,
    distance_squared: z.number(),
  })
  .transform((t) => ({
    tileId: t.tile_id,
    coordinates: {
      x: t.coordinates_x,
      y: t.coordinates_y,
    },
    resourceFieldComposition: t.resource_field_composition,
    distance: roundToNDecimalPoints(Math.sqrt(t.distance_squared), 2),
  }));

type OasisBonus = {
  bonus: 25 | 50;
  resource: Resource;
};

type GetTilesWithBonusesBody = {
  resourceFieldComposition:
    | z.infer<typeof resourceFieldCompositionSchema>
    | 'any-cropper';
  bonuses: {
    firstOasis: OasisBonus[];
    secondOasis: OasisBonus[];
    thirdOasis: OasisBonus[];
  };
};

/**
 * GET /oasis-bonus-finder
 * @queryParam {number} x
 * @queryParam {number} y
 * @bodyContent application/json GetTilesWithBonusesBody
 * @bodyRequired
 */
export const getTilesWithBonuses: Controller<
  '/oasis-bonus-finder',
  'get',
  GetTilesWithBonusesBody
> = (database, { query, body }) => {
  const { x, y } = query;
  const { resourceFieldComposition, bonuses } = body;
  const { firstOasis, secondOasis, thirdOasis } = bonuses;

  const s1 = createSqlBindings(firstOasis);
  const s2 = createSqlBindings(secondOasis);
  const s3 = createSqlBindings(thirdOasis);

  const sqlBindings: Record<string, number | string> = {
    $tile_x: x,
    $tile_y: y,
    $rfc_param: resourceFieldComposition,
  };

  const sqlParts: string[] = [];

  sqlParts.push(`
    WITH
      src_village AS (
        VALUES ($tile_x, $tile_y)
        ),
      candidates AS (
        SELECT t.id, t.x, t.y, rfc.resource_field_composition
        FROM tiles t
               LEFT JOIN resource_field_compositions rfc ON rfc.id = t.resource_field_composition_id
        WHERE t.type = 'free'
          AND (
            ($rfc_param = 'any-cropper' AND rfc.resource_field_composition IN ('3339', '11115', '00018'))
              OR ($rfc_param <> 'any-cropper' AND rfc.resource_field_composition = $rfc_param)
            )
        )
    SELECT
      c.id AS tile_id,
      c.x AS coordinates_x,
      c.y AS coordinates_y,
      c.resource_field_composition AS resource_field_composition,
      ((c.x - sv.column1) * (c.x - sv.column1) + (c.y - sv.column2) * (c.y - sv.column2)) AS distance_squared
    FROM candidates c
           CROSS JOIN src_village sv
  `);

  const slots: {
    idx: number;
    slot: NonNullable<ReturnType<typeof createSqlBindings>>;
  }[] = [];

  if (s1) {
    slots.push({ idx: 1, slot: s1 });
  }
  if (s2) {
    slots.push({ idx: 2, slot: s2 });
  }
  if (s3) {
    slots.push({ idx: 3, slot: s3 });
  }

  const buildDerived = (
    idx: number,
    slot: NonNullable<ReturnType<typeof createSqlBindings>>,
  ) => {
    if (slot.count === 1) {
      sqlBindings[`$r${idx}`] = slot.r1;
      sqlBindings[`$b${idx}`] = slot.b1;
      return `
        (
          SELECT o.tile_id AS oasis_tile
          FROM oasis o
          JOIN oasis_occupiable_by ob ON ob.occupiable_oasis_tile_id = o.tile_id
          WHERE ob.occupiable_tile_id = c.id
            AND o.resource = $r${idx}
            AND o.bonus = $b${idx}
          GROUP BY o.tile_id
        )
      `;
    }

    // two bonuses on the same oasis
    sqlBindings[`$r${idx}`] = slot.r1;
    sqlBindings[`$b${idx}`] = slot.b1;
    sqlBindings[`$r${idx}_2`] = slot.r1_2!;
    sqlBindings[`$b${idx}_2`] = slot.b1_2!;

    return `
      (
        SELECT o.tile_id AS oasis_tile
        FROM oasis o
        JOIN oasis_occupiable_by ob ON ob.occupiable_oasis_tile_id = o.tile_id
        WHERE ob.occupiable_tile_id = c.id
          AND (
            (o.resource = $r${idx}   AND o.bonus = $b${idx})
            OR (o.resource = $r${idx}_2 AND o.bonus = $b${idx}_2)
          )
        GROUP BY o.tile_id
        HAVING COUNT(DISTINCT (o.resource || '-' || o.bonus)) = 2
      )
    `;
  };

  const whereClauses: string[] = [];

  if (slots.length === 1) {
    // single-slot fast path
    const d = buildDerived(slots[0].idx, slots[0].slot);
    whereClauses.push(
      `EXISTS (SELECT 1 FROM ${d} AS s1 WHERE s1.oasis_tile IS NOT NULL)`,
    );
  } else if (slots.length > 1) {
    // multi-slot: build derived subqueries and join with pairwise inequality in ON clauses
    const derived = slots.map(({ idx, slot }, i) => ({
      alias: `s${i + 1}`,
      sql: buildDerived(idx, slot),
    }));
    // build FROM ... JOIN ... ON conditions with pairwise inequality
    let joinSql = `FROM ${derived[0].sql} AS ${derived[0].alias}\n`;
    for (let i = 1; i < derived.length; i += 1) {
      const right = derived[i].alias;
      // pairwise inequality for the last alias against all previous ones
      const onConditions: string[] = [];
      for (let j = 0; j < i; j += 1) {
        onConditions.push(
          `${right}.oasis_tile <> ${derived[j].alias}.oasis_tile`,
        );
      }
      joinSql += `JOIN ${derived[i].sql} AS ${right} ON (${onConditions.join(' AND ')})\n`;
    }
    whereClauses.push(`EXISTS (SELECT 1\n${joinSql} )`);
  }

  if (whereClauses.length > 0) {
    sqlParts.push(`WHERE ${whereClauses.join('\n  AND ')}`);
  }

  sqlParts.push(
    `
      ORDER BY distance_squared ASC;
    `,
  );

  const sql = sqlParts.join('\n');

  const rows = database.selectObjects(sql, sqlBindings);

  return z.array(getTilesWithBonusesSchema).parse(rows);
};
