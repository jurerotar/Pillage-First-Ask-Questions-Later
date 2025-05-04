import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { modifyTroops, setReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/troops';
import {
  effectsCacheKey,
  mapCacheKey,
  playersCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
  serverCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import { createEventFn, updateVillageResources } from 'app/(game)/(village-slug)/hooks/utils/events';
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

  // All settlers are lost on finding a new village, so we just don't add them back
  if (movementType !== 'find-new-village') {
    queryClient.setQueryData<Troop[]>([playerTroopsCacheKey], (troops) => {
      const troopsWithSourceAndTile = incomingTroops.map((troop) => {
        // On relocation update source, so that units can be used from new village
        if (movementType === 'relocation') {
          return {
            ...troop,
            source: targetId,
            tileId: targetId,
          };
        }

        if (movementType === 'reinforcements') {
          return {
            ...troop,
            tileId: targetId,
          };
        }

        return troop;
      });

      return modifyTroops(troops!, troopsWithSourceAndTile, 'add');
    });
  }

  if (movementType === 'find-new-village') {
    await findNewVillageResolver(queryClient, args);
  }

  // In case we're relocation a hero, we need to unset all hero effects from origin village and re-add them to the target village
  if (movementType === 'relocation') {
    const isHeroBeingRelocated = incomingTroops.some(({ unitId }) => unitId === 'HERO');

    if (isHeroBeingRelocated) {
      updateVillageResources(queryClient, villageId, [0, 0, 0, 0], 'add');
      updateVillageResources(queryClient, targetId, [0, 0, 0, 0], 'add');

      queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
        return effects!.map((effect) => {
          if (effect.source === 'hero') {
            return {
              ...effect,
              villageId: targetId,
            };
          }

          return effect;
        });
      });
    }
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
