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
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import type { CombatResultId } from '@pillage-first/types/models/report';
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
  adjustLoyalty,
  createLoyaltyIncreaseEvent,
  getLoyalty,
} from '../../../utils/loyalty';
import { abandonOccupiedOasis } from '../../../utils/oasis';
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

const battleOriginSchema = z.strictObject({
  tileId: z.int(),
  playerId: z.int(),
  playerName: z.string(),
  playerSlug: z.string(),
  villageId: z.int(),
  villageName: z.string(),
  coordinates: coordinatesSchema,
});

const baseBattleTargetSchema = z.strictObject({
  tileId: z.int(),
  playerId: z.int().optional(),
  playerName: z.string(),
  coordinates: coordinatesSchema,
});

const battleTargetSchema = z.discriminatedUnion('type', [
  baseBattleTargetSchema.extend({
    type: z.literal('village'),
    villageId: z.int(),
    villageName: z.string(),
    playerSlug: z.string(),
  }),
  baseBattleTargetSchema.extend({
    type: z.literal('oasis'),
    oasisId: z.int(),
    oasisName: z.string(),
    villageId: z.int().optional(),
    villageName: z.string().optional(),
    playerSlug: z.string().optional(),
  }),
]);

type BattleOrigin = z.infer<typeof battleOriginSchema>;
type BattleTarget = z.infer<typeof battleTargetSchema>;

const improvementSchema = z.strictObject({
  unitId: unitIdSchema,
  level: z.int(),
});

type Improvement = z.infer<typeof improvementSchema>;

type PrepareBattleArgs = {
  database: DbFacade;
  resolvesAt: number;
  originVillageId: Village['id'];
  originTileId: number;
  targetVillageId?: Village['id'];
  targetOasisId?: OasisTile['id'];
  targetTileId: number;
  troops: Troop[];
};

type PrepareBattleResult = {
  attackerCombatTroops: CombatTroop[];
  defenderCombatTroops: CombatTroop[];
  modifiers: DefenceModifiers;
  defenderResources: ResourceBundle;

  origin: BattleOrigin;
  target: BattleTarget;
};

const getCombatResultId = (
  prefix: 'ATTACKER' | 'DEFENDER',
  survivors: CombatTroop[],
  losses: CombatTroop[],
): CombatResultId => {
  let lossesCount = 0;
  for (const { amount } of losses) {
    lossesCount += amount;
  }

  if (lossesCount === 0) {
    return `${prefix}_NO_LOSS` as CombatResultId;
  }

  let survivorCount = 0;
  for (const { amount } of survivors) {
    survivorCount += amount;
  }

  if (survivorCount === 0) {
    return `${prefix}_FULL_LOSS` as CombatResultId;
  }

  return `${prefix}_SOME_LOSS` as CombatResultId;
};

