import { cursorPaginatedResponseSchema } from '@pillage-first/types/dtos/pagination';
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
import {
  createCursorPage,
  cursorPaginationQuerySchema,
} from './utils/cursor-pagination';

export const getPlayerRankings = createController('/statistics/players', {
  summary: 'Get player rankings',
  requestParams: {
    query: cursorPaginationQuerySchema,
  },
  response: cursorPaginatedResponseSchema(playerRankingItemDtoSchema),
})(({ database, query }) => {
  const { cursor = null, pageSize = 20 } = query;

  const rows = database.selectObjects({
    sql: selectPlayerRankingsQuery,
    bind: {
      $last_player_id: cursor ? Number(cursor) : null,
      $limit: pageSize + 1,
    },
    schema: getPlayerRankingsRowSchema,
  });

  return createCursorPage({
    items: rows.map(mapPlayerRankingRowToDto),
    pageSize,
    getCursor: ({ id }) => String(id),
  });
});

export const getVillageRankings = createController('/statistics/villages', {
  summary: 'Get village rankings',
  requestParams: {
    query: cursorPaginationQuerySchema,
  },
  response: cursorPaginatedResponseSchema(villageRankingItemDtoSchema),
})(({ database, query }) => {
  const { cursor = null, pageSize = 20 } = query;

  const rows = database.selectObjects({
    sql: selectVillageRankingsQuery,
    bind: {
      $last_village_id: cursor ? Number(cursor) : null,
      $limit: pageSize + 1,
    },
    schema: getVillageRankingsRowSchema,
  });

  return createCursorPage({
    items: rows.map(mapVillageRankingRowToDto),
    pageSize,
    getCursor: ({ id }) => String(id),
  });
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
