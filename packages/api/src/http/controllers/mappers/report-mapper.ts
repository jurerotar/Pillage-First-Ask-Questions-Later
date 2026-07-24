import type { z } from 'zod';
import { unitsMap } from '@pillage-first/game-assets/units';
import { reportListingDtoSchema } from '@pillage-first/types/dtos/report';
import type { BattleType } from '@pillage-first/types/models/battle';
import type { BattleReportSummary } from '@pillage-first/types/models/report';
import {
  type movementReportUnitSchema,
  reportSchema,
} from '@pillage-first/types/models/report';
import type {
  getReportListingsRowSchema,
  getReportsRowSchema,
} from '../schemas/report-schemas';

type ReportRow = z.infer<typeof getReportsRowSchema>;
type ReportListingRow = z.infer<typeof getReportListingsRowSchema>;
type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
type BattleReportRow = Extract<ReportRow, { type: 'battle' }>;
type AdventureReportRow = Extract<ReportRow, { type: 'adventure' }>;
type MovementReportRow = Extract<ReportRow, { type: 'movement' }>;
type TradeReportRow = Extract<ReportRow, { type: 'trade' }>;
type HuntingPartyReportRow = Extract<ReportRow, { type: 'huntingParty' }>;
type GatheringExpeditionReportRow = Extract<
  ReportRow,
  { type: 'gatheringExpedition' }
>;
type ScoutingReportRow = Extract<ReportRow, { type: 'scouting' }>;

const mapBattleReportRowToSummaryDto = (
  row: BattleReportRow,
): BattleReportSummary => {
  return {
    originName: row.battle_origin_name,
    originCoordinates: { x: row.battle_origin_x, y: row.battle_origin_y },
    targetName: row.battle_target_name,
    targetCoordinates: { x: row.battle_target_x, y: row.battle_target_y },
    movementType: row.battle_is_raid ? 'raid' : 'attack',
  };
};

const mapAdventureReportRowToSummaryDto = (row: AdventureReportRow) => {
  return {
    originPlayerName: row.adventure_origin_player_name,
    originPlayerSlug: row.adventure_origin_player_slug,
    originVillageName: row.adventure_origin_village_name,
    originCoordinates: {
      x: row.adventure_origin_x,
      y: row.adventure_origin_y,
    },
    tribe: row.adventure_origin_tribe,
  };
};

const mapMovementReportRowToSummaryDto = (row: MovementReportRow) => {
  return {
    originPlayerName: row.movement_origin_player_name,
    originPlayerSlug: row.movement_origin_player_slug,
    originName: row.movement_origin_name,
    originCoordinates: {
      x: row.movement_origin_x,
      y: row.movement_origin_y,
    },
    targetPlayerName: row.movement_target_player_name,
    targetPlayerSlug: row.movement_target_player_slug,
    targetName: row.movement_target_name,
    targetCoordinates: {
      x: row.movement_target_x,
      y: row.movement_target_y,
    },
    movementType: row.movement_type,
  };
};

const mapTradeReportRowToSummaryDto = (row: TradeReportRow) => {
  return {
    originPlayerName: row.trade_origin_player_name,
    originPlayerSlug: row.trade_origin_player_slug,
    originName: row.trade_origin_name,
    originCoordinates: { x: row.trade_origin_x, y: row.trade_origin_y },
    targetPlayerName: row.trade_target_player_name,
    targetPlayerSlug: row.trade_target_player_slug,
    targetName: row.trade_target_name,
    targetCoordinates: { x: row.trade_target_x, y: row.trade_target_y },
  };
};

const mapBaseReportRowToDto = (row: ReportRow) => ({
  id: row.id,
  villageId: row.village_id,
  timestamp: row.timestamp,
  outcome: row.outcome,
  tags: JSON.parse(row.tags_json),
});

export const mapReportListingRowToDto = (
  row: ReportListingRow,
): ReportListingDto =>
  reportListingDtoSchema.parse({
    id: row.id,
    villageId: row.village_id,
    timestamp: row.timestamp,
    type: row.type,
    outcome: row.outcome,
    summary: JSON.parse(row.summary_json),
    tags: JSON.parse(row.tags_json),
  });

