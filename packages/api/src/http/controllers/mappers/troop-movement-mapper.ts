import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  troopMovementItemDtoSchema,
  troopMovementStatsItemDtoSchema,
} from '@pillage-first/types/dtos/troop-movement';
import { troopSchema } from '@pillage-first/types/models/troop';
import type {
  getVillageTroopMovementStatsRowSchema,
  getVillageTroopMovementsRowSchema,
} from '../schemas/troop-movement-schemas';

const troopMovementMetaSchema = z.object({
  troops: z.array(troopSchema).default([]),
});

export const mapTroopMovementRowToDto = (
  row: z.infer<typeof getVillageTroopMovementsRowSchema>,
) => {
  const isAdventure = row.type === 'troopMovementAdventure';
  const { troops } = troopMovementMetaSchema.parse(JSON.parse(row.meta));

  return troopMovementItemDtoSchema.parse({
    id: row.id,
    type: row.type,
    originatingVillageId: row.originating_village_id,
    originatingVillageName: row.originating_village_name,
    originatingTileId: row.originating_tile_id,
    playerName: row.player_name,
    playerId: row.player_id,
    playerTribe: row.player_tribe,
    resolvesAt: row.resolves_at,
    troops:
      row.player_id !== PLAYER_ID &&
      (row.type === 'troopMovementAttack' ||
        row.type === 'troopMovementRaid' ||
        row.type === 'troopMovementOasisOccupation')
        ? null
        : troops,
    ...(isAdventure
      ? {}
      : {
          targetVillageId: row.target_village_id,
          targetVillageName: row.target_village_name,
          targetTileId: row.target_tile_id,
        }),
  });
};

export const mapTroopMovementStatsRowToDto = (
  row: z.infer<typeof getVillageTroopMovementStatsRowSchema>,
) =>
  troopMovementStatsItemDtoSchema.parse({
    type: row.movement_type,
    count: row.count,
    earliestResolvesAt: row.earliest_resolves_at,
  });
