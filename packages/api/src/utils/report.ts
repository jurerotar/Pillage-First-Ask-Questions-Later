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
  getBattleParticipantsByReportRowSchema,
  getBattleUnitsByReportRowSchema,
} from '../http/controllers/schemas/battle-schemas';
import {
  selectBattleByReportQuery,
  selectBattleParticipantsByReportQuery,
  selectBattleUnitsByReportQuery,
} from '../queries/battle-queries';

export type CreateNewReport = Omit<GameReport, 'id' | 'battle'>;

export type CreateNewBattleType = Omit<
  BattleType,
  'participants' | 'attackStatistics' | 'defenceStatistics' | 'didAttackerWin'
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
        reports (player_id, village_id, timestamp, subject, type)
      VALUES
        (
          $player_id,
          $village_id,
          $timestamp,
          $subject,
          $type
        )
      RETURNING id;
`,
    bind: {
      $player_id: report.playerId,
      $village_id: report.villageId,
      $timestamp: report.timestamp,
      $subject: report.subject,
      $type: report.type,
    },
    schema: z.int(),
  })!;

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
          attacking_player_name,
          attacking_player_slug,
          defending_player_name,
          defending_player_slug,
          origin_village_name,
          origin_village_x,
          origin_village_y,
          target_village_name,
          target_village_x,
          target_village_y,
          loot_wood,
          loot_clay,
          loot_iron,
          loot_wheat,
          total_carry_capacity,
          can_attacker_see_full_report,
          attacker_points,
          defender_points
        )
      VALUES
        (
          $report_id,
          $attacking_player_name,
          $attacking_player_slug,
          $defending_player_name,
          $defending_player_slug,
          $origin_village_name,
          $origin_village_x,
          $origin_village_y,
          $target_village_name,
          $target_village_x,
          $target_village_y,
          $loot_wood,
          $loot_clay,
          $loot_iron,
          $loot_wheat,
          $total_carry_capacity,
          $can_attacker_see_full_report,
          $attacker_points,
          $defender_points
        );
`,
    bind: {
      $report_id: battle.reportId,
      $attacking_player_name: battle.attackingPlayerName,
      $attacking_player_slug: battle.attackingPlayerSlug,
      $defending_player_name: battle.defendingPlayerName,
      $defending_player_slug: battle.defendingPlayerSlug,
      $origin_village_name: battle.originVillageName,
      $origin_village_x: battle.originVillageCoordinates.x,
      $origin_village_y: battle.originVillageCoordinates.y,
      $target_village_name: battle.targetVillageName,
      $target_village_x: battle.targetVillageCoordinates.x,
      $target_village_y: battle.targetVillageCoordinates.y,
      $loot_wood: battle.loot[0],
      $loot_clay: battle.loot[1],
      $loot_iron: battle.loot[2],
      $loot_wheat: battle.loot[3],
      $total_carry_capacity: battle.totalCarryCapacity,
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

  hydrateBattle(battle);

  return battle;
};

const hydrateBattle = (battle: BattleType) => {
  // TODO Hydrate from village ID
  // Using attacking village ID get: player name, slug, village name and village coordinates
  // Using defending village ID get: player name, slug, village name and village coordinates

  battle.didAttackerWin =
    battle.attackStatistics.points > battle.defenceStatistics.points;

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
};
