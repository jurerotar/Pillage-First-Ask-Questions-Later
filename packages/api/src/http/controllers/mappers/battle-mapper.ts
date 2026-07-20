import type { z } from 'zod';
import type {
  BattleStatistics,
  battleSchema,
} from '@pillage-first/types/models/battle';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import type {
  getBattleByReportRowSchema,
  getBattleParticipantsByReportRowSchema,
  getBattleUnitsByReportRowSchema,
} from '../schemas/battle-schemas';

export type MappedBattleUnit = {
  battleParticipantId: number;
  unitId: UnitId;
  amountBefore: number;
  amountAfter: number;
};

export type MappedBattleParticipant = {
  id: number;
  playerId: number | null;
  tileId: number;
  role: 'attacker' | 'defender';
  tribe: Tribe;
  isReinforcement: boolean;
  units: Omit<MappedBattleUnit, 'battleParticipantId'>[];
};

export const mapBattleUnits = (
  row: z.infer<typeof getBattleUnitsByReportRowSchema>,
): MappedBattleUnit => {
  return {
    battleParticipantId: row.battle_participant_id,
    unitId: row.unit_id,
    amountBefore: row.amount_before,
    amountAfter: row.amount_after,
  };
};

export const mapBattleParticipants = (
  row: z.infer<typeof getBattleParticipantsByReportRowSchema>,
): MappedBattleParticipant => {
  return {
    id: row.id,
    playerId: row.player_id,
    tileId: row.tile_id,
    role: row.role,
    tribe: row.tribe,
    isReinforcement: Boolean(row.is_reinforcement),
    units: [],
  };
};

export const mapBattle = (
  row: z.infer<typeof getBattleByReportRowSchema>,
): z.infer<typeof battleSchema> => {
  const loot: ResourceBundle = [
    row.loot_wood,
    row.loot_clay,
    row.loot_iron,
    row.loot_wheat,
  ];

  const attackStatistics: BattleStatistics = {
    points: row.attacker_points,
    supplyBefore: 0,
    supplyLost: 0,
    resourcesLost: 0,
  };

  const defenceStatistics: BattleStatistics = {
    points: row.defender_points,
    supplyBefore: 0,
    supplyLost: 0,
    resourcesLost: 0,
  };

  return {
    id: row.id,
    attacker: {
      player: { id: null, name: '', slug: undefined },
      village: {
        tileId: row.origin_tile_id,
        name: '',
        coordinates: { x: 0, y: 0 },
      },
      troops: { id: 0, tribe: 'romans' as const, units: [] },
    },
    defender: {
      player: { id: null, name: '', slug: undefined },
      village: {
        tileId: row.target_tile_id,
        name: '',
        coordinates: { x: 0, y: 0 },
      },
      troops: { id: 0, tribe: 'romans' as const, units: [] },
      reinforcements: [],
    },
    outcome: {
      isRaid: Boolean(row.is_raid),
      loot,
      totalCarryCapacity: 0,
      didAttackerWin: false,
      canAttackerSeeFullReport: Boolean(row.can_attacker_see_full_report),
    },
    statistics: {
      attacker: attackStatistics,
      defender: defenceStatistics,
    },
  };
};
