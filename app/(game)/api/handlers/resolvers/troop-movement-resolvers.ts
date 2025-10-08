import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/api';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';

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
  });
};

const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovement'>
> = async (_queryClient, _database, args) => {
  const { targetId: _targetId } = args;

  // const server = queryClient.getQueryData<Server>([serverCacheKey])!;
  //
  // const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  // const tileToOccupy = tiles.find(
  //   ({ id }) => id === targetId,
  // )! as OccupiedOccupiableTile;
  //
  // const playerVillages = queryClient.getQueryData<Village[]>([
  //   villagesCacheKey,
  // ])!;
  //
  // const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  // const player = players.find(({ id }) => id === PLAYER_ID)!;
  //
  // const slug = `v-${playerVillages.length + 1}`;
  //
  // const newVillage = playerVillageFactory({ player, tile: tileToOccupy, slug });
  //
  // queryClient.setQueryData<Village[]>([villagesCacheKey], (villages) => {
  //   return [...villages!, newVillage];
  // });
  //
  // queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
  //   return [...effects!, ...newVillageEffectsFactory(newVillage)];
  // });
  //
  // queryClient.setQueryData<Quest[]>([questsCacheKey], (quests) => {
  //   return [
  //     ...quests!,
  //     ...newVillageQuestsFactory(
  //       newVillage.id,
  //       server.playerConfiguration.tribe,
  //     ),
  //   ];
  // });
  //
  // queryClient.setQueryData<Tile[]>([mapCacheKey], (tiles) => {
  //   const tileToOccupy = tiles!.find(
  //     ({ id }) => id === targetId,
  //   )! as OccupiedOccupiableTile;
  //   tileToOccupy.ownedBy = PLAYER_ID;
  //   return tiles;
  // });
  //
  // queryClient.setQueryData<UnitResearch[]>(
  //   [unitResearchCacheKey],
  //   (unitResearch) => {
  //     const newVillageUnitResearch = newVillageUnitResearchFactory(
  //       newVillage.id,
  //       player.tribe,
  //     );
  //     return [...unitResearch!, ...newVillageUnitResearch];
  //   },
  // );
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
  });
};

const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovement'>
> = async (_queryClient, database, args) => {
  const { targetId, troops: incomingTroops } = args;

  database.transaction((db) => {
    const stmt = db.prepare(`
      INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
      VALUES ($unit_id, $amount, $tile_id, $source)
      ON CONFLICT(unit_id, tile_id, source_tile_id)
        DO UPDATE SET amount = amount + excluded.amount;
    `);

    for (const { unitId, amount, source } of incomingTroops) {
      stmt
        .bind({
          $unit_id: unitId,
          $amount: amount,
          $tile_id: targetId,
          $source: source,
        })
        .stepReset();
    }

    stmt.finalize();
  });
};

const returnMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (
  _queryClient,
  database,
  args,
) => {
  const { troops: incomingTroops } = args;

  database.transaction((db) => {
    const stmt = db.prepare(`
      INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
      VALUES ($unit_id, $amount, $tile_id, $source)
      ON CONFLICT(unit_id, tile_id, source_tile_id)
        DO UPDATE SET amount = amount + excluded.amount;
    `);

    for (const { unitId, amount, source, tileId } of incomingTroops) {
      stmt
        .bind({
          $unit_id: unitId,
          $amount: amount,
          $tile_id: tileId,
          $source: source,
        })
        .stepReset();
    }

    stmt.finalize();
  });
};

const relocationMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (
  _queryClient,
  database,
  args,
) => {
  const {
    villageId,
    targetId,
    troops: incomingTroops,
    startsAt,
    duration,
  } = args;

  database.transaction((db) => {
    const stmt = db.prepare(`
      INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
      VALUES ($unit_id, $amount, $tile_id, $source)
      ON CONFLICT(unit_id, tile_id, source_tile_id)
        DO UPDATE SET amount = amount + excluded.amount;
    `);

    for (const { unitId, amount } of incomingTroops) {
      stmt
        .bind({
          $unit_id: unitId,
          $amount: amount,
          $tile_id: targetId,
          $source: targetId,
        })
        .stepReset();
    }

    stmt.finalize();
  });

  const isHeroBeingRelocated = incomingTroops.some(
    ({ unitId }) => unitId === 'HERO',
  );

  if (isHeroBeingRelocated) {
    updateVillageResourcesAt(database, villageId, startsAt + duration);
    updateVillageResourcesAt(database, targetId, startsAt + duration);

    // queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    //   return effects!.map((effect) => {
    //     if (effect.source === 'hero') {
    //       return {
    //         ...effect,
    //         villageId: targetId,
    //       };
    //     }
    //
    //     return effect;
    //   });
    // });
  }
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
