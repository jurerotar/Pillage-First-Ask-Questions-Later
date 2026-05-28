import { z } from 'zod';
import {
  playerRankingItemDtoSchema,
  serverOverviewStatisticsDtoSchema,
  villageRankingItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import type { Faction } from '@pillage-first/types/models/faction';
import type { Tribe } from '@pillage-first/types/models/tribe';
import {
  selectPlayerRankingsQuery,
  selectPlayerStatsByTribeAndFactionQuery,
  selectVillageRankingsQuery,
  selectVillageStatsByTribeAndFactionQuery,
} from '../../queries/statistics-queries';
import { createController } from '../controller';
import {
  mapPlayerRankingRowToDto,
  mapServerOverviewRowToDto,
  mapVillageRankingRowToDto,
} from './mappers/statistics-mapper';
import {
  getPlayerRankingsRowSchema,
  getVillageRankingsRowSchema,
  playersStatsRowSchema,
  villagesStatsRowSchema,
} from './schemas/statistics-schemas';

export const getPlayerRankings = createController('/statistics/players', {
  summary: 'Get player rankings',
  requestParams: {
    query: z.strictObject({
      lastPlayerId: z.coerce.number().nullable().optional(),
    }),
  },
  response: z.array(playerRankingItemDtoSchema),
})(({ database, query }) => {
  const { lastPlayerId = null } = query;

  // TODO: At the moment, this never returns a paginated response. Make sure to optimize that in the future!
  const rows = database.selectObjects({
    sql: selectPlayerRankingsQuery,
    bind: {
      $last_player_id: lastPlayerId,
    },
    schema: getPlayerRankingsRowSchema,
  });

  return rows.map(mapPlayerRankingRowToDto);
});

export const getVillageRankings = createController('/statistics/villages', {
  summary: 'Get village rankings',
  requestParams: {
    query: z.strictObject({
      lastVillageId: z.coerce.number().nullable().optional(),
    }),
  },
  response: z.array(villageRankingItemDtoSchema),
})(({ database, query }) => {
  const { lastVillageId = null } = query;

  // TODO: At the moment, this never returns a paginated response. Make sure to optimize that in the future!
  const rows = database.selectObjects({
    sql: selectVillageRankingsQuery,
    bind: {
      $last_village_id: lastVillageId,
    },
    schema: getVillageRankingsRowSchema,
  });

  return rows.map(mapVillageRankingRowToDto);
});

export const getGameWorldOverview = createController('/statistics/overview', {
  summary: 'Get game world overview statistics',
  response: serverOverviewStatisticsDtoSchema,
})(({ database }) => {
  const playersStats = database.selectObjects({
    sql: selectPlayerStatsByTribeAndFactionQuery,
    schema: playersStatsRowSchema,
  });

  const villagesStats = database.selectObjects({
    sql: selectVillageStatsByTribeAndFactionQuery,
    schema: villagesStatsRowSchema,
  });

  let totalPlayers = 0;

  const playersByTribe: Record<Tribe, number> = {
    gauls: 0,
    romans: 0,
    teutons: 0,
    egyptians: 0,
    huns: 0,
    spartans: 0,
    nature: 0,
    natars: 0,
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

  const villagesByTribe: Record<Tribe, number> = {
    gauls: 0,
    romans: 0,
    teutons: 0,
    egyptians: 0,
    huns: 0,
    spartans: 0,
    nature: 0,
    natars: 0,
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

  return mapServerOverviewRowToDto({
    player_count: totalPlayers,
    village_count: totalVillages,
    players_by_tribe: playersByTribe,
    players_by_faction: playersByFaction,
    villages_by_tribe: villagesByTribe,
    villages_by_faction: villagesByFaction,
  });
});
