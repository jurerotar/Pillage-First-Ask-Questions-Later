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

export type CreateNewReport = Omit<GameReport, 'id' | 'battle'>;

export type CreateNewBattleType = Omit<
  BattleType,
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
  'id' | 'units' | 'tribe'
> & { reportId: BaseReport['id']; tribeId: number; source: number };

export type CreateNewBattleUnit = BattleUnit & {
  reportId: BaseReport['id'];
};

export const insertReport = (
  database: DbFacade,
  report: CreateNewReport,
): number => {
  const reportId = database.selectValue({
    sql: `
      INSERT INTO
        reports (player_id, village_id, timestamp, subject, type, combat_result_id)
      VALUES
        (
          $player_id,
          $village_id,
          $timestamp,
          $subject,
          $type,
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
      $subject: report.subject,
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
): void => {
  database.exec({
    sql: `
      INSERT INTO
        battles (
          report_id,
          attacking_village_id,
          defending_village_id,
          defending_oasis_id,
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
          $attacking_village_id,
          $defending_village_id,
          $defending_oasis_id,
          $loot_wood,
          $loot_clay,
          $loot_iron,
          $loot_wheat,
          $can_attacker_see_full_report,
          $attacker_points,
          $defender_points
        );
`,
    bind: {
      $report_id: battle.reportId,
      $attacking_village_id: battle.attackingVillageId,
      $defending_village_id: battle.defendingVillageId,
      $defending_oasis_id: battle.defendingOasisId,
      $loot_wood: battle.loot[0],
      $loot_clay: battle.loot[1],
      $loot_iron: battle.loot[2],
      $loot_wheat: battle.loot[3],
      $can_attacker_see_full_report: battle.canAttackerSeeFullReport,
      $attacker_points: battle.attackStatisticPoints,
      $defender_points: battle.defenceStatisticPoints,
    },
  });
};

export const insertBattleParticipant = (
  database: DbFacade,
  participant: CreateNewBattleParticipant,
): number => {
  return database.selectValue({
    sql: `
      INSERT INTO
        battle_participants (report_id, role, tribe_id, is_reinforcement)
      VALUES
        (
          $report_id,
          $role,
          $tribe_id,
          $is_reinforcement
        )
      RETURNING id;
`,
    bind: {
      $report_id: participant.reportId,
      $role: participant.role,
      $tribe_id: participant.tribeId,
      $is_reinforcement: participant.isReinforcement,
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
    'reportId',
    'amountBefore',
    'amountAfter',
  ]);
  const amountOfColumnsToInsert = requiredEventProperties.size;

  const sqlTemplate = `
    INSERT INTO
      battle_units (report_id, battle_participant_id, unit_id, amount_before, amount_after)
    VALUES (
      ?,
      ?,
      (SELECT id FROM unit_ids WHERE unit = ?),
      ?,
      ?)
  `;

  const valueTemplate = `
    ,(
      ?,
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

    params[base] = unit.reportId;
    params[base + 1] = unit.battleParticipantId;
    params[base + 2] = unit.unitId;
    params[base + 3] = unit.amountBefore;
    params[base + 4] = unit.amountAfter;
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
    bind: { $village_id: battle.attackingVillageId },
    schema: getBattlePlayerInformationRowSchema,
  })!;

  battle.attackingPlayerName = attackingPlayerName;
  battle.attackingPlayerSlug = attackingPlayerSlug;
  battle.originName = originVillageName;
  battle.originCoordinates = { x: originVillageX, y: originVillageY };

  if (battle.defendingVillageId != null) {
    const {
      player_name: defendingPlayerName,
      player_slug: defendingPlayerSlug,
      village_name: targetVillageName,
      x: targetVillageX,
      y: targetVillageY,
    } = database.selectObject({
      sql: selectBattlePlayerInformationQuery,
      bind: { $village_id: battle.defendingVillageId },
      schema: getBattlePlayerInformationRowSchema,
    })!;

    battle.defendingPlayerName = defendingPlayerName;
    battle.defendingPlayerSlug = defendingPlayerSlug;
    battle.targetName = targetVillageName;
    battle.targetCoordinates = { x: targetVillageX, y: targetVillageY };
  } else if (battle.defendingOasisId != null) {
    const {
      player_name: defendingPlayerName,
      player_slug: defendingPlayerSlug,
      x: targetX,
      y: targetY,
    } = database.selectObject({
      sql: selectBattleOasisInformationQuery,
      bind: { $oasis_id: battle.defendingOasisId },
      schema: getBattleOasisInformationRowSchema,
    })!;

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
