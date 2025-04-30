import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { addTroops, setReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/troops';
import {
  effectsCacheKey,
  mapCacheKey,
  playersCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
  serverCacheKey,
  troopsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import { createEventFn } from 'app/(game)/(village-slug)/hooks/utils/events';
import { calculateTravelDuration } from 'app/(game)/(village-slug)/utils/troop-movements';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Server } from 'app/interfaces/models/game/server';
import type { OccupiedOccupiableTile, Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import type { Player } from 'app/interfaces/models/game/player';
import { userVillageFactory } from 'app/factories/village-factory';
import { newVillageEffectsFactory } from 'app/factories/effect-factory';
import type { Quest } from 'app/interfaces/models/game/quest';
import { newVillageQuestsFactory } from 'app/factories/quest-factory';

export const troopMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId, targetId, troops: incomingTroops, movementType } = args;

  // All settlers are lost on finding a new village
  if (movementType !== 'find-new-village') {
    queryClient.setQueryData<Troop[]>([troopsCacheKey], (troops) => {
      return addTroops(troops!, incomingTroops);
    });
  }

  if (movementType === 'find-new-village') {
    await findNewVillageResolver(queryClient, args);
  }

  // We don't create reports on troop return
  if (movementType !== 'return') {
    return;
  }

  const relocationReport = generateTroopMovementReport({
    villageId,
    targetId,
    movementType,
    troops: incomingTroops,
  });

  setReport(queryClient, relocationReport);
};

export const offensiveTroopMovementResolver: Resolver<GameEvent<'offensiveTroopMovement'>> = async (queryClient, args) => {
  const { villageId, targetId, troops, startsAt, duration } = args;

  // TODO: Add combat calc

  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  await createEventFn<'troopMovement'>(queryClient, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    startsAt: startsAt + duration,
    duration: calculateTravelDuration({
      villageId,
      targetId,
      troops,
      effects,
    }),
  });
};

export const oasisOccupationTroopMovementResolver: Resolver<GameEvent<'offensiveTroopMovement'>> = async (queryClient, args) => {
  const { villageId, targetId, troops, startsAt, duration } = args;

  // TODO: Add combat calc

  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  await createEventFn<'troopMovement'>(queryClient, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    startsAt: startsAt + duration,
    duration: calculateTravelDuration({
      villageId,
      targetId,
      troops,
      effects,
    }),
  });
};

export const findNewVillageResolver: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { targetId } = args;

  const server = queryClient.getQueryData<Server>([serverCacheKey])!;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const tileToOccupy = tiles.find(({ id }) => id === targetId)! as OccupiedOccupiableTile;

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

  queryClient.setQueryData<Quest[]>([questsCacheKey], (quests) => {
    return [...quests!, ...newVillageQuestsFactory(newVillage.id, server.playerConfiguration.tribe)];
  });

  queryClient.setQueryData<Tile[]>([mapCacheKey], (tiles) => {
    const tileToOccupy = tiles!.find(({ id }) => id === targetId)! as OccupiedOccupiableTile;
    tileToOccupy.ownedBy = 'player';
    return tiles;
  });
};
