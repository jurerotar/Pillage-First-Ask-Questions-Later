import { z } from 'zod';
import {
  playerRankingItemDtoSchema,
  productionAndPowerStatisticsDtoSchema,
  serverOverviewStatisticsDtoSchema,
  villageRankingItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import {
  selectPlayerRankingsQuery,
  selectVillageRankingsQuery,
} from '../../queries/statistics-queries';
import {
  calculateProductionAndPowerStatistics,
  calculateServerOverviewStatistics,
} from '../../utils/statistics';
import { createController } from '../controller';
import {
  mapPlayerRankingRowToDto,
  mapVillageRankingRowToDto,
} from './mappers/statistics-mapper';
import {
  getPlayerRankingsRowSchema,
  getVillageRankingsRowSchema,
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

export const getProductionAndPowerStatistics = createController(
  '/statistics/production-and-power',
  {
    summary: 'Get production and power comparison statistics',
    requestParams: {
      query: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: productionAndPowerStatisticsDtoSchema,
  },
)(({ database, query }) => {
  return calculateProductionAndPowerStatistics(database, query.villageId);
});

export const getGameWorldOverview = createController('/statistics/overview', {
  summary: 'Get game world overview statistics',
  response: serverOverviewStatisticsDtoSchema,
})(({ database }) => {
  return calculateServerOverviewStatistics(database);
});
