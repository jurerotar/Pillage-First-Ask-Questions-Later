import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../resolver';

export const culturePointsCelebrationResolver: Resolver<
  GameEvent<'culturePointsCelebration'>
> = (_database, args) => {
  return {
    affectedVillageIds: [args.villageId],
    affectedTileIds: [],
  };
};
