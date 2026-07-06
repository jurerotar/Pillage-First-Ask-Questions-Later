import { z } from 'zod';
import {
  oasisByBonusSearchResultItemDtoSchema,
  oasisOwnerDtoSchema,
} from '@pillage-first/types/dtos/oasis-search';
import type { Resource } from '@pillage-first/types/models/resource';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';
import { createController } from '../controller';
import { getTilesWithBonusesRowSchema } from './schemas/oasis-bonus-finder-schemas';

const CROPPER_RESOURCE_FIELD_COMPOSITIONS = ['3339', '11115', '00018'];
const CROPPER_RESOURCE_FIELD_COMPOSITIONS_SQL =
  CROPPER_RESOURCE_FIELD_COMPOSITIONS.map((rfc) => `'${rfc}'`).join(', ');

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

type OasisBonus = {
  bonus: 25 | 50;
  resource: Resource;
};

const oasisBonusSchema = z.strictObject({
  bonus: z.union([z.literal(25), z.literal(50)]),
  resource: resourceSchema,
});

const oasisBonusSlotSchema = z.array(oasisBonusSchema).max(2);

const ownedOasisRowSchema = z.strictObject({
  oasis_tile_id: z.number(),
  oasis_x: z.number(),
  oasis_y: z.number(),
  owner_village_id: z.number(),
  owner_village_name: z.string(),
  owner_village_slug: z.string().nullable(),
  owner_village_x: z.number(),
  owner_village_y: z.number(),
});

type OasisOwnerDto = z.infer<typeof oasisOwnerDtoSchema>;

