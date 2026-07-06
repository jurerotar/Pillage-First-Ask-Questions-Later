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
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { BattleParticipant } from '@pillage-first/types/models/battle';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type { OasisTile, Tile } from '@pillage-first/types/models/tile';
import type { Troop } from '@pillage-first/types/models/troop';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  selectBattleParticipantInfoByOasisQuery,
  selectBattleParticipantInfoByVillageQuery,
  selectUnitImprovementByTileQuery,
} from '../../../queries/battle-queries';
import { updateVillageWheatProductionByTroopsAndVillageIdEffectQuery } from '../../../queries/effect-queries';
import { selectOasisIdByTileIdQuery } from '../../../queries/oasis-queries';
import { selectStationedTroopsByTileQuery } from '../../../queries/player-queries';
import {
  selectNatureTribeIdQuery,
  selectTribeByTileQuery,
} from '../../../queries/report-queries';
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

type PrepareBattleArgs = {
  database: DbFacade;
  resolvesAt: number;
  targetVillageId?: Village['id'];
  targetOasisId?: OasisTile['id'];
  originTileId: number;
  targetTileId: number;
  troops: Troop[];
};

type PrepareBattleResult = {
  attackerCombatTroops: CombatTroop[];
  defenderCombatTroops: CombatTroop[];
  modifiers: DefenceModifiers;
  defenderResources: ResourceBundle;

  originVillageName: string;
  originPlayerId: number;
  originPlayerName: string;
  originPlayerSlug: string;
  originCoordinates: Coordinates;

  targetName: string;
  targetPlayerName: string;
  targetPlayerSlug?: string;
  targetCoordinates: Coordinates;
};

