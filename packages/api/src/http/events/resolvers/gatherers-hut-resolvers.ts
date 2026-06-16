import { calculateGatherersHutGatheringResources } from '@pillage-first/game-assets/utils/gatherers-hut';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { addTroops } from '../../../utils/troops';
import { addVillageResourcesAt } from '../../../utils/village';
import type { Resolver } from '../resolver';

export const gatherersHutGatheringTripResolver: Resolver<
  GameEvent<'gatherersHutGatheringTrip'>
> = (database, args) => {
  const { resolvesAt, troops, villageId } = args;

  let sentTroopAmount = 0;

  for (const troop of troops) {
    sentTroopAmount += troop.amount;
  }

  addTroops(database, troops);

  addVillageResourcesAt(
    database,
    villageId,
    resolvesAt,
    calculateGatherersHutGatheringResources(sentTroopAmount),
  );

  return {
    affectedVillageIds: [villageId],
  };
};
