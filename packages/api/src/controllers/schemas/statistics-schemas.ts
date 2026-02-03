import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';

export const getPlayerRankingsSchema = z
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

export const getVillageRankingsSchema = z
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

export const playersStatsRowSchema = z.object({
  tribe: tribeSchema,
  faction: factionSchema,
  player_count: z.number(),
});

export const villagesStatsRowSchema = z.object({
  tribe: tribeSchema,
  faction: factionSchema,
  village_count: z.number(),
});

export const getServerOverviewStatisticsSchema = z
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
