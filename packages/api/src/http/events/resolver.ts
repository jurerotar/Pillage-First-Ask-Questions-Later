import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type ResolverResult = {
  affectedVillageIds: (Village['id'] | null)[];
};

export type Resolver<T extends GameEvent> = (
  database: DbFacade,
  args: T,
) => ResolverResult;