const dedupeOasisOwners = (oasisOwners: OasisOwnerDto[]) => {
  return [
    ...new Map(oasisOwners.map((owner) => [owner.oasisTileId, owner])).values(),
  ];
};

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

  const s1 = createSqlBindings(firstOasis);
  const s2 = createSqlBindings(secondOasis);
  const s3 = createSqlBindings(thirdOasis);
  const requestedOasisSlots = [firstOasis, secondOasis, thirdOasis];

  const sqlBindings: Record<string, number | string> = {
    $tile_x: x,
    $tile_y: y,
    $rfc_param: resourceFieldComposition,
  };

  const hasRequiredOases = requestedOasisSlots.some((slot) => {
    return slot.length > 0;
  });

  const requiredBonuses = (() => {
    if (!hasRequiredOases) {
      return [];
    }

    const allRequiredBonuses = new Map<string, OasisBonus>();
    for (const slot of requestedOasisSlots) {
      for (const bonus of slot) {
        allRequiredBonuses.set(`${bonus.resource}-${bonus.bonus}`, bonus);
      }
    }

    return [...allRequiredBonuses.values()];
  })();

  const sqlParts: string[] = [];

  sqlParts.push(`
    WITH
      src_village AS (
        VALUES ($tile_x, $tile_y)
        ),`);

  if (hasRequiredOases) {
    const bonusConditions = requiredBonuses
      .map((_, i) => `(o.resource = $ro_r${i} AND o.bonus = $ro_b${i})`)
      .join(' OR ');

    for (const [i, b] of requiredBonuses.entries()) {
      sqlBindings[`$ro_r${i}`] = b.resource;
      sqlBindings[`$ro_b${i}`] = b.bonus;
    }

    sqlParts.push(`
      candidates AS (
        SELECT DISTINCT t.id, t.x, t.y, rfc.resource_field_composition
        FROM oasis o
               JOIN tiles ot ON ot.id = o.tile_id
               JOIN tiles t ON t.x BETWEEN ot.x - 3 AND ot.x + 3 AND t.y BETWEEN ot.y - 3 AND ot.y + 3
               LEFT JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
        WHERE (${bonusConditions})
          AND t.type = 'free'
          AND (
            ($rfc_param = 'any-cropper' AND rfc.resource_field_composition IN (${CROPPER_RESOURCE_FIELD_COMPOSITIONS_SQL}))
              OR ($rfc_param <> 'any-cropper' AND rfc.resource_field_composition = $rfc_param)
            )
        )`);
  } else {
    sqlParts.push(`
      candidates AS (
        SELECT t.id, t.x, t.y, rfc.resource_field_composition
        FROM tiles t
               LEFT JOIN resource_field_composition_ids rfc ON rfc.id = t.resource_field_composition_id
        WHERE t.type = 'free'
          AND (
            ($rfc_param = 'any-cropper' AND rfc.resource_field_composition IN (${CROPPER_RESOURCE_FIELD_COMPOSITIONS_SQL}))
              OR ($rfc_param <> 'any-cropper' AND rfc.resource_field_composition = $rfc_param)
            )
        )`);
  }

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

  for (const { idx, slot } of slots) {
    sqlBindings[`$r${idx}`] = slot.r1;
    sqlBindings[`$b${idx}`] = slot.b1;

    if (slot.count === 2) {
      sqlBindings[`$r${idx}_2`] = slot.r1_2!;
      sqlBindings[`$b${idx}_2`] = slot.b1_2!;
    }
  }

  const buildSlotMatchCte = (
    idx: number,
    slot: NonNullable<ReturnType<typeof createSqlBindings>>,
  ) => {
    if (slot.count === 1) {
      return `
        s${idx}_matches AS (
          SELECT c.id AS candidate_tile, o.tile_id AS oasis_tile
          FROM candidates c
          JOIN tiles ot ON ot.x BETWEEN c.x - 3 AND c.x + 3
            AND ot.y BETWEEN c.y - 3 AND c.y + 3
          JOIN oasis o ON o.tile_id = ot.id
          WHERE o.resource = $r${idx}
            AND o.bonus = $b${idx}
          GROUP BY c.id, o.tile_id
        )
      `;
    }

    return `
        s${idx}_matches AS (
          SELECT c.id AS candidate_tile, o.tile_id AS oasis_tile
          FROM candidates c
          JOIN tiles ot ON ot.x BETWEEN c.x - 3 AND c.x + 3
            AND ot.y BETWEEN c.y - 3 AND c.y + 3
          JOIN oasis o ON o.tile_id = ot.id
          WHERE (
            (o.resource = $r${idx}   AND o.bonus = $b${idx})
            OR (o.resource = $r${idx}_2 AND o.bonus = $b${idx}_2)
          )
          GROUP BY c.id, o.tile_id
          HAVING COUNT(DISTINCT (o.resource || '-' || o.bonus)) = 2
        )
    `;
  };

  if (slots.length > 0) {
    sqlParts.push(
      `,
      ${slots.map(({ idx, slot }) => buildSlotMatchCte(idx, slot)).join(',')}`,
    );

    const candidateOasisMatchesSelect = slots
      .map(
        ({ idx }) => `SELECT candidate_tile, oasis_tile FROM s${idx}_matches`,
      )
      .join('\nUNION ALL\n');

    sqlParts.push(`
      ,
      candidate_oasis_matches AS (
        SELECT DISTINCT candidate_tile, oasis_tile
        FROM (
          ${candidateOasisMatchesSelect}
        )
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
      )`);
  }

  const buildOasisOwnersJsonSelect = () => {
    if (slots.length === 0) {
      return `'[]' AS oasis_owners_json`;
    }

    return `
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
      ) AS oasis_owners_json`;
  };

  sqlParts.push(`
    SELECT
      c.id AS tile_id,
      c.x AS coordinates_x,
      c.y AS coordinates_y,
      c.resource_field_composition AS resource_field_composition,
      ${buildOasisOwnersJsonSelect()},
      ((c.x - sv.column1) * (c.x - sv.column1) + (c.y - sv.column2) * (c.y - sv.column2)) AS distance_squared
    FROM candidates c
           CROSS JOIN src_village sv
  `);

  const whereClauses: string[] = [];

  if (slots.length === 1) {
    whereClauses.push(
      `EXISTS (SELECT 1 FROM s${slots[0].idx}_matches WHERE candidate_tile = c.id)`,
    );
  } else if (slots.length > 1) {
    let joinSql = `FROM s${slots[0].idx}_matches AS s1\n`;
    for (let i = 1; i < slots.length; i += 1) {
      const right = `s${i + 1}`;
      const onConditions = [`${right}.candidate_tile = s1.candidate_tile`];
      for (let j = 0; j < i; j += 1) {
        onConditions.push(`${right}.oasis_tile <> s${j + 1}.oasis_tile`);
      }
      joinSql += `JOIN s${slots[i].idx}_matches AS ${right} ON (${onConditions.join(' AND ')})\n`;
    }
    whereClauses.push(
      `EXISTS (SELECT 1\n${joinSql} WHERE s1.candidate_tile = c.id)`,
    );
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

  const rows = database.selectObjects({
    sql,
    bind: sqlBindings,
    schema: getTilesWithBonusesRowSchema,
  });

  const ownedOases =
    slots.length === 0
      ? database.selectObjects({
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
        })
      : [];

  const ownedOasesByCoordinates = new Map<string, typeof ownedOases>();
  for (const oasis of ownedOases) {
    const key = `${oasis.oasis_x},${oasis.oasis_y}`;
    const existingOases = ownedOasesByCoordinates.get(key);

    if (existingOases) {
      existingOases.push(oasis);
    } else {
      ownedOasesByCoordinates.set(key, [oasis]);
    }
  }

  return rows.map((row) => {
    const oasisOwners =
      slots.length === 0
        ? dedupeOasisOwners(
            (() => {
              const nearbyOwnedOases: typeof ownedOases = [];

              for (
                let oasisX = row.coordinates_x - 3;
                oasisX <= row.coordinates_x + 3;
                oasisX += 1
              ) {
                for (
                  let oasisY = row.coordinates_y - 3;
                  oasisY <= row.coordinates_y + 3;
                  oasisY += 1
                ) {
                  const oases =
                    ownedOasesByCoordinates.get(`${oasisX},${oasisY}`) ?? [];
                  nearbyOwnedOases.push(...oases);
                }
              }

              return nearbyOwnedOases;
            })()
              .sort((a, b) => a.oasis_tile_id - b.oasis_tile_id)
              .map((oasis) => ({
                oasisTileId: oasis.oasis_tile_id,
                ownerVillage: {
                  id: oasis.owner_village_id,
                  name: oasis.owner_village_name,
                  slug: oasis.owner_village_slug,
                  coordinates: {
                    x: oasis.owner_village_x,
                    y: oasis.owner_village_y,
                  },
                },
              })),
          )
        : dedupeOasisOwners(
            z
              .array(oasisOwnerDtoSchema)
              .parse(JSON.parse(row.oasis_owners_json)),
          );

    return oasisByBonusSearchResultItemDtoSchema.parse({
      tileId: row.tile_id,
      coordinates: { x: row.coordinates_x, y: row.coordinates_y },
      resourceFieldComposition: row.resource_field_composition,
      oasisOwners,
      distance: roundToNDecimalPoints(Math.sqrt(row.distance_squared), 2),
    });
  });
});
