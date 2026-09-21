import type { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateSmithyImprovedUnitValue,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
import type { ApiEffectDto } from '@pillage-first/types/dtos/effect';
import {
  productionAndPowerStatisticsDtoSchema,
  serverOverviewStatisticsDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import type { Faction } from '@pillage-first/types/models/faction';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import {
  playersStatsRowSchema,
  statisticsComparisonEffectRowSchema,
  statisticsComparisonTroopRowSchema,
  statisticsComparisonUnitImprovementRowSchema,
  statisticsComparisonVillageRowSchema,
  villagesStatsRowSchema,
} from '../http/controllers/schemas/statistics-schemas';
import {
  selectPlayerStatsByTribeAndFactionQuery,
  selectStatisticsComparisonEffectsQuery,
  selectStatisticsComparisonTroopsQuery,
  selectStatisticsComparisonUnitImprovementsQuery,
  selectStatisticsComparisonVillagesQuery,
  selectVillageStatsByTribeAndFactionQuery,
} from '../queries/statistics-queries';

type ResourceProductionTotals = {
  wood: number;
  clay: number;
  iron: number;
  wheat: number;
  total: number;
};

type PowerTotals = {
  attackPower: number;
  infantryDefencePower: number;
  cavalryDefencePower: number;
  totalDefencePower: number;
};

type RankingFields = {
  woodProductionRank: number;
  clayProductionRank: number;
  ironProductionRank: number;
  wheatProductionRank: number;
  productionRank: number;
  attackPowerRank: number;
  infantryDefencePowerRank: number;
  cavalryDefencePowerRank: number;
  totalDefencePowerRank: number;
};

type AverageFields = {
  woodProductionAverage: number;
  clayProductionAverage: number;
  ironProductionAverage: number;
  wheatProductionAverage: number;
  productionAverage: number;
  attackPowerAverage: number;
  infantryDefencePowerAverage: number;
  cavalryDefencePowerAverage: number;
  totalDefencePowerAverage: number;
};

type VillageStatisticsComparison = z.infer<
  typeof statisticsComparisonVillageRowSchema
> & {
  production: ResourceProductionTotals;
} & PowerTotals;

type KingdomStatisticsComparison = {
  id: number;
  name: string;
  slug: string;
  tribe: Tribe;
  faction: Faction;
  villageCount: number;
  production: ResourceProductionTotals;
} & PowerTotals;

type StatisticsComparisonTotals = {
  production: ResourceProductionTotals;
} & PowerTotals;

const productionEffectIds = [
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
] satisfies ResourceProductionEffectId[];

const createTribeRecord = (): Record<Tribe, number> => ({
  gauls: 0,
  romans: 0,
  teutons: 0,
  egyptians: 0,
  huns: 0,
  spartans: 0,
  nature: 0,
  natars: 0,
});

const createFactionRecord = (): Record<Faction, number> => ({
  player: 0,
  npc1: 0,
  npc2: 0,
  npc3: 0,
  npc4: 0,
  npc5: 0,
  npc6: 0,
  npc7: 0,
  npc8: 0,
});

const emptyProductionTotals = (): ResourceProductionTotals => ({
  wood: 0,
  clay: 0,
  iron: 0,
  wheat: 0,
  total: 0,
});

const emptyPowerTotals = (): PowerTotals => ({
  attackPower: 0,
  infantryDefencePower: 0,
  cavalryDefencePower: 0,
  totalDefencePower: 0,
});

const addProductionTotals = (
  target: ResourceProductionTotals,
  source: ResourceProductionTotals,
) => {
  target.wood += source.wood;
  target.clay += source.clay;
  target.iron += source.iron;
  target.wheat += source.wheat;
  target.total += source.total;
};

const addPowerTotals = (target: PowerTotals, source: PowerTotals) => {
  target.attackPower += source.attackPower;
  target.infantryDefencePower += source.infantryDefencePower;
  target.cavalryDefencePower += source.cavalryDefencePower;
  target.totalDefencePower += source.totalDefencePower;
};

const calculateRank = <T>(
  items: T[],
  target: T,
  valueSelector: (item: T) => number,
  idSelector: (item: T) => number,
): number => {
  const targetValue = valueSelector(target);
  const targetId = idSelector(target);
  let rank = 1;

  for (const item of items) {
    const value = valueSelector(item);

    if (
      value > targetValue ||
      (value === targetValue && idSelector(item) < targetId)
    ) {
      rank += 1;
    }
  }

  return rank;
};

const getImprovementKey = (playerId: number, unitId: Unit['id']): string =>
  `${playerId}:${unitId}`;

const groupEffectsByScope = (effects: ApiEffectDto[]) => {
  const sharedEffects: ApiEffectDto[] = [];
  const localEffectsByTileId = new Map<number, ApiEffectDto[]>();

  for (const effect of effects) {
    if (effect.scope === 'global' || effect.scope === 'server') {
      sharedEffects.push(effect);
      continue;
    }

    if (effect.tileId === null || effect.tileId === undefined) {
      continue;
    }

    const effectsForTile = localEffectsByTileId.get(effect.tileId);

    if (effectsForTile) {
      effectsForTile.push(effect);
      continue;
    }

    localEffectsByTileId.set(effect.tileId, [effect]);
  }

  return { sharedEffects, localEffectsByTileId };
};

const getEffectsForTile = (
  sharedEffects: ApiEffectDto[],
  localEffectsByTileId: Map<number, ApiEffectDto[]>,
  tileId: number,
): ApiEffectDto[] => {
  const localEffects = localEffectsByTileId.get(tileId);

  if (!localEffects) {
    return sharedEffects;
  }

  return [...sharedEffects, ...localEffects];
};

const calculateVillageProduction = (
  effects: ApiEffectDto[],
  tileId: number,
): ResourceProductionTotals => {
  const totals = emptyProductionTotals();

  for (const effectId of productionEffectIds) {
    const production = Math.trunc(
      calculateComputedEffect(effectId, effects, tileId).total,
    );

    switch (effectId) {
      case 'woodProduction': {
        totals.wood = production;
        break;
      }
      case 'clayProduction': {
        totals.clay = production;
        break;
      }
      case 'ironProduction': {
        totals.iron = production;
        break;
      }
      case 'wheatProduction': {
        totals.wheat = production;
        break;
      }
    }

    totals.total += production;
  }

  return totals;
};

const calculateRankingFields = <T extends StatisticsComparisonTotals>(
  items: T[],
  target: T,
  idSelector: (item: T) => number,
): RankingFields => ({
  woodProductionRank: calculateRank(
    items,
    target,
    (item) => item.production.wood,
    idSelector,
  ),
  clayProductionRank: calculateRank(
    items,
    target,
    (item) => item.production.clay,
    idSelector,
  ),
  ironProductionRank: calculateRank(
    items,
    target,
    (item) => item.production.iron,
    idSelector,
  ),
  wheatProductionRank: calculateRank(
    items,
    target,
    (item) => item.production.wheat,
    idSelector,
  ),
  productionRank: calculateRank(
    items,
    target,
    (item) => item.production.total,
    idSelector,
  ),
  attackPowerRank: calculateRank(
    items,
    target,
    (item) => item.attackPower,
    idSelector,
  ),
  infantryDefencePowerRank: calculateRank(
    items,
    target,
    (item) => item.infantryDefencePower,
    idSelector,
  ),
  cavalryDefencePowerRank: calculateRank(
    items,
    target,
    (item) => item.cavalryDefencePower,
    idSelector,
  ),
  totalDefencePowerRank: calculateRank(
    items,
    target,
    (item) => item.totalDefencePower,
    idSelector,
  ),
});

const calculateAverage = <T>(
  items: T[],
  valueSelector: (item: T) => number,
): number => {
  if (items.length === 0) {
    return 0;
  }

  let total = 0;

  for (const item of items) {
    total += valueSelector(item);
  }

  return total / items.length;
};

const calculateAverageFields = (
  items: StatisticsComparisonTotals[],
): AverageFields => ({
  woodProductionAverage: calculateAverage(
    items,
    (item) => item.production.wood,
  ),
  clayProductionAverage: calculateAverage(
    items,
    (item) => item.production.clay,
  ),
  ironProductionAverage: calculateAverage(
    items,
    (item) => item.production.iron,
  ),
  wheatProductionAverage: calculateAverage(
    items,
    (item) => item.production.wheat,
  ),
  productionAverage: calculateAverage(items, (item) => item.production.total),
  attackPowerAverage: calculateAverage(items, (item) => item.attackPower),
  infantryDefencePowerAverage: calculateAverage(
    items,
    (item) => item.infantryDefencePower,
  ),
  cavalryDefencePowerAverage: calculateAverage(
    items,
    (item) => item.cavalryDefencePower,
  ),
  totalDefencePowerAverage: calculateAverage(
    items,
    (item) => item.totalDefencePower,
  ),
});

const truncatePowerTotals = <T extends PowerTotals>(item: T): T => {
  item.attackPower = Math.trunc(item.attackPower);
  item.infantryDefencePower = Math.trunc(item.infantryDefencePower);
  item.cavalryDefencePower = Math.trunc(item.cavalryDefencePower);
  item.totalDefencePower = Math.trunc(item.totalDefencePower);

  return item;
};

const mapKingdomStatisticsComparisonItem = (
  kingdom: KingdomStatisticsComparison,
  rankingFields: RankingFields,
  averageFields: AverageFields,
) => ({
  id: kingdom.id,
  name: kingdom.name,
  slug: kingdom.slug,
  tribe: kingdom.tribe,
  faction: kingdom.faction,
  villageCount: kingdom.villageCount,
  production: kingdom.production,
  attackPower: kingdom.attackPower,
  infantryDefencePower: kingdom.infantryDefencePower,
  cavalryDefencePower: kingdom.cavalryDefencePower,
  totalDefencePower: kingdom.totalDefencePower,
  ...rankingFields,
  ...averageFields,
});

const mapVillageStatisticsComparisonItem = (
  village: VillageStatisticsComparison,
  rankingFields: RankingFields,
  averageFields: AverageFields,
) => ({
  id: village.village_id,
  name: village.village_name,
  coordinates: {
    x: village.coordinates_x,
    y: village.coordinates_y,
  },
  playerId: village.player_id,
  playerName: village.player_name,
  playerSlug: village.player_slug,
  production: village.production,
  attackPower: village.attackPower,
  infantryDefencePower: village.infantryDefencePower,
  cavalryDefencePower: village.cavalryDefencePower,
  totalDefencePower: village.totalDefencePower,
  ...rankingFields,
  ...averageFields,
});

export const calculateProductionAndPowerStatistics = (
  database: DbFacade,
  currentVillageId: number,
) => {
  const villages = database.selectObjects({
    sql: selectStatisticsComparisonVillagesQuery,
    schema: statisticsComparisonVillageRowSchema,
  });

  const effects = database.selectObjects({
    sql: selectStatisticsComparisonEffectsQuery,
    schema: statisticsComparisonEffectRowSchema,
  });

  const troops = database.selectObjects({
    sql: selectStatisticsComparisonTroopsQuery,
    schema: statisticsComparisonTroopRowSchema,
  });

  const unitImprovements = database.selectObjects({
    sql: selectStatisticsComparisonUnitImprovementsQuery,
    schema: statisticsComparisonUnitImprovementRowSchema,
  });

  const { sharedEffects, localEffectsByTileId } = groupEffectsByScope(effects);
  const improvementLevels = new Map<string, number>();

  for (const improvement of unitImprovements) {
    improvementLevels.set(
      getImprovementKey(improvement.player_id, improvement.unit_id),
      improvement.level,
    );
  }

  const villageComparisonItems = new Map<number, VillageStatisticsComparison>();
  const kingdomComparisonItems = new Map<number, KingdomStatisticsComparison>();

  for (const village of villages) {
    const production = calculateVillageProduction(
      getEffectsForTile(sharedEffects, localEffectsByTileId, village.tile_id),
      village.tile_id,
    );
    const power = emptyPowerTotals();

    villageComparisonItems.set(village.village_id, {
      ...village,
      production,
      ...power,
    });

    const kingdom = kingdomComparisonItems.get(village.player_id);

    if (kingdom) {
      kingdom.villageCount += 1;
      addProductionTotals(kingdom.production, production);
      continue;
    }

    kingdomComparisonItems.set(village.player_id, {
      id: village.player_id,
      name: village.player_name,
      slug: village.player_slug,
      tribe: village.tribe,
      faction: village.faction,
      villageCount: 1,
      production: { ...production },
      ...emptyPowerTotals(),
    });
  }

  for (const troop of troops) {
    const unit = getUnitDefinition(troop.unit_id);
    const improvementLevel =
      improvementLevels.get(
        getImprovementKey(troop.player_id, troop.unit_id),
      ) ?? 0;

    const troopPower: PowerTotals = {
      attackPower:
        calculateSmithyImprovedUnitValue({
          baseValue: unit.attack,
          level: improvementLevel,
          upkeep: unit.unitWheatConsumption,
        }) * troop.amount,
      infantryDefencePower:
        calculateSmithyImprovedUnitValue({
          baseValue: unit.infantryDefence,
          level: improvementLevel,
          upkeep: unit.unitWheatConsumption,
        }) * troop.amount,
      cavalryDefencePower:
        calculateSmithyImprovedUnitValue({
          baseValue: unit.cavalryDefence,
          level: improvementLevel,
          upkeep: unit.unitWheatConsumption,
        }) * troop.amount,
      totalDefencePower: 0,
    };

    troopPower.totalDefencePower =
      troopPower.infantryDefencePower + troopPower.cavalryDefencePower;

    const village = villageComparisonItems.get(troop.village_id);
    const kingdom = kingdomComparisonItems.get(troop.player_id);

    if (village) {
      addPowerTotals(village, troopPower);
    }

    if (kingdom) {
      addPowerTotals(kingdom, troopPower);
    }
  }

  const kingdomItems = [...kingdomComparisonItems.values()].map(
    truncatePowerTotals,
  );
  const villageItems = [...villageComparisonItems.values()].map(
    truncatePowerTotals,
  );

  const currentKingdom = kingdomItems.find(({ id }) => id === PLAYER_ID);
  const currentVillage = villageItems.find(
    ({ village_id }) => village_id === currentVillageId,
  );

  if (!currentKingdom || !currentVillage) {
    throw new Error('Current production and power statistics are unavailable');
  }

  return productionAndPowerStatisticsDtoSchema.parse({
    kingdom: mapKingdomStatisticsComparisonItem(
      currentKingdom,
      calculateRankingFields(kingdomItems, currentKingdom, ({ id }) => id),
      calculateAverageFields(kingdomItems),
    ),
    village: mapVillageStatisticsComparisonItem(
      currentVillage,
      calculateRankingFields(
        villageItems,
        currentVillage,
        ({ village_id }) => village_id,
      ),
      calculateAverageFields(villageItems),
    ),
    kingdomCount: kingdomItems.length,
    villageCount: villageItems.length,
  });
};

export const calculateServerOverviewStatistics = (database: DbFacade) => {
  const playersStats = database.selectObjects({
    sql: selectPlayerStatsByTribeAndFactionQuery,
    schema: playersStatsRowSchema,
  });

  const villagesStats = database.selectObjects({
    sql: selectVillageStatsByTribeAndFactionQuery,
    schema: villagesStatsRowSchema,
  });

  let totalPlayers = 0;
  const playersByTribe = createTribeRecord();
  const playersByFaction = createFactionRecord();

  for (const row of playersStats) {
    totalPlayers += row.player_count;
    playersByTribe[row.tribe] += row.player_count;
    playersByFaction[row.faction] += row.player_count;
  }

  let totalVillages = 0;
  const villagesByTribe = createTribeRecord();
  const villagesByFaction = createFactionRecord();

  for (const row of villagesStats) {
    totalVillages += row.village_count;
    villagesByTribe[row.tribe] += row.village_count;
    villagesByFaction[row.faction] += row.village_count;
  }

  return serverOverviewStatisticsDtoSchema.parse({
    playerCount: totalPlayers,
    villageCount: totalVillages,
    playersByTribe,
    playersByFaction,
    villagesByTribe,
    villagesByFaction,
  });
};
