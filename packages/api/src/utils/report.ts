import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { unitsMap } from '@pillage-first/game-assets/units';
import type {
  BattleParticipant,
  BattleType,
  BattleUnit,
} from '@pillage-first/types/models/battle';
import type {
  BaseReport,
  GameReport,
} from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  mapBattle,
  mapBattleParticipants,
  mapBattleUnits,
} from '../http/controllers/mappers/battle-mapper';
import {
  getBattleByReportRowSchema,
  getBattleOasisInformationRowSchema,
  getBattleParticipantsByReportRowSchema,
  getBattlePlayerInformationRowSchema,
  getBattleUnitsByReportRowSchema,
} from '../http/controllers/schemas/battle-schemas';
import {
  selectBattleByReportQuery,
  selectBattleParticipantsByReportQuery,
  selectBattleUnitsByReportQuery,
} from '../queries/battle-queries';
import {
  selectBattleOasisInformationQuery,
  selectBattlePlayerInformationQuery,
} from '../queries/report-queries';

export type CreateNewReport = Omit<
  GameReport,
  'id' | 'battle' | 'battleSummary'
>;

export type CreateNewBattleType = Omit<
  BattleType,
  | 'id'
  | 'attackingPlayerName'
  | 'attackingPlayerSlug'
  | 'defendingPlayerName'
  | 'defendingPlayerSlug'
  | 'originName'
  | 'originCoordinates'
  | 'targetName'
  | 'targetCoordinates'
  | 'totalCarryCapacity'
  | 'didAttackerWin'
  | 'attackStatistics'
  | 'defenceStatistics'
  | 'participants'
> & {
  reportId: BaseReport['id'];
  attackStatisticPoints: number;
  defenceStatisticPoints: number;
};

export type CreateNewBattleParticipant = Omit<
  BattleParticipant,
  'id' | 'units' | 'role' | 'tribe' | 'isReinforcement'
> & { battleId: BattleType['id'] };

export type CreateNewBattleUnit = BattleUnit;

export const insertReport = (
  database: DbFacade,
  report: CreateNewReport,
): number => {
  const reportId = database.selectValue({
    sql: `
      INSERT INTO
        reports (player_id, village_id, timestamp, type_id, combat_result_id)
      VALUES
        (
          $player_id,
          $village_id,
          $timestamp,
          (
            SELECT
              id
            FROM
              report_type_ids
            WHERE
              report_type = $type
          ),
          (
            SELECT
              id
            FROM
              combat_result_ids
            WHERE
              combat_result = $combat_result_id
          )
        )
      RETURNING id;
`,
    bind: {
      $player_id: report.playerId,
      $village_id: report.villageId,
      $timestamp: report.timestamp,
      $type: report.type,
      $combat_result_id: report.combatResultId,
    },
    schema: z.int(),
  })!;

  if (report.tags.length === 0) {
    return reportId;
  }

  var valueRows = [];
  for (let i = 0; i < report.tags.length; i += 1) {
    const tag = report.tags[i];
    const frontComma = i === 0 ? '' : ',';
    valueRows.push(
      `${frontComma}(${reportId}, (SELECT id FROM report_tag_ids WHERE tag = '${tag}'))`,
    );
  }

  database.exec({
    sql: `
      INSERT INTO
        report_tags (report_id, report_tag_id)
      VALUES
        ${valueRows}`,
  });

  return reportId;
};

