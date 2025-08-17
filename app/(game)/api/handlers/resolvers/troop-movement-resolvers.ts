import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { modifyTroops } from 'app/(game)/api/handlers/resolvers/utils/troops';
import {
  effectsCacheKey,
  mapCacheKey,
  playersCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
  serverCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Server } from 'app/interfaces/models/game/server';
import type {
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import type { Player } from 'app/interfaces/models/game/player';
import { playerVillageFactory } from 'app/factories/village-factory';
import { newVillageEffectsFactory } from 'app/factories/effect-factory';
import type { Quest } from 'app/interfaces/models/game/quest';
import { newVillageQuestsFactory } from 'app/factories/quest-factory';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import { newVillageUnitResearchFactory } from 'app/factories/unit-research-factory';
import { PLAYER_ID } from 'app/constants/player';

const attackMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (
  queryClient,
  database,
  args,
) => {
  const { villageId, targetId, troops } = args;

  // TODO: Add combat calc

  await createEvent<'troopMovement'>(queryClient, database, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    cachesToClearOnResolve: [playerVillagesCacheKey, playerTroopsCacheKey],
  });
};

const raidMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (
  queryClient,
  database,
  args,
) => {
  const { villageId, targetId, troops } = args;

  // TODO: Add combat calc

  await createEvent<'troopMovement'>(queryClient, database, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    cachesToClearOnResolve: [playerVillagesCacheKey, playerTroopsCacheKey],
  });
};

const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovement'>
> = async (queryClient, _database, args) => {
  const { targetId } = args;

  const server = queryClient.getQueryData<Server>([serverCacheKey])!;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const tileToOccupy = tiles.find(
    ({ id }) => id === targetId,
  )! as OccupiedOccupiableTile;

  const playerVillages = queryClient.getQueryData<Village[]>([
    villagesCacheKey,
  ])!;

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const player = players.find(({ id }) => id === PLAYER_ID)!;

  const slug = `v-${playerVillages.length + 1}`;

  const newVillage = playerVillageFactory({ player, tile: tileToOccupy, slug });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (villages) => {
    return [...villages!, newVillage];
  });

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    return [...effects!, ...newVillageEffectsFactory(newVillage)];
  });

  queryClient.setQueryData<Quest[]>([questsCacheKey], (quests) => {
    return [
      ...quests!,
      ...newVillageQuestsFactory(
        newVillage.id,
        server.playerConfiguration.tribe,
      ),
    ];
  });

  queryClient.setQueryData<Tile[]>([mapCacheKey], (tiles) => {
    const tileToOccupy = tiles!.find(
      ({ id }) => id === targetId,
    )! as OccupiedOccupiableTile;
    tileToOccupy.ownedBy = PLAYER_ID;
    return tiles;
  });

  queryClient.setQueryData<UnitResearch[]>(
    [unitResearchCacheKey],
    (unitResearch) => {
      const newVillageUnitResearch = newVillageUnitResearchFactory(
        newVillage.id,
        player.tribe,
      );
      return [...unitResearch!, ...newVillageUnitResearch];
    },
  );
};

const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovement'>
> = async (queryClient, database, args) => {
  const { villageId, targetId, troops } = args;

  // TODO: Add combat calc

  await createEvent<'troopMovement'>(queryClient, database, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    cachesToClearOnResolve: [
      playerVillagesCacheKey,
      playerTroopsCacheKey,
      effectsCacheKey,
    ],
  });
};

const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovement'>
> = async (queryClient, _database, args) => {
  const { targetId, troops: incomingTroops } = args;

  queryClient.setQueryData<Troop[]>([playerTroopsCacheKey], (troops) => {
    const troopsWithSourceAndTile = incomingTroops.map((troop) => ({
      ...troop,
      tileId: targetId,
    }));
    return modifyTroops(troops!, troopsWithSourceAndTile, 'add');
  });

  // const relocationReport = generateTroopMovementReport({
  //   villageId,
  //   targetId,
  //   movementType,
  //   troops: incomingTroops,
  // });
  //
  // setReport(queryClient, relocationReport);
};

const returnMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (
  queryClient,
  _database,
  args,
) => {
  const { troops: incomingTroops } = args;
  queryClient.setQueryData<Troop[]>([playerTroopsCacheKey], (troops) => {
    return modifyTroops(troops!, incomingTroops, 'add');
  });
};

const relocationMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (
  queryClient,
  _database,
  args,
) => {
  const {
    villageId,
    targetId,
    troops: incomingTroops,
    startsAt,
    duration,
  } = args;

  queryClient.setQueryData<Troop[]>([playerTroopsCacheKey], (troops) => {
    const troopsWithSourceAndTile = incomingTroops.map((troop) => ({
      ...troop,
      source: targetId,
      tileId: targetId,
    }));
    return modifyTroops(troops!, troopsWithSourceAndTile, 'add');
  });

  const isHeroBeingRelocated = incomingTroops.some(
    ({ unitId }) => unitId === 'HERO',
  );

  if (isHeroBeingRelocated) {
    updateVillageResourcesAt(queryClient, villageId, startsAt + duration);
    updateVillageResourcesAt(queryClient, targetId, startsAt + duration);

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

  // const relocationReport = generateTroopMovementReport({
  //   villageId,
  //   targetId,
  //   movementType,
  //   troops: incomingTroops,
  // });

  // setReport(queryClient, relocationReport);
};

export const troopMovementResolver: Resolver<
  GameEvent<'troopMovement'>
> = async (queryClient, database, args) => {
  const { movementType } = args;

  switch (movementType) {
    case 'attack': {
      await attackMovementResolver(queryClient, database, args);
      break;
    }
    case 'find-new-village': {
      await findNewVillageMovementResolver(queryClient, database, args);
      break;
    }
    case 'oasis-occupation': {
      await oasisOccupationMovementResolver(queryClient, database, args);
      break;
    }
    case 'raid': {
      await raidMovementResolver(queryClient, database, args);
      break;
    }
    case 'reinforcements': {
      await reinforcementMovementResolver(queryClient, database, args);
      break;
    }
    case 'relocation': {
      await relocationMovementResolver(queryClient, database, args);
      break;
    }
    case 'return': {
      await returnMovementResolver(queryClient, database, args);
      break;
    }
  }
};
