import type { ApiHandler } from 'app/interfaces/api';
import type { ContextualTile, Tile } from 'app/interfaces/models/game/tile';
import {
  eventsCacheKey,
  mapCacheKey,
  playersCacheKey,
  reputationsCacheKey,
  villagesCacheKey,
  worldItemsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { isOccupiedOccupiableTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { isTroopMovementEvent } from 'app/(game)/guards/event-guards';
import type { TroopMovementType } from 'app/components/icons/icon-maps';

export const getMap: ApiHandler<Tile[]> = async (queryClient) => {
  return queryClient.getQueryData<Tile[]>([mapCacheKey])!;
};

export const getContextualMap: ApiHandler<ContextualTile[], 'villageId'> = async (queryClient, { params }) => {
  const { villageId: villageIdParam } = params;
  const villageId = Number.parseInt(villageIdParam);

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const reputations = queryClient.getQueryData<Reputation[]>([reputationsCacheKey])!;
  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const worldItems = queryClient.getQueryData<WorldItem[]>([worldItemsCacheKey])!;

  const reputationMap = new Map<Player['faction'], Reputation>(
    reputations.map((reputation) => {
      return [reputation.faction, reputation];
    }),
  );

  const playerMap = new Map<Player['id'], Player>(
    players.map((player) => {
      return [player.id, player];
    }),
  );

  const _villageMap = new Map<Village['id'], Village>(
    villages.map((village) => {
      return [village.id, village];
    }),
  );

  const worldItemsMap = new Map<Village['id'], WorldItem>(
    worldItems.map((worldItem) => {
      return [worldItem.tileId, worldItem];
    }),
  );

  const troopMovementMap = new Map<Village['id'], GameEvent<'troopMovement'>[]>([]);

  for (const event of events) {
    if (!isTroopMovementEvent(event)) {
      continue;
    }

    // Show only events targeting or originating from current village
    if (!(event.villageId === villageId || event.targetId === villageId)) {
      continue;
    }

    if (!troopMovementMap.has(event.targetId)) {
      troopMovementMap.set(event.targetId, []);
    }

    const eventArray = troopMovementMap.get(event.targetId)!;
    eventArray.push(event);
  }

  const offensiveMovements: GameEvent<'troopMovement'>['movementType'][] = ['attack', 'raid'];
  const deploymentMovements: GameEvent<'troopMovement'>['movementType'][] = ['return', 'reinforcements', 'relocation'];

  const contextualTiles: ContextualTile[] = Array(tiles.length);

  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i] as ContextualTile;

    const isCurrentVillageTile = villageId === tile.id;

    let troopMovementIcon: TroopMovementType | null = null;

    if (troopMovementMap.has(tile.id)) {
      const troopMovements = troopMovementMap.get(tile.id)!;
      for (const troopMovement of troopMovements) {
        if (offensiveMovements.includes(troopMovement.movementType)) {
          if (isCurrentVillageTile && troopMovement.targetId === tile.id) {
            troopMovementIcon = 'offensiveMovementIncoming';
            break;
          }

          troopMovementIcon = 'offensiveMovementOutgoing';
          break;
        }

        if (deploymentMovements.includes(troopMovement.movementType)) {
          if (isCurrentVillageTile && troopMovement.targetId === tile.id) {
            troopMovementIcon = 'deploymentIncoming';
            break;
          }

          troopMovementIcon = 'deploymentOutgoing';
          break;
        }

        if (troopMovement.movementType === 'find-new-village') {
          troopMovementIcon = 'findNewVillage';
        }
      }
    }

    tile.troopMovementIcon = troopMovementIcon;

    if (isOccupiedOccupiableTile(tile)) {
      const { faction, tribe } = playerMap.get(tile.ownedBy)!;

      // TODO: Calculate village size
      tile.villageSize = 'xs';
      tile.tribe = tribe;
      tile.worldItem = worldItemsMap.get(tile.id) ?? null;
      tile.reputationLevel = reputationMap.get(faction)!.reputationLevel;
    }

    contextualTiles[i] = tile;
  }

  return contextualTiles;
};
