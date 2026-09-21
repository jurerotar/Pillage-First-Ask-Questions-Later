import { z } from 'zod';
import { coordinatesSchema } from '../models/coordinates';
import { factionSchema } from '../models/faction';
import { tribeSchema } from '../models/tribe';

export const resourceProductionTotalsDtoSchema = z
  .strictObject({
    wood: z.number(),
    clay: z.number(),
    iron: z.number(),
    wheat: z.number(),
    total: z.number(),
  })
  .meta({ id: 'ResourceProductionTotalsDto' });

const statisticsComparisonPowerSchema = {
  attackPower: z.number(),
  infantryDefencePower: z.number(),
  cavalryDefencePower: z.number(),
  totalDefencePower: z.number(),
  woodProductionRank: z.number(),
  clayProductionRank: z.number(),
  ironProductionRank: z.number(),
  wheatProductionRank: z.number(),
  productionRank: z.number(),
  attackPowerRank: z.number(),
  infantryDefencePowerRank: z.number(),
  cavalryDefencePowerRank: z.number(),
  totalDefencePowerRank: z.number(),
  woodProductionAverage: z.number(),
  clayProductionAverage: z.number(),
  ironProductionAverage: z.number(),
  wheatProductionAverage: z.number(),
  productionAverage: z.number(),
  attackPowerAverage: z.number(),
  infantryDefencePowerAverage: z.number(),
  cavalryDefencePowerAverage: z.number(),
  totalDefencePowerAverage: z.number(),
};

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

export const kingdomStatisticsComparisonItemDtoSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    tribe: tribeSchema,
    faction: factionSchema,
    villageCount: z.number(),
    production: resourceProductionTotalsDtoSchema,
    ...statisticsComparisonPowerSchema,
  })
  .meta({ id: 'KingdomStatisticsComparisonItemDto' });

export const villageStatisticsComparisonItemDtoSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    coordinates: coordinatesSchema,
    playerId: z.number(),
    playerName: z.string(),
    playerSlug: z.string(),
    production: resourceProductionTotalsDtoSchema,
    ...statisticsComparisonPowerSchema,
  })
  .meta({ id: 'VillageStatisticsComparisonItemDto' });

export const productionAndPowerStatisticsDtoSchema = z
  .strictObject({
    kingdom: kingdomStatisticsComparisonItemDtoSchema,
    village: villageStatisticsComparisonItemDtoSchema,
    kingdomCount: z.number(),
    villageCount: z.number(),
  })
  .meta({ id: 'ProductionAndPowerStatisticsDto' });

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
