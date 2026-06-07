import type { z } from 'zod';
import {
  troopMovementItemDtoSchema,
  troopMovementStatsItemDtoSchema,
} from '@pillage-first/types/dtos/troop-movement';
import type {
  getVillageTroopMovementStatsRowSchema,
  getVillageTroopMovementsRowSchema,
} from '../schemas/troop-movement-schemas';

export const mapTroopMovementRowToDto = (
  row: z.infer<typeof getVillageTroopMovementsRowSchema>,
) => {
  const isAdventure = row.type === 'troopMovementAdventure';
  return troopMovementItemDtoSchema.parse({
    id: row.id,
    type: row.type,
    originatingVillageId: row.originating_village_id,
    originatingVillageName: row.originating_village_name,
    originatingVillageCoordinates: {
      x: row.originating_village_x,
      y: row.originating_village_y,
    },
    playerName: row.player_name,
    playerId: row.player_id,
    playerTribe: row.player_tribe,
    resolvesAt: row.resolves_at,
    ...(isAdventure
      ? {}
      : {
          targetVillageId: row.target_village_id,
          targetVillageName: row.target_village_name,
          targetVillageCoordinates:
            row.target_village_x !== null && row.target_village_y !== null
              ? { x: row.target_village_x, y: row.target_village_y }
              : null,
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
