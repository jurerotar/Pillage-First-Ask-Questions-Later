import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { unitsMap } from '@pillage-first/game-assets/units';
import type {
  BattleParticipant,
  BattleType,
  BattleUnit,
} from '@pillage-first/types/models/battle';
import type { BaseReport } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  type MappedBattleParticipant,
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

export type CreateNewReport = Pick<
  BaseReport,
  'playerId' | 'villageId' | 'timestamp' | 'type' | 'outcome' | 'tags'
>;

export type CreateNewBattleType = Omit<
  BattleType,
  'id' | 'attacker' | 'defender' | 'outcome' | 'statistics'
> & {
  reportId: BaseReport['id'];
  originTileId: number;
  targetTileId: number;
  isRaid: boolean;
  loot: [number, number, number, number];
  canAttackerSeeFullReport: boolean;
  attackStatisticPoints: number;
  defenceStatisticPoints: number;
};

export type CreateNewBattleParticipant = {
  battleId: BattleType['id'];
  playerId: number | null;
  tileId: number;
};

export type CreateNewBattleUnit = BattleUnit & {
  battleParticipantId: number;
};

export const insertReport = (
  database: DbFacade,
  report: CreateNewReport,
): number => {
  const reportId = database.selectValue({
    sql: `
      INSERT INTO
        reports (
          player_id,
          village_id,
          timestamp,
          type_id,
          report_outcome_id
        )
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
              report_outcome_ids
            WHERE
              report_outcome = $outcome
          )
        )
      RETURNING id;
`,
    bind: {
      $player_id: report.playerId,
      $village_id: report.villageId,
      $timestamp: report.timestamp,
      $type: report.type,
      $outcome: report.outcome,
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

  const participantsIdMap = new Map();
  for (const participant of participants) {
    participantsIdMap.set(participant.id, participant);
  }

  for (const unit of units) {
    const participant = participantsIdMap.get(unit.battleParticipantId);
    const { battleParticipantId: _, ...battleUnit } = unit;
    participant.units.push(battleUnit);
  }

  hydrateBattle(database, battle, participants);

  return battle;
};

const createBattleCombatant = ({
  participant,
  playerName,
  playerSlug,
  villageName,
  x,
  y,
}: {
  participant: MappedBattleParticipant;
  playerName: string;
  playerSlug?: string;
  villageName: string;
  x: number;
  y: number;
}): BattleParticipant => {
  return {
    player: {
      id: participant.playerId,
      name: playerName,
      slug: playerSlug,
    },
    village: {
      tileId: participant.tileId,
      name: villageName,
      coordinates: { x, y },
    },
    troops: {
      id: participant.id,
      tribe: participant.tribe,
      units: participant.units,
    },
  };
};

const hydrateVillageCombatant = (
  database: DbFacade,
  participant: MappedBattleParticipant,
): BattleParticipant => {
  const {
    player_name: playerName,
    player_slug: playerSlug,
    village_name: villageName,
    x,
    y,
  } = database.selectObject({
    sql: selectBattlePlayerInformationQuery,
    bind: { $tile_id: participant.tileId },
    schema: getBattlePlayerInformationRowSchema,
  })!;

  return createBattleCombatant({
    participant,
    playerName,
    playerSlug,
    villageName,
    x,
    y,
  });
};

const hydrateTargetCombatant = (
  database: DbFacade,
  participant: MappedBattleParticipant,
): BattleParticipant => {
  const targetVillage = database.selectObject({
    sql: selectBattlePlayerInformationQuery,
    bind: { $tile_id: participant.tileId },
    schema: getBattlePlayerInformationRowSchema,
  });

  if (targetVillage !== undefined) {
    const {
      player_name: playerName,
      player_slug: playerSlug,
      village_name: villageName,
      x,
      y,
    } = targetVillage;

    return createBattleCombatant({
      participant,
      playerName,
      playerSlug,
      villageName,
      x,
      y,
    });
  }

  const targetOasis = database.selectObject({
    sql: selectBattleOasisInformationQuery,
    bind: { $tile_id: participant.tileId },
    schema: getBattleOasisInformationRowSchema,
  });

  if (targetOasis === undefined) {
    throw new Error(`Battle target tile ${participant.tileId} not found`);
  }

  const {
    player_name: playerName,
    player_slug: playerSlug,
    x,
    y,
  } = targetOasis;

  const villageName =
    playerSlug != null ? 'Occupied oasis' : 'Unoccupied oasis';

  return createBattleCombatant({
    participant,
    playerName: playerName ?? 'Nature',
    playerSlug: playerSlug ?? undefined,
    villageName,
    x,
    y,
  });
};

const hydrateBattle = (
  database: DbFacade,
  battle: BattleType,
  participants: MappedBattleParticipant[],
) => {
  const attackerParticipant = participants.find((p) => p.role === 'attacker')!;
  const defenderParticipant = participants.find(
    (p) => p.role === 'defender' && !p.isReinforcement,
  )!;
  const reinforcementParticipants = participants.filter(
    (p) => p.role === 'defender' && p.isReinforcement,
  );

  battle.attacker = hydrateVillageCombatant(database, attackerParticipant);
  battle.defender = {
    ...hydrateTargetCombatant(database, defenderParticipant),
    reinforcements: reinforcementParticipants.map((p) =>
      hydrateVillageCombatant(database, p),
    ),
  };

  let attackerSupplyBefore = 0;
  let attackerSupplyLost = 0;
  let attackerResourcesLost = 0;
  let defenderSupplyBefore = 0;
  let defenderSupplyLost = 0;
  let defenderResourcesLost = 0;

  const combatants = [
    battle.attacker,
    battle.defender,
    ...battle.defender.reinforcements,
  ];

  for (const combatant of combatants) {
    for (const { unitId, amountBefore, amountAfter } of combatant.troops
      .units) {
      const unit = unitsMap.get(unitId);
      if (unit) {
        let totalResourceCost = 0;
        for (const resourceCost of unit.baseRecruitmentCost) {
          totalResourceCost += resourceCost;
        }

        const amountLost = amountBefore - amountAfter;
        const resourcesLost = totalResourceCost * amountLost;

        if (combatant === battle.attacker) {
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

  battle.statistics.attacker.supplyBefore = attackerSupplyBefore;
  battle.statistics.attacker.supplyLost = attackerSupplyLost;
  battle.statistics.attacker.resourcesLost = attackerResourcesLost;
  battle.statistics.defender.supplyBefore = defenderSupplyBefore;
  battle.statistics.defender.supplyLost = defenderSupplyLost;
  battle.statistics.defender.resourcesLost = defenderResourcesLost;

  let totalCarryCapacity = 0;
  for (const { unitId, amountAfter } of battle.attacker.troops.units) {
    const unit = unitsMap.get(unitId);
    if (!unit) {
      continue;
    }
    totalCarryCapacity += unit.unitCarryCapacity * amountAfter;
  }

  battle.outcome.totalCarryCapacity = totalCarryCapacity;

  battle.outcome.didAttackerWin =
    battle.statistics.attacker.points > battle.statistics.defender.points;
};
