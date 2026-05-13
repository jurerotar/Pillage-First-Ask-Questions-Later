import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { factionSchema } from '../models/faction';
import { tribeSchema } from '../models/tribe';

export const playerRankingItemDtoSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    tribe: tribeSchema,
    faction: factionSchema,
    totalPopulation: z.number(),
    villageCount: z.number(),
  })
  .meta({ id: 'PlayerRankingItemDto' });

export const villageRankingItemDtoSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    coordinates: coordinatesSchema,
    population: z.number(),
    playerId: z.number(),
    playerName: z.string(),
    playerSlug: z.string(),
  })
  .meta({ id: 'VillageRankingItemDto' });

export const serverOverviewStatisticsDtoSchema = z
  .strictObject({
    playerCount: z.number(),
    villageCount: z.number(),
    playersByTribe: z.record(tribeSchema, z.number()),
    playersByFaction: z.record(factionSchema, z.number()),
    villagesByTribe: z.record(tribeSchema, z.number()),
    villagesByFaction: z.record(factionSchema, z.number()),
  })
  .meta({ id: 'ServerOverviewStatisticsDto' });
