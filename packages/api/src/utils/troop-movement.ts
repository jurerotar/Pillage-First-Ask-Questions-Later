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
import { type UnitId, unitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  selectBattleReportParticipantsByTargetTileIdQuery,
  selectResourceSiteResourcesByTileIdQuery,
  selectTargetVillageIdByTileIdQuery,
  updateResourceSiteResourcesByTileIdQuery,
} from '../queries/troop-movement-queries';
import { type CreateNewBattleReport, insertBattleReport } from './report';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from './village';

type BattleReportParticipant = CreateNewBattleReport['attacker'];
type BattleReportUnit = CreateNewBattleReport['attacker']['units'][number];
type BattleReportParticipantRole = 'attacker' | 'defender' | 'reinforcement';

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

const getBattleReportParticipants = (
  database: DbFacade,
  villageId: number,
  originTileId: number,
  targetTileId: number,
) => {
  const rows = database.selectObjects({
    sql: selectBattleReportParticipantsByTargetTileIdQuery,
    bind: {
      $village_id: villageId,
      $origin_tile_id: originTileId,
      $target_tile_id: targetTileId,
    },
    schema: z.strictObject({
      role: z.enum(['attacker', 'defender', 'reinforcement']),
      tile_id: z.number(),
      player_id: z.number().nullable(),
      unit_id: unitIdSchema.nullable(),
      amount: z.number().nullable(),
    }),
  });

  const participantsByRoleAndTileId = new Map<
    `${BattleReportParticipantRole}:${number}`,
    BattleReportParticipant
  >();

  for (const row of rows) {
    const key = `${row.role}:${row.tile_id}` as const;
    let participant = participantsByRoleAndTileId.get(key);

    if (!participant) {
      participant = {
        tileId: row.tile_id,
        playerId: row.player_id,
        units: [],
      };

      participantsByRoleAndTileId.set(key, participant);
    }

    if (row.unit_id !== null && row.amount !== null) {
      participant.units.push({
        unitId: row.unit_id,
        amountBefore: row.amount,
        amountAfter: row.amount,
      });
    }
  }

  const reinforcements: BattleReportParticipant[] = [];

  for (const [key, reinforcement] of participantsByRoleAndTileId) {
    if (key.startsWith('reinforcement:')) {
      reinforcements.push(reinforcement);
    }
  }

  return {
    attacker: participantsByRoleAndTileId.get(`attacker:${originTileId}`)!,
    defender: participantsByRoleAndTileId.get(`defender:${targetTileId}`)!,
    reinforcements,
  };
};

const insertNoCombatBattleReport = (
  database: DbFacade,
  args: GameEvent<'troopMovementAttack'> | GameEvent<'troopMovementRaid'>,
  loot: ResourceBundle,
) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;
  const { attacker, defender, reinforcements } = getBattleReportParticipants(
    database,
    villageId,
    originTileId,
    targetTileId,
  );

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
      ...attacker,
      units: mapTroopsToBattleReportUnits(troops),
    },
    defender,
    reinforcements,
  });
};

export const resolveNoCombatOffensiveMovement = (
  database: DbFacade,
  args: GameEvent<'troopMovementAttack'> | GameEvent<'troopMovementRaid'>,
): ResourceBundle => {
  const { resolvesAt, targetTileId, troops } = args;

  const loot = stealResourcesFromTarget(
    database,
    targetTileId,
    resolvesAt,
    calculateTotalCarryCapacity(troops),
  );

  insertNoCombatBattleReport(database, args, loot);

  return loot;
};
