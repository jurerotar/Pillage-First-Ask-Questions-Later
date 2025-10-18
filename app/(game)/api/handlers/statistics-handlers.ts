import type { ApiHandler } from 'app/interfaces/api';
import { z } from 'zod';
import type { Player } from 'app/interfaces/models/game/player';

const getPlayerStatisticsSchema = z
  .strictObject({
    faction_id: z.string().brand<Player['faction']>(),
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    total_population: z.number(),
    tribe: z.string().brand<Player['tribe']>(),
    village_count: z.number(),
  })
  .transform((t) => {
    return {
      id: t.id,
      factionId: t.faction_id,
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

export const getPlayerStatistics: ApiHandler<
  z.infer<typeof getPlayerStatisticsSchema>[],
  '',
  GetPlayersStatisticsBody
> = (database, { body }) => {
  const { lastPlayerId = null } = body;

  const rows = database.selectObjects(
    `
      WITH player_pop AS (SELECT p.id,
                                 p.name,
                                 p.slug,
                                 p.tribe,
                                 p.faction_id,
                                 CAST(
                                   COALESCE(
                                     SUM(
                                       CASE WHEN ei.effect = 'wheatProduction' THEN e.value ELSE 0 END
                                     ),
                                     0
                                   ) AS INTEGER
                                 ) AS total_population,
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
                          GROUP BY p.id, p.name, p.slug, p.tribe, p.faction_id),

           cursor_row AS (SELECT total_population, id
                          FROM player_pop
                          WHERE id = $last_player_id)

      SELECT id, name, slug, tribe, faction_id, total_population, village_count
      FROM player_pop
      WHERE ($last_player_id IS NULL)
         OR (
        EXISTS(SELECT 1 FROM cursor_row)
          AND (
          (total_population < (SELECT total_population FROM cursor_row))
            OR (total_population = (SELECT total_population FROM cursor_row) AND id > $last_player_id)
          )
        )
      ORDER BY total_population DESC, id
      LIMIT 50;
    `,
    {
      $last_player_id: lastPlayerId,
    },
  );

  return z.array(getPlayerStatisticsSchema).parse(rows);
};

const getVillageStatisticsSchema = z
  .strictObject({
    village_id: z.number(),
    village_name: z.string(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    population: z.number(),
    player_id: z.number(),
    player_name: z.string(),
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
    };
  });

type GetVillageStatisticsBody = {
  lastVillageId: number | null;
};

export const getVillageStatistics: ApiHandler<
  z.infer<typeof getVillageStatisticsSchema>[],
  '',
  GetVillageStatisticsBody
> = (database, { body }) => {
  const { lastVillageId = null } = body;

  const rows = database.selectObjects(
    `
      WITH village_pop AS (SELECT v.id AS village_id,
                                  v.name AS village_name,
                                  t.x AS coordinates_x,
                                  t.y AS coordinates_y,
                                  v.player_id,
                                  p.name AS player_name,
                                  -- integer population (sum of matching effect values)
                                  CAST(
                                    COALESCE(
                                      SUM(
                                        CASE WHEN ei.effect = 'wheatProduction' THEN e.value ELSE 0 END
                                      ),
                                      0
                                    ) AS INTEGER
                                  ) AS population
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

      SELECT village_id AS id,
             village_name AS name,
             coordinates_x,
             coordinates_y,
             population,
             player_id,
             player_name
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
      LIMIT 50;
    `,
    {
      $last_village_id: lastVillageId,
    },
  );

  return z.array(getVillageStatisticsSchema).parse(rows);
};
