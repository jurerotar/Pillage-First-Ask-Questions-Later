import type { TroopMovementItemDto } from '@pillage-first/types/dtos/troop-movement';
import type { TroopMovementFilterType } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/components/troop-movement-filters';

export const getTroopMovementFilterCategory = (
  movement: TroopMovementItemDto,
  currentTileId: number,
): TroopMovementFilterType => {
  if (movement.type === 'troopMovementFindNewVillage') {
    return 'findNewVillage';
  }

  if (movement.type === 'troopMovementAdventure') {
    return 'adventure';
  }

  if (
    movement.type === 'troopMovementReinforcements' ||
    movement.type === 'troopMovementRelocation' ||
    movement.type === 'troopMovementReturn'
  ) {
    return movement.originatingTileId !== currentTileId
      ? 'deploymentIncoming'
      : 'deploymentOutgoing';
  }

  if (movement.type === 'troopMovementOasisOccupation') {
    return 'offensiveMovementOutgoing';
  }

  return movement.originatingTileId !== currentTileId
    ? 'offensiveMovementIncoming'
    : 'offensiveMovementOutgoing';
};
