import { z } from 'zod';
import {
  type CombatResult,
  type CombatTroop,
  type CombatTroopResult,
  combatTroopToTroop,
  type DefenceModifiers,
  resolveCombat,
} from '@pillage-first/game-assets/combat/combat-engine';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { unitsMap } from '@pillage-first/game-assets/units';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type {
  BattleParticipant,
  Loot,
} from '@pillage-first/types/models/battle';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Troop } from '@pillage-first/types/models/troop';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  selectBattleParticipantInfoByVillageQuery,
  selectUnitImprovementByTileQuery,
} from '../../../queries/battle-queries';
import { updateVillageWheatProductionByTroopsAndVillageIdEffectQuery } from '../../../queries/effect-queries';
import { selectStationedTroopsByTileQuery } from '../../../queries/player-queries';
import { selectTribeByTileQuery } from '../../../queries/report-queries';
import { selectVillageIdByTileIdQuery } from '../../../queries/village-queries';
import { createEvents } from '../../../utils/create-event';
import {
  type CreateNewBattleParticipant,
  type CreateNewBattleType,
  type CreateNewBattleUnit,
  type CreateNewReport,
  insertBattle,
  insertBattleParticipant,
  insertBattleUnits,
  insertReport,
} from '../../../utils/report';
import { removeTroops } from '../../../utils/troops';
import {
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
} from '../../../utils/village';
import { mapVillageTroop } from '../../controllers/mappers/player-mapper';
import { getStationedTroopsByTileSchema } from '../../controllers/schemas/player-schemas';
import type { ResolverResult } from '../resolver';

const improvementSchema = z.strictObject({
  unitId: unitIdSchema,
  level: z.int(),
});

type Improvement = z.infer<typeof improvementSchema>;

const calculateTroopStatistics = (troops: CombatTroopResult[]) => {
  let supplyBefore = 0;
  let supplyLost = 0;
  let resourcesLost = 0;
  for (const { unitId, amountBefore, amountLost } of troops) {
    const unit = unitsMap.get(unitId);
    if (unit) {
      supplyBefore += amountBefore * unit.unitWheatConsumption;
      supplyLost += amountLost * unit.unitWheatConsumption;

      let totalResourceCost = 0;
      for (const resourceCost of unit.baseRecruitmentCost) {
        totalResourceCost += resourceCost;
      }
      resourcesLost += totalResourceCost * amountLost;
    }
  }

  return {
    supplyBefore,
    supplyLost,
    resourcesLost,
  };
};

type PrepareBattleArgs = {
  database: DbFacade;
  resolvesAt: number;
  targetVillageId: Village['id'];
  originTileId: number;
  targetTileId: number;
  troops: Troop[];
};

type PrepareBattleResult = {
  attackerCombatTroops: CombatTroop[];
  defenderCombatTroops: CombatTroop[];
  modifiers: DefenceModifiers;
  defenderResources: Loot;

  originVillageName: string;
  originPlayerId: number;
  originPlayerName: string;
  originPlayerSlug: string;
  originCoordinates: Coordinates;

  targetVillageName: string;
  targetPlayerId: number;
  targetPlayerName: string;
  targetPlayerSlug: string;
  targetCoordinates: Coordinates;
};