const prepareBattle = ({
  database,
  resolvesAt,
  targetVillageId,
  targetOasisId,
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

  var targetName = '';
  var targetPlayerName = 'Nature';
  var targetPlayerSlug: string | undefined;
  var targetX = 0;
  var targetY = 0;

  if (targetVillageId != null) {
    const { village_name, player_name, player_slug, x, y } =
      database.selectObject({
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
    targetName = village_name;
    targetPlayerName = player_name;
    targetPlayerSlug = player_slug;
    targetX = x;
    targetY = y;
  } else {
    const { player_name, player_slug, x, y } = database.selectObject({
      sql: selectBattleParticipantInfoByOasisQuery,
      bind: { $oasis_id: targetOasisId },
      schema: z.strictObject({
        player_name: z.string().nullable(),
        player_slug: z.string().nullable(),
        x: z.int(),
        y: z.int(),
      }),
    })!;
    targetName = player_slug != null ? 'Occupied oasis' : 'Unoccupied oasis';
    targetPlayerName = player_name ?? 'Nature';
    targetPlayerSlug = player_slug ?? undefined;
    targetX = x;
    targetY = y;
  }

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

  // TODO: Reintroduce hero
  const attackerCombatTroops = troops
    .map(mapTroopToCombatTroop)
    .filter((t) => t.unitId !== 'HERO');
  const defenderCombatTroops = defenderTroops
    .map(mapTroopToCombatTroop)
    .filter((t) => t.unitId !== 'HERO');

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

  var defenderResources: [number, number, number, number];

  if (targetVillageId != null) {
    const calculatedDefenderResources = calculateVillageResourcesAt(
      database,
      targetVillageId,
      resolvesAt,
    );
    defenderResources = [
      calculatedDefenderResources.currentWood,
      calculatedDefenderResources.currentClay,
      calculatedDefenderResources.currentIron,
      calculatedDefenderResources.currentWheat,
    ];
  } else {
    // TODO Handle oasis loot
    defenderResources = [0, 0, 0, 0];
  }

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

    targetName,
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
  targetVillageId?: Village['id'];
  targetOasisId?: OasisTile['id'];
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
  targetOasisId,
  originTileId,
  targetTileId,
  result,
}: ApplyBattleResultArgs) => {
  // ┌───────────────────────────┐
  // │ Remove loot from defender │
  // └───────────────────────────┘

  if (targetVillageId != null) {
    subtractVillageResourcesAt(
      database,
      targetVillageId,
      resolvesAt,
      result.loot,
    );
  }
  // TODO: Subtract resouces from oasis

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

  if (targetVillageId != null) {
    reduceWheatConsumptionOfDeceasedTroops(
      result.defenderLosses,
      targetVillageId,
    );
  } else if (targetOasisId != null) {
    const deceasedSourceMap = new Map<Tile['id'], CombatTroop[]>();
    for (const troop of result.defenderLosses) {
      const source = troop.troop.source;
      let troops = deceasedSourceMap.get(source);
      if (!troops) {
        troops = [];
        deceasedSourceMap.set(source, troops);
      }
      troops.push(troop);
    }

    for (const [source, troops] of deceasedSourceMap) {
      reduceWheatConsumptionOfDeceasedTroops(troops, source);
    }
  }

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

  playerVillageId: Village['id'];

  originVillageId: Village['id'];
  originTileId: number;
  originVillageName: string;
  originPlayerId: number;
  originPlayerName: string;
  originPlayerSlug: string;
  originCoordinates: Coordinates;

  targetVillageId?: Village['id'];
  targetOasisId?: OasisTile['id'];
  targetTileId: number;
  targetName: string;
  targetPlayerName: string;
  targetPlayerSlug?: string;
  targetCoordinates: Coordinates;
};

const addBattleReport = ({
  database,
  resolvesAt,
  isRaid,
  result,

  playerVillageId,

  originVillageId,
  originTileId,
  originVillageName,

  targetVillageId,
  targetOasisId,
  targetTileId,
  targetName,
  targetCoordinates,
}: AddBattleReportArgs) => {
  // ┌─────────────────┐
  // │ Generate report │
  // └─────────────────┘

  const subjectType = isRaid ? 'raids' : 'attacks';
  const subject = `${originVillageName} ${subjectType} ${targetName} (${targetCoordinates.x}|${targetCoordinates.y})`;

  const report: CreateNewReport = {
    playerId: PLAYER_ID,
    villageId: playerVillageId,
    timestamp: resolvesAt,
    subject,
    type: 'battle',
    tags: [],
  };

  const reportId = insertReport(database, report);

  // ┌─────────────────┐
  // │ Generate battle │
  // └─────────────────┘

  const battle: CreateNewBattleType = {
    reportId,
    attackingVillageId: originVillageId,
    defendingVillageId: targetVillageId,
    defendingOasisId: targetOasisId,
    loot: result.loot,
    canAttackerSeeFullReport: result.canAttackerSeeFullReport,
    attackStatisticPoints: result.attackerTotalPoints,
    defenceStatisticPoints: result.defenderTotalPoints,
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
      let tribeId = database.selectValue({
        sql: selectTribeByTileQuery,
        bind: { $tile_id: source },
        schema: z.int(),
      });
      if (tribeId == null) {
        tribeId = database.selectValue({
          sql: selectNatureTribeIdQuery,
          schema: z.int(),
        })!;
      }

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
  const targetOasisId = database.selectValue({
    sql: selectOasisIdByTileIdQuery,
    bind: { $tile_id: targetTileId },
    schema: z.number(),
  });

  if (!targetVillageId && !targetOasisId) {
    const originalMovementType = isRaid
      ? 'troopMovementRaid'
      : 'troopMovementAttack';

    createEvents<'troopMovementReturn'>(database, {
      villageId: originVillageId,
      troops: troops,
      targetTileId: originTileId,
      originTileId: targetTileId,
      startsAt: resolvesAt,
      type: 'troopMovementReturn',
      originalMovementType,
      loot: [0, 0, 0, 0],
    });

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

    targetName,
    targetPlayerName,
    targetPlayerSlug,
    targetCoordinates,
  } = prepareBattle({
    database,
    resolvesAt,
    targetVillageId,
    targetOasisId,
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
    targetOasisId,
    originTileId,
    targetTileId,
    result,
  });

  // TODO: Revisit method of determining player involvement
  const playerVillageId =
    originPlayerId === PLAYER_ID
      ? originVillageId
      : (targetVillageId ?? targetOasisId);

  if (playerVillageId != null) {
    addBattleReport({
      database,
      resolvesAt,
      isRaid,
      result,

      playerVillageId,

      originVillageId,
      originTileId,
      originVillageName,
      originPlayerId,
      originPlayerName,
      originPlayerSlug,
      originCoordinates,

      targetVillageId,
      targetOasisId,
      targetTileId,
      targetName,
      targetPlayerName,
      targetPlayerSlug,
      targetCoordinates,
    });
  }

  return {
    affectedVillageIds: [
      originVillageId,
      ...(targetVillageId != null ? [targetVillageId] : []),
    ],
  };
};
