import { z } from 'zod';
import type { ApiHandler } from 'app/interfaces/api';
import { factionSchema } from 'app/interfaces/models/game/faction';
import { tribeSchema } from 'app/interfaces/models/game/tribe';

const getPlayerRankingsSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    tribe: tribeSchema,
    faction: factionSchema,
    total_population: z.number(),
    village_count: z.number(),
  })
  .transform((t) => {
    return {
      id: t.id,
      faction: t.faction,
      name: t.name,
      slug: t.slug,
      tribe: t.tribe,
      totalPopulation: t.total_population,
      villageCount: t.village_count,
    };
  });

type GetPlayersStatisticsBody = {
  lastPlayerId: number | null;
};

export const getPlayerRankings: ApiHandler<'', GetPlayersStatisticsBody> = (
  database,
  { body },
) => {
  const { lastPlayerId = null } = body;

  // TODO: At the moment, this never returns a paginated response. Make sure to optimize that in the future!
  const rows = database.selectObjects(
    `
      WITH player_pop AS (
        SELECT
          p.id,
          p.name,
          p.slug,
          p.tribe,
          (SELECT faction FROM factions WHERE id = p.faction_id) AS faction,
          SUM(CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END) AS total_population,
          COUNT(DISTINCT v.id) AS village_count
        FROM players p
               LEFT JOIN villages v ON v.player_id = p.id
               LEFT JOIN effects e
                         ON e.village_id = v.id
                           AND e.type = 'base'
                           AND e.scope = 'village'
                           AND e.source = 'building'
                           AND e.source_specifier = 0
               LEFT JOIN effect_ids ei ON ei.id = e.effect_id

            -- join factions to get the human-readable faction string
               LEFT JOIN factions f ON f.id = p.faction_id

        GROUP BY
          p.id,
          p.name,
          p.slug,
          p.tribe,
          f.faction
        ),

        cursor_row AS (
          SELECT total_population, id
          FROM player_pop
          WHERE id = $last_player_id
          )

      SELECT
        id,
        name,
        slug,
        tribe,
        faction,
        total_population,
        village_count
      FROM player_pop
      WHERE ($last_player_id IS NULL)
        OR (
          EXISTS(SELECT 1 FROM cursor_row)
            AND (
            (total_population < (SELECT total_population FROM cursor_row))
              OR (total_population = (SELECT total_population FROM cursor_row) AND id > $last_player_id)
            )
          )
      ORDER BY total_population DESC, id;
    `,
    {
      $last_player_id: lastPlayerId,
    },
  );

  return z.array(getPlayerRankingsSchema).parse(rows);
};

const getVillageRankingsSchema = z
  .strictObject({
    village_id: z.number(),
    village_name: z.string(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    population: z.number(),
    player_id: z.number(),
    player_name: z.string(),
    player_slug: z.string(),
  })
  .transform((t) => {
    return {
      id: t.village_id,
      name: t.village_name,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      population: t.population,
      playerId: t.player_id,
      playerName: t.player_name,
      playerSlug: t.player_slug,
    };
  });

type GetVillageStatisticsBody = {
  lastVillageId: number | null;
};

export const getVillageRankings: ApiHandler<'', GetVillageStatisticsBody> = (
  database,
  { body },
) => {
  const { lastVillageId = null } = body;

  // TODO: At the moment, this never returns a paginated response. Make sure to optimize that in the future!
  const rows = database.selectObjects(
    `
      WITH village_pop AS (SELECT v.id AS village_id,
                                  v.name AS village_name,
                                  t.x AS coordinates_x,
                                  t.y AS coordinates_y,
                                  v.player_id,
                                  p.name AS player_name,
                                  p.slug AS player_slug,
                                  CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END AS population
                           FROM villages v
                                  LEFT JOIN tiles t ON t.id = v.tile_id
                                  LEFT JOIN players p ON p.id = v.player_id
                                  LEFT JOIN effects e
                                            ON e.village_id = v.id
                                              AND e.type = 'base'
                                              AND e.scope = 'village'
                                              AND e.source = 'building'
                                              AND e.source_specifier = 0
                                  LEFT JOIN effect_ids ei ON ei.id = e.effect_id
                           GROUP BY v.id, v.name, t.x, t.y, v.player_id, p.name),

           cursor_row AS (SELECT population, village_id
                          FROM village_pop
                          WHERE village_id = $last_village_id)

      SELECT village_id,
             village_name,
             coordinates_x,
             coordinates_y,
             population,
             player_id,
             player_name,
             player_slug
      FROM village_pop
      WHERE ($last_village_id IS NULL)
         OR (
        EXISTS(SELECT 1 FROM cursor_row)
          AND (
          (population < (SELECT population FROM cursor_row))
            OR (population = (SELECT population FROM cursor_row) AND village_id > $last_village_id)
          )
        )
      ORDER BY population DESC, village_id
    `,
    {
      $last_village_id: lastVillageId,
    },
  );

  return z.array(getVillageRankingsSchema).parse(rows);
};