const prepareBattle = ({
  database,
  resolvesAt,
  originVillageId,
  originTileId,
  targetVillageId,
  targetOasisId,
  targetTileId,
  troops,
}: PrepareBattleArgs): PrepareBattleResult => {
  // ┌───────────────────────────┐
  // │ Target (village or oasis) │
  // └───────────────────────────┘

  var target!: BattleTarget;
  if (targetVillageId != null) {
    target = {
      type: 'village',
      tileId: targetTileId,
      villageId: targetVillageId,
      villageName: '',
      playerName: '',
      playerSlug: '',
      coordinates: { x: 0, y: 0 },
    };
  } else if (targetOasisId != null) {
    target = {
      type: 'oasis',
      tileId: targetTileId,
      oasisId: targetOasisId,
      oasisName: '',
      playerName: '',
      coordinates: { x: 0, y: 0 },
    };
  } else {
    throw new Error(
      'Either targetVillageId or targetOasisId must be non-null.',
    );
  }

  if (target.type === 'village') {
    const { village_name, player_id, player_name, player_slug, x, y } =
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

    target.villageName = village_name;
    target.playerId = player_id;
    target.playerName = player_name;
    target.playerSlug = player_slug;
    target.coordinates.x = x;
    target.coordinates.y = y;
  } else {
    const {
      player_id,
      player_name,
      player_slug,
      village_id,
      village_name,
      x,
      y,
    } = database.selectObject({
      sql: selectBattleParticipantInfoByOasisQuery,
      bind: { $oasis_id: targetOasisId },
      schema: z.strictObject({
        player_id: z.int().nullable(),
        player_name: z.string().nullable(),
        player_slug: z.string().nullable(),
        village_id: z.int().nullable(),
        village_name: z.string().nullable(),
        x: z.int(),
        y: z.int(),
      }),
    })!;

    target.oasisName =
      village_id != null ? 'Occupied oasis' : 'Unoccupied oasis';
    target.playerId = player_id ?? undefined;
    target.playerName = player_name ?? 'Nature';
    target.playerSlug = player_slug ?? undefined;
    target.villageId = village_id ?? undefined;
    target.villageName = village_name ?? undefined;
    target.coordinates.x = x;
    target.coordinates.y = y;
  }

  // ┌──────────────────┐
  // │ Origin (village) │
  // └──────────────────┘

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

  var origin: BattleOrigin = {
    tileId: originTileId,
    playerId: originPlayerId,
    playerName: originPlayerName,
    playerSlug: originPlayerSlug,
    villageId: originVillageId,
    villageName: originVillageName,
    coordinates: { x: originX, y: originY },
  };

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

  if (target.type === 'village') {
    const calculatedDefenderResources = calculateVillageResourcesAt(
      database,
      target.villageId,
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

    origin,
    target,
  };
};

type ApplyBattleResultArgs = {
  database: DbFacade;
  resolvesAt: number;
  isRaid: boolean;
  origin: BattleOrigin;
  target: BattleTarget;
  result: CombatResult;
};

const applyBattleResult = ({
  database,
  resolvesAt,
  isRaid,
  origin,
  target,
  result,
}: ApplyBattleResultArgs) => {
  // ┌───────────────────────────┐
  // │ Remove loot from defender │
  // └───────────────────────────┘

  if (target.type === 'village') {
    subtractVillageResourcesAt(
      database,
      target.villageId,
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
    origin.villageId,
  );

  // TODO FIX: wheat consumption didn't fall when I lost units in my oasis
  if (target.type === 'village') {
    reduceWheatConsumptionOfDeceasedTroops(
      result.defenderLosses,
      target.villageId,
    );
  } else {
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

  // ┌────────────────┐
  // │ Reduce loyalty │
  // └────────────────┘

  if (
    target.type === 'oasis' &&
    !isRaid &&
    result.attackerWins &&
    target.villageId != null
  ) {
    // Loyalty reduction is based on number of oasis belonging to target village
    // 1 oasis: 3 attacks (34%)
    // 2 oases: 2 attacks (50%)
    // 3 oases: 1 attack (100%)

    const numberOfOases = database.selectValue({
      sql: 'SELECT COUNT(DISTINCT tile_id) FROM oasis WHERE village_id = $village_id',
      bind: {
        $village_id: target.villageId,
      },
      schema: z.int(),
    })!;

    const loyaltyReduction =
      numberOfOases === 3 ? 100 : numberOfOases === 2 ? 50 : 34;

    adjustLoyalty(database, target.tileId, -loyaltyReduction);
    createLoyaltyIncreaseEvent(database, resolvesAt);

    const newLoyalty = getLoyalty(database, target.tileId);

    if (newLoyalty != null && newLoyalty <= 0) {
      abandonOccupiedOasis(database, target.villageId, target.tileId);
    }
  }

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
      villageId: origin.villageId,
      troops: returningTroops,
      targetTileId: origin.tileId,
      originTileId: target.tileId,
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

  origin: BattleOrigin;
  target: BattleTarget;
};

const addBattleReport = ({
  database,
  resolvesAt,
  isRaid,
  result,

  playerVillageId,

  origin,
  target,
}: AddBattleReportArgs) => {
  // ┌─────────────────┐
  // │ Generate report │
  // └─────────────────┘

  const subjectType = isRaid ? 'raids' : 'attacks';
  const targetName =
    target.type === 'village' ? target.villageName : target.oasisName;
  const subject = `${origin.villageName} ${subjectType} ${targetName} (${target.coordinates.x}|${target.coordinates.y})`;

  const combatResultId =
    origin.villageId === playerVillageId
      ? getCombatResultId(
          'ATTACKER',
          result.attackerSurvivors,
          result.attackerLosses,
        )
      : getCombatResultId(
          'DEFENDER',
          result.defenderSurvivors,
          result.defenderLosses,
        );

  const report: CreateNewReport = {
    playerId: PLAYER_ID,
    villageId: playerVillageId,
    timestamp: resolvesAt,
    subject,
    type: 'battle',
    combatResultId,
    tags: [],
  };

  const reportId = insertReport(database, report);

  // ┌─────────────────┐
  // │ Generate battle │
  // └─────────────────┘

  const battle: CreateNewBattleType = {
    reportId,
    attackingVillageId: origin.villageId,
    defendingVillageId:
      target.type === 'village' ? target.villageId : undefined,
    defendingOasisId: target.type === 'oasis' ? target.oasisId : undefined,
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
    const participatingSources: Troop['source'][] = [target.tileId];

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

      const isReinforcement = source !== target.tileId;

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
    bind: { $tile_id: origin.tileId },
    schema: z.int(),
  })!;

  const attackerParticipant: CreateNewBattleParticipant = {
    reportId,
    role: 'attacker',
    tribeId: originTribeId,
    isReinforcement: false,
    source: origin.tileId,
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

    origin,
    target,
  } = prepareBattle({
    database,
    resolvesAt,
    originVillageId,
    originTileId,
    targetVillageId,
    targetOasisId,
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
    origin,
    target,
    result,
  });

  const playerVillageId =
    origin.playerId === PLAYER_ID
      ? originVillageId
      : target.playerId === PLAYER_ID
        ? target.villageId
        : null;

  if (playerVillageId != null) {
    addBattleReport({
      database,
      resolvesAt,
      isRaid,
      result,

      playerVillageId,

      origin,
      target,
    });
  }

  return {
    affectedVillageIds: [
      originVillageId,
      ...(target.villageId != null ? [target.villageId] : []),
    ],
  };
};
