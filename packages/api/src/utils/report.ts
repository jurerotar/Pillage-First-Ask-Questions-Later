import { z } from 'zod';
import { unitsMap } from '@pillage-first/game-assets/units';
import type {
  BattleParticipant,
  BattleType,
} from '@pillage-first/types/models/battle';
import type {
  BaseReport,
  ReportOutcome,
} from '@pillage-first/types/models/report';
import type { Resources } from '@pillage-first/types/models/resource';
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

export type CreateNewTradeReport = Pick<
  CreateNewReport,
  'playerId' | 'villageId' | 'timestamp'
> & {
  outcome: Extract<
    ReportOutcome,
    'incomingMerchantsArrived' | 'outgoingMerchantsArrived'
  >;
  originTileId: number;
  targetTileId: number;
  resources: Resources;
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

  if (report.tags.length > 0) {
    database.exec({
      sql: `
        INSERT INTO report_tags (report_id, report_tag_id)
        SELECT $report_id, report_tag_ids.id
        FROM json_each($tags)
        JOIN report_tag_ids ON report_tag_ids.tag = json_each.value;
      `,
      bind: {
        $report_id: reportId,
        $tags: JSON.stringify(report.tags),
      },
    });
  }

  return reportId;
};

export const insertTradeReport = (
  database: DbFacade,
  report: CreateNewTradeReport,
): number => {
  const reportId = insertReport(database, {
    playerId: report.playerId,
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'trade',
    outcome: report.outcome,
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO trade_reports (
        report_id,
        origin_tile_id,
        target_tile_id,
        wood,
        clay,
        iron,
        wheat
      ) VALUES (
        $report_id,
        $origin_tile_id,
        $target_tile_id,
        $wood,
        $clay,
        $iron,
        $wheat
      );
    `,
    bind: {
      $report_id: reportId,
      $origin_tile_id: report.originTileId,
      $target_tile_id: report.targetTileId,
      $wood: report.resources.wood,
      $clay: report.resources.clay,
      $iron: report.resources.iron,
      $wheat: report.resources.wheat,
    },
  });

  return reportId;
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

  const participantsIdMap = new Map<number, MappedBattleParticipant>();
  for (const participant of participants) {
    participantsIdMap.set(participant.id, participant);
  }

  for (const unit of units) {
    const participant = participantsIdMap.get(unit.battleParticipantId);
    if (!participant) {
      throw new Error(
        `Battle participant ${unit.battleParticipantId} not found for report ${reportId}`,
      );
    }
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
