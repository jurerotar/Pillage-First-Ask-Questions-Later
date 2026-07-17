import type { z } from 'zod';
import type {
  battleDtoSchema,
  battleParticipantDtoSchema,
  battleUnitDtoSchema,
} from '@pillage-first/types/dtos/battle';
import type { BattleStatistics } from '@pillage-first/types/models/battle';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type {
  getBattleByReportRowSchema,
  getBattleParticipantsByReportRowSchema,
  getBattleUnitsByReportRowSchema,
} from '../schemas/battle-schemas';

export const mapBattleUnits = (
  row: z.infer<typeof getBattleUnitsByReportRowSchema>,
): z.infer<typeof battleUnitDtoSchema> => {
  const dto = {
    battleParticipantId: row.battle_participant_id,
    unitId: row.unit_id,
    amountBefore: row.amount_before,
    amountAfter: row.amount_after,
  };

  return dto;
};

export const mapBattleParticipants = (
  row: z.infer<typeof getBattleParticipantsByReportRowSchema>,
): z.infer<typeof battleParticipantDtoSchema> => {
  const dto = {
    id: row.id,
    playerId: row.player_id,
    tileId: row.tile_id,
    role: row.role,
    tribe: row.tribe,
    isReinforcement: Boolean(row.is_reinforcement),
    units: [],
  };

  return dto;
};

export const mapBattle = (
  row: z.infer<typeof getBattleByReportRowSchema>,
): z.infer<typeof battleDtoSchema> => {
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

  const dto = {
    id: row.id,
    originTileId: row.origin_tile_id,
    targetTileId: row.target_tile_id,
    isRaid: Boolean(row.is_raid),
    attackingPlayerName: '',
    attackingPlayerSlug: '',
    defendingPlayerName: '',
    defendingPlayerSlug: undefined,
    originName: '',
    originCoordinates: { x: 0, y: 0 },
    targetName: '',
    targetCoordinates: { x: 0, y: 0 },
    loot,
    totalCarryCapacity: 0,
    didAttackerWin: false,
    canAttackerSeeFullReport: Boolean(row.can_attacker_see_full_report),
    attackStatistics,
    defenceStatistics,
    participants: [],
  };

  return dto;
};
