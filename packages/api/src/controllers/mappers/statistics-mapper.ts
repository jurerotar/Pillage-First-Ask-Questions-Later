import type { z } from 'zod';
import {
  playerRankingItemDtoSchema,
  serverOverviewStatisticsDtoSchema,
  villageRankingItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import type {
  getPlayerRankingsRowSchema,
  getServerOverviewStatisticsRowSchema,
  getVillageRankingsRowSchema,
} from '../schemas/statistics-schemas';

export const mapPlayerRankingRowToDto = (
  row: z.infer<typeof getPlayerRankingsRowSchema>,
) =>
  playerRankingItemDtoSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    tribe: row.tribe,
    faction: row.faction,
    totalPopulation: row.total_population,
    villageCount: row.village_count,
  });

export const mapVillageRankingRowToDto = (
  row: z.infer<typeof getVillageRankingsRowSchema>,
) =>
  villageRankingItemDtoSchema.parse({
    id: row.village_id,
    name: row.village_name,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    population: row.population,
    playerId: row.player_id,
    playerName: row.player_name,
    playerSlug: row.player_slug,
  });

export const mapServerOverviewRowToDto = (
  row: z.infer<typeof getServerOverviewStatisticsRowSchema>,
) =>
  serverOverviewStatisticsDtoSchema.parse({
    playerCount: row.player_count,
    villageCount: row.village_count,
    playersByTribe: row.players_by_tribe,
    playersByFaction: row.players_by_faction,
    villagesByTribe: row.villages_by_tribe,
    villagesByFaction: row.villages_by_faction,
  });