export const insertBattle = (
  database: DbFacade,
  battle: CreateNewBattleType,
): number => {
  return database.selectValue({
    sql: `
      INSERT INTO
        battles (
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
      VALUES
        (
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
      $report_id: battle.reportId,
      $origin_tile_id: battle.originTileId,
      $target_tile_id: battle.targetTileId,
      $is_raid: battle.isRaid,
      $loot_wood: battle.loot[0],
      $loot_clay: battle.loot[1],
      $loot_iron: battle.loot[2],
      $loot_wheat: battle.loot[3],
      $can_attacker_see_full_report: battle.canAttackerSeeFullReport,
      $attacker_points: battle.attackStatisticPoints,
      $defender_points: battle.defenceStatisticPoints,
    },
    schema: z.int(),
  })!;
};

export const insertBattleParticipant = (
  database: DbFacade,
  participant: CreateNewBattleParticipant,
): number => {
  return database.selectValue({
    sql: `
      INSERT INTO
        battle_participants (battle_id, player_id, tile_id)
      VALUES
        (
          $battle_id,
          $player_id,
          $tile_id
        )
      RETURNING id;
`,
    bind: {
      $battle_id: participant.battleId,
      $player_id: participant.playerId,
      $tile_id: participant.tileId,
    },
    schema: z.int(),
  })!;
};

export const insertBattleUnits = (
  database: DbFacade,
  units: CreateNewBattleUnit[],
): void => {
  const requiredEventProperties = new Set([
    'battleParticipantId',
    'unitId',
    'amountBefore',
    'amountAfter',
  ]);
  const amountOfColumnsToInsert = requiredEventProperties.size;

  const sqlTemplate = `
    INSERT INTO
      battle_units (battle_participant_id, unit_id, amount_before, amount_after)
    VALUES (
      ?,
      (SELECT id FROM unit_ids WHERE unit = ?),
      ?,
      ?)
  `;

  const valueTemplate = `
    ,(
      ?,
      (SELECT id FROM unit_ids WHERE unit = ?),
      ?,
      ?
    )`;
  const amountOfUnits = units.length;

  const sql = `${sqlTemplate}${valueTemplate.repeat(amountOfUnits - 1)};`;

  const params: SqlValue[] = Array.from({
    length: units.length * amountOfColumnsToInsert,
  });

  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    const base = i * amountOfColumnsToInsert;

    params[base] = unit.battleParticipantId;
    params[base + 1] = unit.unitId;
    params[base + 2] = unit.amountBefore;
    params[base + 3] = unit.amountAfter;
  }

  const stmt = database.prepare({ sql });
  stmt.bind(params).stepReset();
};

export const getBattle = (
  database: DbFacade,
  reportId: BaseReport['id'],
): BattleType => {
  const battle = mapBattle(
    database.selectObject({
      sql: selectBattleByReportQuery,
      bind: { $report_id: reportId },
      schema: getBattleByReportRowSchema,
    })!,
  );

  const participants = database
    .selectObjects({
      sql: selectBattleParticipantsByReportQuery,
      bind: { $report_id: reportId },
      schema: getBattleParticipantsByReportRowSchema,
    })
    .map(mapBattleParticipants);

  const units = database
    .selectObjects({
      sql: selectBattleUnitsByReportQuery,
      bind: { $report_id: reportId },
      schema: getBattleUnitsByReportRowSchema,
    })
    .map(mapBattleUnits);

  battle.participants = participants;

  const participantsIdMap = new Map();
  for (const participant of participants) {
    participantsIdMap.set(participant.id, participant);
  }

  for (const unit of units) {
    const participant = participantsIdMap.get(unit.battleParticipantId);
    participant.units.push(unit);
  }

  hydrateBattle(database, battle);

  return battle;
};

const hydrateBattle = (database: DbFacade, battle: BattleType) => {
  // ┌────────────────────┐
  // │ Player information │
  // └────────────────────┘

  const {
    player_name: attackingPlayerName,
    player_slug: attackingPlayerSlug,
    village_name: originVillageName,
    x: originVillageX,
    y: originVillageY,
  } = database.selectObject({
    sql: selectBattlePlayerInformationQuery,
    bind: { $tile_id: battle.originTileId },
    schema: getBattlePlayerInformationRowSchema,
  })!;

  battle.attackingPlayerName = attackingPlayerName;
  battle.attackingPlayerSlug = attackingPlayerSlug;
  battle.originName = originVillageName;
  battle.originCoordinates = { x: originVillageX, y: originVillageY };

  const targetVillage = database.selectObject({
    sql: selectBattlePlayerInformationQuery,
    bind: { $tile_id: battle.targetTileId },
    schema: getBattlePlayerInformationRowSchema,
  });

  if (targetVillage !== undefined) {
    const {
      player_name: defendingPlayerName,
      player_slug: defendingPlayerSlug,
      village_name: targetVillageName,
      x: targetVillageX,
      y: targetVillageY,
    } = targetVillage;

    battle.defendingPlayerName = defendingPlayerName;
    battle.defendingPlayerSlug = defendingPlayerSlug;
    battle.targetName = targetVillageName;
    battle.targetCoordinates = { x: targetVillageX, y: targetVillageY };
  } else {
    const targetOasis = database.selectObject({
      sql: selectBattleOasisInformationQuery,
      bind: { $tile_id: battle.targetTileId },
      schema: getBattleOasisInformationRowSchema,
    });

    if (targetOasis === undefined) {
      throw new Error(`Battle target tile ${battle.targetTileId} not found`);
    }

    const {
      player_name: defendingPlayerName,
      player_slug: defendingPlayerSlug,
      x: targetX,
      y: targetY,
    } = targetOasis;

    const targetName =
      defendingPlayerSlug != null
        ? `Occupied oasis (${targetX}|${targetY})`
        : `Unoccupied oasis (${targetX}|${targetY})`;

    battle.defendingPlayerName = defendingPlayerName ?? 'Nature';
    battle.defendingPlayerSlug = defendingPlayerSlug ?? undefined;
    battle.targetName = targetName;
    battle.targetCoordinates = { x: targetX, y: targetY };
  }

  // ┌───────────────────┐
  // │ Player statistics │
  // └───────────────────┘

  let attackerSupplyBefore = 0;
  let attackerSupplyLost = 0;
  let attackerResourcesLost = 0;
  let defenderSupplyBefore = 0;
  let defenderSupplyLost = 0;
  let defenderResourcesLost = 0;

  for (const participant of battle.participants) {
    for (const { unitId, amountBefore, amountAfter } of participant.units) {
      const unit = unitsMap.get(unitId);
      if (unit) {
        let totalResourceCost = 0;
        for (const resourceCost of unit.baseRecruitmentCost) {
          totalResourceCost += resourceCost;
        }

        const amountLost = amountBefore - amountAfter;
        const resourcesLost = totalResourceCost * amountLost;

        if (participant.role === 'attacker') {
          attackerSupplyBefore += amountBefore;
          attackerSupplyLost += amountLost;
          attackerResourcesLost += resourcesLost;
        } else {
          defenderSupplyBefore += amountBefore;
          defenderSupplyLost += amountLost;
          defenderResourcesLost += resourcesLost;
        }
      }
    }
  }

  battle.attackStatistics.supplyBefore = attackerSupplyBefore;
  battle.attackStatistics.supplyLost = attackerSupplyLost;
  battle.attackStatistics.resourcesLost = attackerResourcesLost;
  battle.defenceStatistics.supplyBefore = defenderSupplyBefore;
  battle.defenceStatistics.supplyLost = defenderSupplyLost;
  battle.defenceStatistics.resourcesLost = defenderResourcesLost;

  // ┌───────────────────────────┐
  // │ Carry capacity and winner │
  // └───────────────────────────┘

  const attacker = battle.participants.find((p) => p.role === 'attacker')!;
  let totalCarryCapacity = 0;
  for (const { unitId, amountAfter } of attacker.units) {
    const unit = unitsMap.get(unitId);
    if (!unit) {
      continue;
    }
    totalCarryCapacity += unit.unitCarryCapacity * amountAfter;
  }

  battle.totalCarryCapacity = totalCarryCapacity;

  battle.didAttackerWin =
    battle.attackStatistics.points > battle.defenceStatistics.points;
};