export const mapBattleReportRowToDto = (rows: BattleReportRow[]) => {
  const row = rows[0]!;

  const participants = new Map<number, BattleType['attacker']>();
  const reinforcements: BattleType['defender']['reinforcements'] = [];
  const attackerStatistics = {
    points: row.attacker_points,
    supplyBefore: 0,
    supplyLost: 0,
    resourcesLost: 0,
  };
  const defenderStatistics = {
    points: row.defender_points,
    supplyBefore: 0,
    supplyLost: 0,
    resourcesLost: 0,
  };
  let attacker: BattleType['attacker'] | undefined;
  let defender: BattleType['attacker'] | undefined;
  let totalCarryCapacity = 0;

  for (const participantRow of rows) {
    let participant = participants.get(participantRow.participant_id);
    if (!participant) {
      participant = {
        player: {
          id: participantRow.participant_player_id,
          name: participantRow.participant_player_name,
          slug: participantRow.participant_player_slug ?? undefined,
        },
        village: {
          tileId: participantRow.participant_tile_id,
          name: participantRow.participant_location_name,
          coordinates: {
            x: participantRow.participant_x,
            y: participantRow.participant_y,
          },
        },
        troops: {
          id: participantRow.participant_id,
          tribe: participantRow.participant_tribe,
          units: [],
        },
      };
      participants.set(participantRow.participant_id, participant);

      if (participantRow.participant_role === 'attacker') {
        attacker = participant;
      } else if (participantRow.participant_is_reinforcement) {
        reinforcements.push(participant);
      } else {
        defender = participant;
      }
    }

    if (
      participantRow.participant_unit_id &&
      participantRow.participant_amount_before != null &&
      participantRow.participant_amount_after != null
    ) {
      participant.troops.units.push({
        unitId: participantRow.participant_unit_id,
        amountBefore: participantRow.participant_amount_before,
        amountAfter: participantRow.participant_amount_after,
      });

      const unit = unitsMap.get(participantRow.participant_unit_id);
      if (unit) {
        const amountLost =
          participantRow.participant_amount_before -
          participantRow.participant_amount_after;
        const statistics =
          participantRow.participant_role === 'attacker'
            ? attackerStatistics
            : defenderStatistics;

        let resourceCost = 0;
        for (const cost of unit.baseRecruitmentCost) {
          resourceCost += cost;
        }

        statistics.supplyBefore += participantRow.participant_amount_before;
        statistics.supplyLost += amountLost;
        statistics.resourcesLost += resourceCost * amountLost;

        if (participantRow.participant_role === 'attacker') {
          totalCarryCapacity +=
            unit.unitCarryCapacity * participantRow.participant_amount_after;
        }
      }
    }
  }

  if (!attacker || !defender) {
    throw new Error(`Battle participants missing for report ${row.id}`);
  }

  const battle: BattleType = {
    id: row.battle_id,
    attacker,
    defender: { ...defender, reinforcements },
    outcome: {
      loot: [row.loot_wood, row.loot_clay, row.loot_iron, row.loot_wheat],
      totalCarryCapacity,
      canAttackerSeeFullReport: Boolean(row.can_attacker_see_full_report),
    },
    statistics: { attacker: attackerStatistics, defender: defenderStatistics },
  };

  return reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'battle',
    summary: mapBattleReportRowToSummaryDto(row),
    battle,
  });
};

export const mapAdventureReportRowToDto = (row: AdventureReportRow) =>
  reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'adventure',
    summary: mapAdventureReportRowToSummaryDto(row),
    adventureId: row.adventure_id,
    itemId: row.item_id,
    itemAmount: row.item_amount,
    healthBefore: row.health_before,
    healthAfter: row.health_after,
  });

export const mapMovementReportRowToDto = (
  row: MovementReportRow,
  movementUnits: z.infer<typeof movementReportUnitSchema>[],
) =>
  reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'movement',
    summary: mapMovementReportRowToSummaryDto(row),
    movement: {
      id: row.movement_id,
      tribe: row.movement_tribe,
      originTileId: row.movement_origin_tile_id,
      targetTileId: row.movement_target_tile_id,
      movementType: row.movement_type,
      units: movementUnits,
    },
  });

