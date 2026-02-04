import type { Faction } from '@pillage-first/types/models/faction';
import type { PlayableTribe } from '@pillage-first/types/models/tribe';
import { createController } from '../types/controller';
import {
  getPlayerRankingsSchema,
  getServerOverviewStatisticsSchema,
  getVillageRankingsSchema,
  playersStatsRowSchema,
  villagesStatsRowSchema,
} from './schemas/statistics-schemas';

export const getPlayerRankings = createController('/statistics/players')(
  ({ database, body }) => {
    const { lastPlayerId = null } = body;

    // TODO: At the moment, this never returns a paginated response. Make sure to optimize that in the future!
    return database.selectObjects({
      sql: `
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
      bind: {
        $last_player_id: lastPlayerId,
      },
      schema: getPlayerRankingsSchema,
    });
  },
);

export const getVillageRankings = createController('/statistics/villages')(
  ({ database, body }) => {
    const { lastVillageId = null } = body;

    // TODO: At the moment, this never returns a paginated response. Make sure to optimize that in the future!
    return database.selectObjects({
      sql: `
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
      bind: {
        $last_village_id: lastVillageId,
      },
      schema: getVillageRankingsSchema,
    });
  },
);

export const getGameWorldOverview = createController('/statistics/overview')(
  ({ database }) => {
    const playersStats = database.selectObjects({
      sql: `
    SELECT
      p.tribe AS tribe,
      f.faction AS faction,
      COUNT(p.id) AS player_count
    FROM players p
    JOIN factions f ON p.faction_id = f.id
    GROUP BY p.tribe, f.faction
  `,
      schema: playersStatsRowSchema,
    });

    const villagesStats = database.selectObjects({
      sql: `
    SELECT
      p.tribe AS tribe,
      f.faction AS faction,
      COUNT(v.id) AS village_count
    FROM villages v
    JOIN players p ON v.player_id = p.id
    JOIN factions f ON p.faction_id = f.id
    GROUP BY p.tribe, f.faction
  `,
      schema: villagesStatsRowSchema,
    });

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
  },
);
