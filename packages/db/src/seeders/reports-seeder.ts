import { type PRNGFunction, prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type {
  BattleResultId,
  ReportOutcome,
  ReportTag,
  ReportType,
} from '@pillage-first/types/models/report';
import type { Server } from '@pillage-first/types/models/server';
import { type Tribe, tribeSchema } from '@pillage-first/types/models/tribe';
import { type UnitId, unitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';

const REPORT_COUNT = 100;
const NON_BATTLE_REPORT_COUNT = 10;

type VillageRow = {
  id: number;
  tileId: number;
  playerId: number;
  tribe: Tribe;
};

type TargetRow = {
  tileId: number;
  playerId: number | null;
  tribe: Tribe;
};

type LossMode = 'none' | 'some' | 'full';

const unitIdsByTribe = {
  romans: ['LEGIONNAIRE', 'IMPERIAN', 'EQUITES_IMPERATORIS'],
  gauls: ['PHALANX', 'SWORDSMAN', 'THEUTATES_THUNDER'],
  teutons: ['CLUBSWINGER', 'AXEMAN', 'PALADIN'],
  huns: ['MERCENARY', 'BOWMAN', 'STEPPE_RIDER'],
  egyptians: ['SLAVE_MILITIA', 'ASH_WARDEN', 'KHOPESH_WARRIOR'],
  spartans: ['HOPLITE', 'SHIELDSMAN', 'TWINSTEEL_THERION'],
  natars: ['PIKEMAN', 'THORNED_WARRIOR', 'GUARDSMAN'],
  nature: ['RAT', 'SPIDER', 'WILD_BOAR'],
} as const satisfies Record<Tribe, readonly UnitId[]>;

const battleResultsByPlayerRole = {
  attacker: ['attackerNoLoss', 'attackerSomeLoss', 'attackerFullLoss'],
  defender: ['defenderNoLoss', 'defenderSomeLoss', 'defenderFullLoss'],
} as const satisfies Record<string, readonly BattleResultId[]>;

const resultToLossMode = (battleResult: BattleResultId): LossMode => {
  if (battleResult.endsWith('NoLoss')) {
    return 'none';
  }

  if (battleResult.endsWith('FullLoss')) {
    return 'full';
  }

  return 'some';
};

const opponentLossMode = (lossMode: LossMode): LossMode => {
  if (lossMode === 'none') {
    return 'full';
  }

  if (lossMode === 'full') {
    return 'none';
  }

  return 'some';
};

const selectUnitIds = (
  prng: PRNGFunction,
  tribe: Tribe,
  count: number,
): UnitId[] => {
  const candidates = [...unitIdsByTribe[tribe]];
  const units: UnitId[] = [];

  while (units.length < count && candidates.length > 0) {
    const index = seededRandomIntFromInterval(prng, 0, candidates.length - 1);
    units.push(candidates[index]);
    candidates.splice(index, 1);
  }

  return units;
};

const createBattleUnitRows = (
  prng: PRNGFunction,
  unitLookupIds: Map<UnitId, number>,
  participantId: number,
  tribe: Tribe,
  lossMode: LossMode,
): [number, number, number, number][] => {
  const units = selectUnitIds(
    prng,
    tribe,
    seededRandomIntFromInterval(prng, 2, 3),
  );

  return units.map((unitId) => {
    const amountBefore = seededRandomIntFromInterval(prng, 8, 140);
    let amountAfter = amountBefore;

    if (lossMode === 'full') {
      amountAfter = 0;
    } else if (lossMode === 'some') {
      amountAfter = seededRandomIntFromInterval(
        prng,
        Math.max(1, Math.floor(amountBefore * 0.25)),
        Math.max(1, amountBefore - 1),
      );
    }

    return [
      participantId,
      unitLookupIds.get(unitId)!,
      amountBefore,
      amountAfter,
    ];
  });
};

const selectLookupId = (
  database: DbFacade,
  table: string,
  column: string,
  value: string,
): number => {
  return database.selectValue({
    sql: `SELECT id FROM ${table} WHERE ${column} = $value;`,
    bind: { $value: value },
    schema: z.number(),
  })!;
};

const selectBattleTarget = (
  prng: PRNGFunction,
  reportIndex: number,
  playerVillage: VillageRow,
  npcVillages: VillageRow[],
  targetableOasis: TargetRow[],
  isPlayerAttacker: boolean,
): TargetRow => {
  if (!isPlayerAttacker) {
    return {
      tileId: playerVillage.tileId,
      playerId: playerVillage.playerId,
      tribe: playerVillage.tribe,
    };
  }

  if (reportIndex % 3 === 0) {
    return seededRandomArrayElement(prng, targetableOasis);
  }

  return seededRandomArrayElement(prng, npcVillages);
};

// TODO: Delete before this feature goes out!!!
export const reportsSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(`${server.seed}:reports`);

  const reportTypeIds = new Map<ReportType, number>(
    (['battle', 'adventure', 'trade', 'movement'] as const).map((type) => [
      type,
      selectLookupId(database, 'report_type_ids', 'report_type', type),
    ]),
  );
  const tagIds = new Map<ReportTag, number>([
    ['read', selectLookupId(database, 'report_tag_ids', 'tag', 'read')],
    ['archived', selectLookupId(database, 'report_tag_ids', 'tag', 'archived')],
  ]);

  const reportOutcomeIds = new Map<ReportOutcome, number>();
  for (const battleResult of [
    ...battleResultsByPlayerRole.attacker,
    ...battleResultsByPlayerRole.defender,
  ]) {
    reportOutcomeIds.set(
      battleResult,
      selectLookupId(
        database,
        'report_outcome_ids',
        'report_outcome',
        battleResult,
      ),
    );
  }
  for (const outcome of [
    'heroAdventure',
    'troopMovement',
    'incomingMerchantsArrived',
  ] as const) {
    reportOutcomeIds.set(
      outcome,
      selectLookupId(database, 'report_outcome_ids', 'report_outcome', outcome),
    );
  }

  const unitRows = database.selectObjects({
    sql: 'SELECT id, unit FROM unit_ids;',
    schema: z.strictObject({
      id: z.number(),
      unit: unitIdSchema,
    }),
  });
  const unitLookupIds = new Map<UnitId, number>(
    unitRows.map(({ id, unit }) => [unit, id]),
  );

  const villages = database
    .selectObjects({
      sql: `
        SELECT
          v.id,
          v.tile_id,
          v.player_id,
          ti.tribe
        FROM
          villages v
          JOIN players p ON v.player_id = p.id
          JOIN tribe_ids ti ON p.tribe_id = ti.id
        ORDER BY
          v.id;
      `,
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
        player_id: z.number(),
        tribe: tribeSchema,
      }),
    })
    .map(
      (v): VillageRow => ({
        id: v.id,
        tileId: v.tile_id,
        playerId: v.player_id,
        tribe: v.tribe,
      }),
    );

  const playerVillage = villages.find((v) => v.playerId === PLAYER_ID);
  const npcVillages = villages.filter((v) => v.playerId !== PLAYER_ID);

  const oasisTargets = database
    .selectObjects({
      sql: `
        SELECT
          o.tile_id,
          v.player_id,
          COALESCE(ti.tribe, 'nature') AS tribe
        FROM
          oasis o
          LEFT JOIN villages v ON o.village_id = v.id
          LEFT JOIN players p ON v.player_id = p.id
          LEFT JOIN tribe_ids ti ON p.tribe_id = ti.id
        GROUP BY
          o.tile_id,
          v.player_id,
          ti.tribe
        ORDER BY
          o.tile_id;
      `,
      schema: z.strictObject({
        tile_id: z.number(),
        player_id: z.number().nullable(),
        tribe: tribeSchema,
      }),
    })
    .map(
      (o): TargetRow => ({
        tileId: o.tile_id,
        playerId: o.player_id,
        tribe: o.tribe,
      }),
    );

  const targetableOasis = oasisTargets.filter((o) => o.playerId !== PLAYER_ID);

  if (
    !playerVillage ||
    npcVillages.length === 0 ||
    targetableOasis.length === 0
  ) {
    throw new Error(
      'Reports seeder requires a player village, NPC villages, and oasis targets.',
    );
  }

  const reportTagRows: [number, number][] = [];
  const battleUnitRows: [number, number, number, number][] = [];

  for (let i = 0; i < REPORT_COUNT; i += 1) {
    const isPlayerAttacker = i % 2 === 0;
    const playerBattleResults = isPlayerAttacker
      ? battleResultsByPlayerRole.attacker
      : battleResultsByPlayerRole.defender;
    const battleResult = playerBattleResults[i % playerBattleResults.length];

    const playerLossMode = resultToLossMode(battleResult);
    const opponentMode = opponentLossMode(playerLossMode);
    const attackerLossMode = isPlayerAttacker ? playerLossMode : opponentMode;
    const defenderLossMode = isPlayerAttacker ? opponentMode : playerLossMode;
    const attackerWon =
      defenderLossMode === 'full' || attackerLossMode === 'none';

    const origin = isPlayerAttacker
      ? playerVillage
      : seededRandomArrayElement(prng, npcVillages);

    const target = selectBattleTarget(
      prng,
      i,
      playerVillage,
      npcVillages,
      targetableOasis,
      isPlayerAttacker,
    );

    const reportId = database.selectValue({
      sql: `
        INSERT INTO reports (
          player_id,
          village_id,
          timestamp,
          type_id,
          report_outcome_id
        )
        VALUES (
          $player_id,
          $village_id,
          $timestamp,
          $type_id,
          $report_outcome_id
        )
        RETURNING id;
      `,
      bind: {
        $player_id: PLAYER_ID,
        $village_id: playerVillage.id,
        $timestamp: server.createdAt + (i + 1) * 15 * 60 * 1000,
        $type_id: reportTypeIds.get('battle')!,
        $report_outcome_id: reportOutcomeIds.get(battleResult)!,
      },
      schema: z.number(),
    })!;

    const loot = attackerWon
      ? [
          seededRandomIntFromInterval(prng, 0, 1600),
          seededRandomIntFromInterval(prng, 0, 1600),
          seededRandomIntFromInterval(prng, 0, 1600),
          seededRandomIntFromInterval(prng, 0, 1600),
        ]
      : [0, 0, 0, 0];

    const battleId = database.selectValue({
      sql: `
        INSERT INTO battles (
          report_id,
          origin_tile_id,
          target_tile_id,
          is_raid,
          loot_wood,
          loot_clay,
          loot_iron,
          loot_wheat,
          can_attacker_see_full_report,
          attacker_points,
          defender_points
        )
        VALUES (
          $report_id,
          $origin_tile_id,
          $target_tile_id,
          $is_raid,
          $loot_wood,
          $loot_clay,
          $loot_iron,
          $loot_wheat,
          $can_attacker_see_full_report,
          $attacker_points,
          $defender_points
        )
        RETURNING id;
      `,
      bind: {
        $report_id: reportId,
        $origin_tile_id: origin.tileId,
        $target_tile_id: target.tileId,
        $is_raid: i % 4 === 0 ? 1 : 0,
        $loot_wood: loot[0],
        $loot_clay: loot[1],
        $loot_iron: loot[2],
        $loot_wheat: loot[3],
        $can_attacker_see_full_report:
          !isPlayerAttacker || attackerLossMode !== 'full' ? 1 : 0,
        $attacker_points: attackerWon
          ? seededRandomIntFromInterval(prng, 120, 260)
          : seededRandomIntFromInterval(prng, 30, 120),
        $defender_points: attackerWon
          ? seededRandomIntFromInterval(prng, 30, 120)
          : seededRandomIntFromInterval(prng, 120, 260),
      },
      schema: z.number(),
    })!;

    const attackerParticipantId = database.selectValue({
      sql: `
        INSERT INTO battle_participants (battle_id, player_id, tile_id)
        VALUES ($battle_id, $player_id, $tile_id)
        RETURNING id;
      `,
      bind: {
        $battle_id: battleId,
        $player_id: origin.playerId,
        $tile_id: origin.tileId,
      },
      schema: z.number(),
    })!;

    const defenderParticipantId = database.selectValue({
      sql: `
        INSERT INTO battle_participants (battle_id, player_id, tile_id)
        VALUES ($battle_id, $player_id, $tile_id)
        RETURNING id;
      `,
      bind: {
        $battle_id: battleId,
        $player_id: target.playerId,
        $tile_id: target.tileId,
      },
      schema: z.number(),
    })!;

    battleUnitRows.push(
      ...createBattleUnitRows(
        prng,
        unitLookupIds,
        attackerParticipantId,
        origin.tribe,
        attackerLossMode,
      ),
      ...createBattleUnitRows(
        prng,
        unitLookupIds,
        defenderParticipantId,
        target.tribe,
        defenderLossMode,
      ),
    );

    // Seed a predictable selection of battles with a separate defending force.
    // A reinforcement is identified by its source tile being different from both
    // the attacking and defending tiles, just like a participant in a real battle.
    if (i % 5 === 0) {
      const reinforcementCandidates = npcVillages.filter(
        (v) => v.tileId !== origin.tileId && v.tileId !== target.tileId,
      );
      const reinforcementVillage =
        reinforcementCandidates.length > 0
          ? seededRandomArrayElement(prng, reinforcementCandidates)
          : undefined;

      if (reinforcementVillage) {
        const reinforcementParticipantId = database.selectValue({
          sql: `
            INSERT INTO battle_participants (battle_id, player_id, tile_id)
            VALUES ($battle_id, $player_id, $tile_id)
            RETURNING id;
          `,
          bind: {
            $battle_id: battleId,
            $player_id: reinforcementVillage.playerId,
            $tile_id: reinforcementVillage.tileId,
          },
          schema: z.number(),
        })!;

        battleUnitRows.push(
          ...createBattleUnitRows(
            prng,
            unitLookupIds,
            reinforcementParticipantId,
            reinforcementVillage.tribe,
            defenderLossMode,
          ),
        );
      }
    }

    if (i % 2 === 0) {
      reportTagRows.push([reportId, tagIds.get('read')!]);
    }

    if (i % 10 === 0) {
      reportTagRows.push([reportId, tagIds.get('archived')!]);
    }
  }

  const insertBaseReport = (
    index: number,
    type: ReportType,
    outcome: ReportOutcome,
  ) =>
    database.selectValue({
      sql: `
        INSERT INTO reports (
          player_id, village_id, timestamp, type_id, report_outcome_id
        ) VALUES (
          $player_id, $village_id, $timestamp, $type_id, $report_outcome_id
        ) RETURNING id;
      `,
      bind: {
        $player_id: PLAYER_ID,
        $village_id: playerVillage.id,
        $timestamp: server.createdAt + (index + 1) * 3 * 15 * 60 * 1000,
        $type_id: reportTypeIds.get(type)!,
        $report_outcome_id: reportOutcomeIds.get(outcome)!,
      },
      schema: z.number(),
    })!;

  const movementUnitId = unitLookupIds.get(
    unitIdsByTribe[playerVillage.tribe][0],
  )!;

  for (let i = 0; i < NON_BATTLE_REPORT_COUNT; i += 1) {
    const adventureReportId = insertBaseReport(
      i * 3,
      'adventure',
      'heroAdventure',
    );
    database.exec({
      sql: `
        INSERT INTO hero_adventure_reports (
          report_id, adventure_id, item_id, health_before, health_after
        ) VALUES (
          $report_id, $adventure_id, $item_id, $health_before, $health_after
        );
      `,
      bind: {
        $report_id: adventureReportId,
        $adventure_id: i + 1,
        $item_id: i % 2 === 0 ? null : 1,
        $health_before: 100,
        $health_after: seededRandomIntFromInterval(prng, 70, 95),
      },
    });

    const movementReportId = insertBaseReport(
      i * 3 + 1,
      'movement',
      'troopMovement',
    );
    const movementId = database.selectValue({
      sql: `
        INSERT INTO movement_reports (
          report_id, origin_tile_id, target_tile_id, movement_type
        ) VALUES (
          $report_id, $origin_tile_id, $target_tile_id, $movement_type
        ) RETURNING id;
      `,
      bind: {
        $report_id: movementReportId,
        $origin_tile_id: playerVillage.tileId,
        $target_tile_id: npcVillages[i % npcVillages.length].tileId,
        $movement_type: i % 2 === 0 ? 'reinforcement' : 'relocation',
      },
      schema: z.number(),
    })!;
    database.exec({
      sql: `
        INSERT INTO movement_report_units (movement_report_id, unit_id, amount)
        VALUES ($movement_report_id, $unit_id, $amount);
      `,
      bind: {
        $movement_report_id: movementId,
        $unit_id: movementUnitId,
        $amount: seededRandomIntFromInterval(prng, 10, 100),
      },
    });

    const tradeReportId = insertBaseReport(
      i * 3 + 2,
      'trade',
      'incomingMerchantsArrived',
    );
    database.exec({
      sql: `
        INSERT INTO trading_reports (
          report_id, origin_tile_id, target_tile_id, wood, clay, iron, wheat
        ) VALUES (
          $report_id, $origin_tile_id, $target_tile_id,
          $wood, $clay, $iron, $wheat
        );
      `,
      bind: {
        $report_id: tradeReportId,
        $origin_tile_id: npcVillages[i % npcVillages.length].tileId,
        $target_tile_id: playerVillage.tileId,
        $wood: seededRandomIntFromInterval(prng, 100, 1000),
        $clay: seededRandomIntFromInterval(prng, 100, 1000),
        $iron: seededRandomIntFromInterval(prng, 100, 1000),
        $wheat: seededRandomIntFromInterval(prng, 100, 1000),
      },
    });
  }

  batchInsert(
    database,
    'battle_units',
    ['battle_participant_id', 'unit_id', 'amount_before', 'amount_after'],
    battleUnitRows,
  );
  batchInsert(
    database,
    'report_tags',
    ['report_id', 'report_tag_id'],
    reportTagRows,
  );
};