export const mapTradeReportRowToDto = (row: TradeReportRow) =>
  reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'trade',
    summary: mapTradeReportRowToSummaryDto(row),
    trade: {
      id: row.trade_id,
      originTileId: row.trade_origin_tile_id,
      targetTileId: row.trade_target_tile_id,
      resources: [
        row.trade_wood,
        row.trade_clay,
        row.trade_iron,
        row.trade_wheat,
      ],
    },
  });

const mapExpeditionReportRowToSummaryDto = (
  row: HuntingPartyReportRow | GatheringExpeditionReportRow,
) => ({
  villageName: row.expedition_village_name,
  villageCoordinates: {
    x: row.expedition_village_x,
    y: row.expedition_village_y,
  },
});

export const mapHuntingPartyReportRowToDto = (
  row: HuntingPartyReportRow,
  units: z.infer<typeof movementReportUnitSchema>[],
) =>
  reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'huntingParty',
    summary: mapExpeditionReportRowToSummaryDto(row),
    tribe: row.expedition_tribe,
    units,
  });

export const mapGatheringExpeditionReportRowToDto = (
  row: GatheringExpeditionReportRow,
  units: z.infer<typeof movementReportUnitSchema>[],
) =>
  reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'gatheringExpedition',
    summary: mapExpeditionReportRowToSummaryDto(row),
    tribe: row.expedition_tribe,
    units,
    loot: [row.loot_wood, row.loot_clay, row.loot_iron, row.loot_wheat],
  });

export const mapScoutingReportRowToDto = (
  row: ScoutingReportRow,
  attackerUnits: {
    unitId: string;
    amountBefore: number;
    amountAfter: number;
  }[],
  units: {
    role: 'defender' | 'reinforcement';
    tileId: number;
    unitId: string;
    amount: number;
    tribe: ScoutingReportRow['attacker_tribe'];
    playerName: string;
    playerSlug: string;
    villageName: string;
    x: number;
    y: number;
  }[],
  defensiveStructures: { buildingId: string; level: number }[],
) => {
  const hideIntelligence = !row.successful;
  const reinforcementRows = units.filter(
    ({ role }) => role === 'reinforcement',
  );
  const reinforcements = [
    ...new Set(reinforcementRows.map(({ tileId }) => tileId)),
  ].map((tileId) => {
    const rows = reinforcementRows.filter((unit) => unit.tileId === tileId);
    const first = rows[0]!;
    return {
      tribe: first.tribe,
      player: { name: first.playerName, slug: first.playerSlug },
      village: {
        name: first.villageName,
        coordinates: { x: first.x, y: first.y },
      },
      units: rows.map(({ unitId, amount }) => ({ unitId, amount })),
    };
  });

  return reportSchema.parse({
    ...mapBaseReportRowToDto(row),
    type: 'scouting',
    summary: {
      originPlayerName: row.origin_player_name,
      originPlayerSlug: row.origin_player_slug,
      originName: row.origin_name,
      originCoordinates: { x: row.origin_x, y: row.origin_y },
      targetPlayerName: row.target_player_name,
      targetPlayerSlug: row.target_player_slug,
      targetName: row.target_name,
      targetCoordinates: { x: row.target_x, y: row.target_y },
    },
    scouting: {
      id: row.scouting_id,
      perspective: row.perspective,
      successful: Boolean(row.successful),
      target: row.scouting_target,
      attacker: {
        tribe: row.attacker_tribe,
        units: attackerUnits,
      },
      defender: {
        tribe: row.defender_tribe,
        units: units
          .filter(({ role }) => role === 'defender')
          .map(({ unitId, amount }) => ({ unitId, amount })),
        reinforcements: hideIntelligence ? [] : reinforcements,
      },
      resources:
        hideIntelligence || row.wood == null
          ? null
          : [row.wood, row.clay, row.iron, row.wheat],
      defensiveStructures: hideIntelligence ? [] : defensiveStructures,
    },
  });
};
