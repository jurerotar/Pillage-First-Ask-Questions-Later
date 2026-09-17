import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import { apiEffectSchema } from '../../../utils/zod/effect-schemas';

// DB row shape — do not camelCase here; mapping happens in controller mappers
export const getPlayerRankingsRowSchema = z
  .strictObject({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    tribe: tribeSchema,
    faction: factionSchema,
    total_population: z.number(),
    village_count: z.number(),
  })
  .meta({ id: 'GetPlayerRankingsRow' });

export const getVillageRankingsRowSchema = z
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
  .meta({ id: 'GetVillageRankingsRow' });

export const playersStatsRowSchema = z.strictObject({
  tribe: tribeSchema,
  faction: factionSchema,
  player_count: z.number(),
});

export const villagesStatsRowSchema = z.strictObject({
  tribe: tribeSchema,
  faction: factionSchema,
  village_count: z.number(),
});

export const getServerOverviewStatisticsRowSchema = z
  .strictObject({
    player_count: z.number(),
    village_count: z.number(),
    players_by_tribe: z.record(tribeSchema, z.number()),
    players_by_faction: z.record(factionSchema, z.number()),
    villages_by_tribe: z.record(tribeSchema, z.number()),
    villages_by_faction: z.record(factionSchema, z.number()),
  })
  .meta({ id: 'GetServerOverviewStatisticsRow' });

export const statisticsComparisonVillageRowSchema = z
  .strictObject({
    village_id: z.number(),
    village_name: z.string(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    player_id: z.number(),
    player_name: z.string(),
    player_slug: z.string(),
    tribe: tribeSchema,
    faction: factionSchema,
  })
  .meta({ id: 'StatisticsComparisonVillageRow' });

export const statisticsComparisonEffectRowSchema = apiEffectSchema.meta({
  id: 'StatisticsComparisonEffectRow',
});

export const statisticsComparisonTroopRowSchema = z
  .strictObject({
    village_id: z.number(),
    player_id: z.number(),
    unit_id: unitIdSchema,
    amount: z.number(),
  })
  .meta({ id: 'StatisticsComparisonTroopRow' });

export const statisticsComparisonUnitImprovementRowSchema = z
  .strictObject({
    player_id: z.number(),
    unit_id: unitIdSchema,
    level: z.number(),
  })
  .meta({ id: 'StatisticsComparisonUnitImprovementRow' });
