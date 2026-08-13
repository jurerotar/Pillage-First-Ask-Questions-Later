import { z } from 'zod';
import {
  calculateTotalCarryCapacity,
  distributeLoot,
} from '@pillage-first/game-assets/utils/troops';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  type ResourceBundle,
  resourcesSchema,
} from '@pillage-first/types/models/resource';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  selectDefenderReinforcementsByTargetTileIdQuery,
  selectHomeDefenderUnitsByTargetTileIdQuery,
  selectResourceSiteResourcesByTileIdQuery,
  selectTargetOwnerPlayerIdByTileIdQuery,
  selectTargetVillageIdByTileIdQuery,
  updateResourceSiteResourcesByTileIdQuery,
} from '../queries/troop-movement-queries';
import { selectPlayerIdByVillageIdQuery } from '../queries/village-queries';
import { insertBattleReport } from './report';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from './village';

type BattleReportParticipant = NonNullable<
  Parameters<typeof insertBattleReport>[1]['reinforcements']
>[number];
type BattleReportUnit = Parameters<
  typeof insertBattleReport
>[1]['attacker']['units'][number];

const emptyLoot = (): ResourceBundle => {
  return [0, 0, 0, 0];
};

const mapTroopsToBattleReportUnits = (
  troops: (
    | GameEvent<'troopMovementAttack'>
    | GameEvent<'troopMovementRaid'>
  )['troops'],
): BattleReportUnit[] => {
  const amountByUnitId = new Map<UnitId, number>();

  for (const troop of troops) {
    amountByUnitId.set(
      troop.unitId,
      (amountByUnitId.get(troop.unitId) ?? 0) + troop.amount,
    );
  }

  return [...amountByUnitId.entries()].map(([unitId, amount]) => ({
    unitId,
    amountBefore: amount,
    amountAfter: amount,
  }));
};

const stealResourcesFromTarget = (
  database: DbFacade,
  targetTileId: number,
  timestamp: number,
  carryCapacity: number,
): ResourceBundle => {
  if (carryCapacity <= 0) {
    return emptyLoot();
  }

  const targetVillageId = database.selectValue({
    sql: selectTargetVillageIdByTileIdQuery,
    bind: { $target_tile_id: targetTileId },
    schema: z.number().nullable(),
  });

  if (typeof targetVillageId === 'number') {
    const { currentWood, currentClay, currentIron, currentWheat } =
      calculateVillageResourcesAt(database, targetVillageId, timestamp);
    const loot = distributeLoot(
      [currentWood, currentClay, currentIron, currentWheat],
      carryCapacity,
    );

    subtractVillageResourcesAt(database, targetVillageId, timestamp, loot);

    return loot;
  }

  const resourceSite = database.selectObject({
    sql: selectResourceSiteResourcesByTileIdQuery,
    bind: { $target_tile_id: targetTileId },
    schema: resourcesSchema,
  })!;

  const loot = distributeLoot(
    [
      resourceSite.wood,
      resourceSite.clay,
      resourceSite.iron,
      resourceSite.wheat,
    ],
    carryCapacity,
  );

  database.exec({
    sql: updateResourceSiteResourcesByTileIdQuery,
    bind: {
      $target_tile_id: targetTileId,
      $wood: loot[0],
      $clay: loot[1],
      $iron: loot[2],
      $wheat: loot[3],
      $updated_at: timestamp,
    },
  });

  return loot;
};

const getTargetOwnerPlayerId = (
  database: DbFacade,
  targetTileId: number,
): number | null => {
  return (
    database.selectValue({
      sql: selectTargetOwnerPlayerIdByTileIdQuery,
      bind: { $target_tile_id: targetTileId },
      schema: z.number().nullable(),
    }) ?? null
  );
};

const getHomeDefenderUnits = (database: DbFacade, targetTileId: number) => {
  return database
    .selectObjects({
      sql: selectHomeDefenderUnitsByTargetTileIdQuery,
      bind: { $target_tile_id: targetTileId },
      schema: z.strictObject({
        unit_id: z.string(),
        amount: z.number(),
      }),
    })
    .map(({ unit_id, amount }) => ({
      unitId: unit_id as UnitId,
      amountBefore: amount,
      amountAfter: amount,
    }));
};

const getDefenderReinforcements = (
  database: DbFacade,
  targetTileId: number,
) => {
  const rows = database.selectObjects({
    sql: selectDefenderReinforcementsByTargetTileIdQuery,
    bind: { $target_tile_id: targetTileId },
    schema: z.strictObject({
      source_tile_id: z.number(),
      player_id: z.number().nullable(),
      unit_id: z.string(),
      amount: z.number(),
    }),
  });

  const reinforcementsByTileId = new Map<number, BattleReportParticipant>();

  for (const row of rows) {
    let reinforcement = reinforcementsByTileId.get(row.source_tile_id);

    if (!reinforcement) {
      reinforcement = {
        tileId: row.source_tile_id,
        playerId: row.player_id,
        units: [],
      };

      reinforcementsByTileId.set(row.source_tile_id, reinforcement);
    }

    reinforcement.units.push({
      unitId: row.unit_id as UnitId,
      amountBefore: row.amount,
      amountAfter: row.amount,
    });
  }

  return [...reinforcementsByTileId.values()];
};

export const resolveNoCombatOffensiveMovement = (
  database: DbFacade,
  args: GameEvent<'troopMovementAttack'> | GameEvent<'troopMovementRaid'>,
): ResourceBundle => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  const loot = stealResourcesFromTarget(
    database,
    targetTileId,
    resolvesAt,
    calculateTotalCarryCapacity(troops),
  );

  const attackerPlayerId = database.selectValue({
    sql: selectPlayerIdByVillageIdQuery,
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;

  insertBattleReport(database, {
    villageId,
    timestamp: resolvesAt,
    outcome: 'attackerNoLoss',
    originTileId,
    targetTileId,
    isRaid: args.type === 'troopMovementRaid',
    loot,
    canAttackerSeeFullReport: true,
    attackerPoints: 0,
    defenderPoints: 0,
    attacker: {
      playerId: attackerPlayerId,
      tileId: originTileId,
      units: mapTroopsToBattleReportUnits(troops),
    },
    defender: {
      playerId: getTargetOwnerPlayerId(database, targetTileId),
      tileId: targetTileId,
      units: getHomeDefenderUnits(database, targetTileId),
    },
    reinforcements: getDefenderReinforcements(database, targetTileId),
  });

  return loot;
};