const prepareBattle = ({
  database,
  resolvesAt,
  targetVillageId,
  originTileId,
  targetTileId,
  troops,
}: PrepareBattleArgs): PrepareBattleResult => {
  // ┌───────────────────────────┐
  // │ Basic village information │
  // └───────────────────────────┘

  const {
    village_name: originVillageName,
    player_id: originPlayerId,
    player_name: originPlayerName,
    player_slug: originPlayerSlug,
    x: originX,
    y: originY,
  } = database.selectObject({
    sql: selectBattleParticipantInfoByVillageQuery,
    bind: { $tile_id: originTileId },
    schema: z.strictObject({
      village_name: z.string(),
      player_id: z.int(),
      player_name: z.string(),
      player_slug: z.string(),
      x: z.int(),
      y: z.int(),
    }),
  })!;

  const {
    village_name: targetVillageName,
    player_id: targetPlayerId,
    player_name: targetPlayerName,
    player_slug: targetPlayerSlug,
    x: targetX,
    y: targetY,
  } = database.selectObject({
    sql: selectBattleParticipantInfoByVillageQuery,
    bind: { $tile_id: targetTileId },
    schema: z.strictObject({
      village_name: z.string(),
      player_id: z.int(),
      player_name: z.string(),
      player_slug: z.string(),
      x: z.int(),
      y: z.int(),
    }),
  })!;

  // ┌────────────────────────────────┐
  // │ Combat troops and smithy level │
  // └────────────────────────────────┘

  const participatingSources: Tile['id'][] = [];
  const mapTroopToCombatTroop = (troop: Troop): CombatTroop => {
    if (!participatingSources.includes(troop.source)) {
      participatingSources.push(troop.source);
    }

    return {
      troop: troop,
      unitId: troop.unitId,
      amount: troop.amount,
      smithyLevel: 0,
    };
  };

  const defenderTroops = database
    .selectObjects({
      sql: selectStationedTroopsByTileQuery,
      bind: { $tile_id: targetTileId },
      schema: getStationedTroopsByTileSchema,
    })
    .map(mapVillageTroop);

  const attackerCombatTroops = troops.map(mapTroopToCombatTroop);
  const defenderCombatTroops = defenderTroops.map(mapTroopToCombatTroop);

  const improvementsPerSourceMap: Map<Tile['id'], Improvement[]> = new Map();
  participatingSources.forEach((source) => {
    const improvementRows = database
      .selectObjects({
        sql: selectUnitImprovementByTileQuery,
        bind: { $tile_id: source },
        schema: z.strictObject({
          unit_id: unitIdSchema,
          level: z.int(),
        }),
      })
      .map(
        (row): Improvement => ({
          unitId: row.unit_id,
          level: row.level,
        }),
      );

    if (improvementRows.length !== 0) {
      improvementsPerSourceMap.set(source, improvementRows);
    }
  });

  const allTroops = attackerCombatTroops.concat(defenderCombatTroops);
  for (const t of allTroops) {
    const improvements = improvementsPerSourceMap.get(t.troop.source);
    if (improvements) {
      const unitImprovement = improvements.find((i) => i.unitId === t.unitId);
      if (unitImprovement) {
        t.smithyLevel = unitImprovement.level;
      }
    }
  }

  // ┌───────────────────┐
  // │ Defence modifiers │
  // └───────────────────┘

  // TODO: Retrieve correct values
  const modifiers: DefenceModifiers = {
    palaceLevel: 0,
    wallDurability: 10,
    wallLevel: 0,
    wallType: 'ROMAN_WALL',
  };

  // ┌────────────────────┐
  // │ Defender resources │
  // └────────────────────┘

  const calculatedDefenderResources = calculateVillageResourcesAt(
    database,
    targetVillageId,
    resolvesAt,
  );
  const defenderResources: [number, number, number, number] = [
    calculatedDefenderResources.currentWood,
    calculatedDefenderResources.currentClay,
    calculatedDefenderResources.currentIron,
    calculatedDefenderResources.currentWheat,
  ];

  return {
    attackerCombatTroops,
    defenderCombatTroops,
    modifiers,
    defenderResources,

    originVillageName,
    originPlayerId,
    originPlayerName,
    originPlayerSlug,
    originCoordinates: {
      x: originX,
      y: originY,
    },

    targetVillageName,
    targetPlayerId,
    targetPlayerName,
    targetPlayerSlug,
    targetCoordinates: {
      x: targetX,
      y: targetY,
    },
  };
};

type ApplyBattleResultArgs = {
  database: DbFacade;
  resolvesAt: number;
  isRaid: boolean;
  originVillageId: Village['id'];
  targetVillageId: Village['id'];
  originTileId: number;
  targetTileId: number;
  result: CombatResult;
};

