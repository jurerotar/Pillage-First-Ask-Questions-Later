import { z } from 'zod';
import {
  type Faction,
  factionSchema,
} from '@pillage-first/types/models/faction';
import {
  type PlayableTribe,
  tribeSchema,
} from '@pillage-first/types/models/tribe';
import type { ApiHandler } from '../types/handler';

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
      WITH
        village_pop AS (
          SELECT
            v.id AS village_id,
            v.name AS village_name,
            t.x AS coordinates_x,
            t.y AS coordinates_y,
            v.player_id,
            p.name AS player_name,
            p.slug AS player_slug,
            CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END AS population
          FROM
            villages v
              LEFT JOIN tiles t ON t.id = v.tile_id
              LEFT JOIN players p ON p.id = v.player_id
              LEFT JOIN effects e
                        ON e.village_id = v.id
                          AND e.type = 'base'
                          AND e.scope = 'village'
                          AND e.source = 'building'
                          AND e.source_specifier = 0
              LEFT JOIN effect_ids ei ON ei.id = e.effect_id
          GROUP BY v.id, v.name, t.x, t.y, v.player_id, p.name
          ),

        cursor_row AS (
          SELECT population, village_id
          FROM
            village_pop
          WHERE
            village_id = $last_village_id
          )

      SELECT
        village_id,
        village_name,
        coordinates_x,
        coordinates_y,
        population,
        player_id,
        player_name,
        player_slug
      FROM
        village_pop
      WHERE
        ($last_village_id IS NULL)
        OR (
          EXISTS
          (
            SELECT 1
            FROM cursor_row
            )
            AND (
            (population < (
              SELECT population
              FROM cursor_row
              ))
              OR (population = (
              SELECT population
              FROM cursor_row
              ) AND village_id > $last_village_id)
            )
          )
      ORDER BY
        population DESC, village_id
    `,
    {
      $last_village_id: lastVillageId,
    },
  );

  return z.array(getVillageRankingsSchema).parse(rows);
};

const playersStatsRowSchema = z.object({
  tribe: tribeSchema,
  faction: factionSchema,
  player_count: z.number(),
});

const villagesStatsRowSchema = z.object({
  tribe: tribeSchema,
  faction: factionSchema,
  village_count: z.number(),
});

const getServerOverviewStatisticsSchema = z
  .strictObject({
    player_count: z.number(),
    village_count: z.number(),
    players_by_tribe: z.record(tribeSchema, z.number()),
    players_by_faction: z.record(factionSchema, z.number()),
    villages_by_tribe: z.record(tribeSchema, z.number()),
    villages_by_faction: z.record(factionSchema, z.number()),
  })
  .transform((t) => {
    return {
      playerCount: t.player_count,
      villageCount: t.village_count,
      playersByTribe: t.players_by_tribe,
      playersByFaction: t.players_by_faction,
      villagesByTribe: t.villages_by_tribe,
      villagesByFaction: t.villages_by_faction,
    };
  });

export const getGameWorldOverview: ApiHandler = (database) => {
  const rawPlayersStats = database.selectObjects(`
    SELECT
      p.tribe AS tribe,
      f.faction AS faction,
      COUNT(p.id) AS player_count
    FROM players p
    JOIN factions f ON p.faction_id = f.id
    GROUP BY p.tribe, f.faction
  `);

  const rawVillagesStats = database.selectObjects(`
    SELECT
      p.tribe AS tribe,
      f.faction AS faction,
      COUNT(v.id) AS village_count
    FROM villages v
    JOIN players p ON v.player_id = p.id
    JOIN factions f ON p.faction_id = f.id
    GROUP BY p.tribe, f.faction
  `);

  const playersStats = z.array(playersStatsRowSchema).parse(rawPlayersStats);
  const villagesStats = z.array(villagesStatsRowSchema).parse(rawVillagesStats);

  let totalPlayers = 0;

  const playersByTribe: Record<PlayableTribe, number> = {
    gauls: 0,
    romans: 0,
    teutons: 0,
    egyptians: 0,
    huns: 0,
  };

  const playersByFaction: Record<Faction, number> = {
    player: 0,
    npc1: 0,
    npc2: 0,
    npc3: 0,
    npc4: 0,
    npc5: 0,
    npc6: 0,
    npc7: 0,
    npc8: 0,
  };

  for (const row of playersStats) {
    totalPlayers += row.player_count;
    playersByTribe[row.tribe] += row.player_count;
    playersByFaction[row.faction] += row.player_count;
  }

  let totalVillages = 0;

  const villagesByTribe: Record<PlayableTribe, number> = {
    gauls: 0,
    romans: 0,
    teutons: 0,
    egyptians: 0,
    huns: 0,
  };

  const villagesByFaction: Record<Faction, number> = {
    player: 0,
    npc1: 0,
    npc2: 0,
    npc3: 0,
    npc4: 0,
    npc5: 0,
    npc6: 0,
    npc7: 0,
    npc8: 0,
  };

  for (const row of villagesStats) {
    totalVillages += row.village_count;
    villagesByTribe[row.tribe] += row.village_count;
    villagesByFaction[row.faction] += row.village_count;
  }

  return getServerOverviewStatisticsSchema.parse({
    player_count: totalPlayers,
    village_count: totalVillages,
    players_by_tribe: playersByTribe,
    players_by_faction: playersByFaction,
    villages_by_tribe: villagesByTribe,
    villages_by_faction: villagesByFaction,
  });
};
