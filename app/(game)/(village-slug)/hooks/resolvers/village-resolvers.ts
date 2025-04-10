import type { Resolver } from 'app/interfaces/models/common';
import { userVillageFactory } from 'app/factories/village-factory';
import type { Player } from 'app/interfaces/models/game/player';
import { effectsCacheKey, mapCacheKey, playersCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Village } from 'app/interfaces/models/game/village';
import type { OccupiedOccupiableTile, Tile } from 'app/interfaces/models/game/tile';
import type { Effect } from 'app/interfaces/models/game/effect';
import { newVillageEffectsFactory } from 'app/factories/effect-factory';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const findNewVillageResolver: Resolver<GameEvent<'findNewVillage'>> = async (queryClient, args) => {
  const { targetTileId } = args;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const tileToOccupy = tiles.find(({ id }) => id === targetTileId)! as OccupiedOccupiableTile;

  const playerVillages = queryClient.getQueryData<Village[]>([playerVillagesCacheKey])!;

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const player = players.find(({ id }) => id === 'player')!;

  const slug = `v-${playerVillages.length + 1}`;

  const newVillage = userVillageFactory({ player, tile: tileToOccupy, slug });

  queryClient.setQueryData<Village[]>([playerVillagesCacheKey], (villages) => {
    return [...villages!, newVillage];
  });

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    return [...effects!, ...newVillageEffectsFactory(newVillage)];
  });

  queryClient.setQueryData<Tile[]>([mapCacheKey], (tiles) => {
    const tileToOccupy = tiles!.find(({ id }) => id === targetTileId)! as OccupiedOccupiableTile;
    tileToOccupy.ownedBy = 'player';
    return tiles;
  });
};