const applyBattleResult = ({
  database,
  resolvesAt,
  isRaid,
  originVillageId,
  targetVillageId,
  originTileId,
  targetTileId,
  result,
}: ApplyBattleResultArgs) => {
  // ┌───────────────────────────┐
  // │ Remove loot from defender │
  // └───────────────────────────┘

  subtractVillageResourcesAt(
    database,
    targetVillageId,
    resolvesAt,
    result.loot,
  );

  // ┌─────────────────────────────────────────┐
  // │ Remove wheat consumption of lost troops │
  // └─────────────────────────────────────────┘

  const reduceWheatConsumptionOfDeceasedTroops = (
    troops: CombatTroop[],
    villageId: Village['id'],
  ) => {
    let wheatConsumptionReduction = 0;
    for (const { unitId, amount } of troops) {
      wheatConsumptionReduction +=
        getUnitDefinition(unitId).unitWheatConsumption * amount;
    }

    database.exec({
      sql: updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
      bind: {
        $village_id: villageId,
        $increase_amount: -wheatConsumptionReduction,
      },
    });
  };

  reduceWheatConsumptionOfDeceasedTroops(
    result.attackerLosses,
    originVillageId,
  );
  reduceWheatConsumptionOfDeceasedTroops(
    result.defenderLosses,
    targetVillageId,
  );

  // ┌─────────────────────────────────┐
  // │ Remove deceased defender troops │
  // └─────────────────────────────────┘

  const defenderDeceasedTroops: Troop[] =
    result.defenderLosses.map(combatTroopToTroop);
  removeTroops(database, defenderDeceasedTroops);

  // ┌──────────────────────────────────┐
  // │ Return surviving attacker troops │
  // └──────────────────────────────────┘

  if (result.attackerSurvivors.length > 0) {
    const returningTroops: Troop[] =
      result.attackerSurvivors.map(combatTroopToTroop);

    const originalMovementType = isRaid
      ? 'troopMovementRaid'
      : 'troopMovementAttack';

    createEvents<'troopMovementReturn'>(database, {
      villageId: originVillageId,
      troops: returningTroops,
      targetTileId: originTileId,
      originTileId: targetTileId,
      startsAt: resolvesAt,
      type: 'troopMovementReturn',
      originalMovementType,
      loot: result.loot,
    });
  }
};

type AddBattleReportArgs = {
  database: DbFacade;
  resolvesAt: number;
  isRaid: boolean;
  result: CombatResult;

  originVillageId: Village['id'];
  originTileId: number;
  originVillageName: string;
  originPlayerId: number;
  originPlayerName: string;
  originPlayerSlug: string;
  originCoordinates: Coordinates;

  targetVillageId: Village['id'];
  targetTileId: number;
  targetVillageName: string;
  targetPlayerName: string;
  targetPlayerSlug: string;
  targetCoordinates: Coordinates;
};

const addBattleReport = ({
  database,
  resolvesAt,
  isRaid,
  result,

  originVillageId,
  originTileId,
  originVillageName,
  originPlayerId,
  originPlayerName,
  originPlayerSlug,
  originCoordinates,

  targetVillageId,
  targetTileId,
  targetVillageName,
  targetPlayerName,
  targetPlayerSlug,
  targetCoordinates,
}: AddBattleReportArgs) => {
  // ┌─────────────────┐
  // │ Generate report │
  // └─────────────────┘

  const subjectType = isRaid ? 'raids' : 'attacks';
  const subject = `${originVillageName} ${subjectType} ${targetVillageName} (${targetCoordinates.x}|${targetCoordinates.y})`;

  const playerVillageId =
    originPlayerId === PLAYER_ID ? originVillageId : targetVillageId;

  const report: CreateNewReport = {
    playerId: PLAYER_ID,
    villageId: playerVillageId,
    timestamp: resolvesAt,
    subject,
    type: 'battle',
    isRead: false,
    isArchived: false,
  };

  const reportId = insertReport(database, report);

  // ┌─────────────────┐
  // │ Generate battle │
  // └─────────────────┘

  const attackStatistics = {
    points: result.attackerTotalPoints,
    ...calculateTroopStatistics(result.attackerTroops),
  };

  const defenceStatistics = {
    points: result.defenderTotalPoints,
    ...calculateTroopStatistics(result.defenderTroops),
  };

  const battle: CreateNewBattleType = {
    reportId,
    attackingPlayerName: originPlayerName,
    attackingPlayerSlug: originPlayerSlug,
    defendingPlayerName: targetPlayerName,
    defendingPlayerSlug: targetPlayerSlug,
    originVillageName,
    originVillageCoordinates: originCoordinates,
    targetVillageName,
    targetVillageCoordinates: targetCoordinates,
    loot: result.loot,
    totalCarryCapacity: result.totalCarryCapacity,
    didAttackerWin: result.attackerWins,
    attackStatistics,
    defenceStatistics,
  };

  insertBattle(database, battle);

  // ┌──────────────────────────────┐
  // │ Generate battle participants │
  // └──────────────────────────────┘

  const createDefendingParticipants = (
    defendingTroops: CombatTroopResult[],
  ): CreateNewBattleParticipant[] => {
    const participatingSources: Troop['source'][] = [targetTileId];

    for (const { troop } of defendingTroops) {
      if (!participatingSources.includes(troop.source)) {
        participatingSources.push(troop.source);
      }
    }

    const participants: CreateNewBattleParticipant[] = [];

    for (const source of participatingSources) {
      const tribeId = database.selectValue({
        sql: selectTribeByTileQuery,
        bind: { $tile_id: source },
        schema: z.int(),
      })!;

      const isReinforcement = source !== targetTileId;

      participants.push({
        reportId,
        role: 'defender',
        tribeId,
        isReinforcement,
        source,
      });
    }

    return participants;
  };

  const originTribeId = database.selectValue({
    sql: selectTribeByTileQuery,
    bind: { $tile_id: originTileId },
    schema: z.int(),
  })!;

  const attackerParticipant: CreateNewBattleParticipant = {
    reportId,
    role: 'attacker',
    tribeId: originTribeId,
    isReinforcement: false,
    source: originTileId,
  };

  const participants = [
    attackerParticipant,
    ...createDefendingParticipants(result.defenderTroops),
  ];

  const participantSourceToIdMap = new Map<
    Tile['id'],
    BattleParticipant['id']
  >();
  for (const participant of participants) {
    const participantId = insertBattleParticipant(database, participant);
    participantSourceToIdMap.set(participant.source, participantId);
  }

  // ┌───────────────────────┐
  // │ Generate battle units │
  // └───────────────────────┘

  const allTroops = result.attackerTroops.concat(result.defenderTroops);
  const units: CreateNewBattleUnit[] = allTroops.map(
    ({ troop, unitId, amountBefore, amountAfter }) => {
      const battleParticipantId = participantSourceToIdMap.get(troop.source)!;
      return {
        battleParticipantId,
        unitId,
        reportId,
        amountBefore,
        amountAfter,
      };
    },
  );

  insertBattleUnits(database, units);
};

type ResolveBattleArgs = {
  database: DbFacade;
  resolvesAt: number;
  originVillageId: Village['id'];
  originTileId: number;
  targetTileId: number;
  troops: Troop[];
  isRaid: boolean;
};

export const resolveBattle = ({
  database,
  resolvesAt,
  originVillageId,
  originTileId,
  targetTileId,
  troops,
  isRaid,
}: ResolveBattleArgs): ResolverResult => {
  const targetVillageId = database.selectValue({
    sql: selectVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId },
    schema: z.number(),
  });

  if (!targetVillageId) {
    // TODO: Handle destroyed city (targetVillageId == null)
    // Maybe add a custom report
    // TODO: send troops back home
    return { affectedVillageIds: [originVillageId] };
  }

  const {
    attackerCombatTroops,
    defenderCombatTroops,
    modifiers,
    defenderResources,

    originVillageName,
    originPlayerId,
    originPlayerName,
    originPlayerSlug,
    originCoordinates,

    targetVillageName,
    targetPlayerName,
    targetPlayerSlug,
    targetCoordinates,
  } = prepareBattle({
    database,
    resolvesAt,
    targetVillageId,
    originTileId,
    targetTileId,
    troops,
  });

  const result = resolveCombat(
    attackerCombatTroops,
    defenderCombatTroops,
    modifiers,
    defenderResources,
    isRaid,
  );

  // TODO: Handle hero
  // - supply buffs to units
  // - take damage equal to casualty rate
  // - get experience

  applyBattleResult({
    database,
    resolvesAt,
    isRaid,
    originVillageId,
    targetVillageId,
    originTileId,
    targetTileId,
    result,
  });

  addBattleReport({
    database,
    resolvesAt,
    isRaid,
    result,

    originVillageId,
    originTileId,
    originVillageName,
    originPlayerId,
    originPlayerName,
    originPlayerSlug,
    originCoordinates,

    targetVillageId,
    targetTileId,
    targetVillageName,
    targetPlayerName,
    targetPlayerSlug,
    targetCoordinates,
  });

  return { affectedVillageIds: [originVillageId, targetVillageId] };
};
