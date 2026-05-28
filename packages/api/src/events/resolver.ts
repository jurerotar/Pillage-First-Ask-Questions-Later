import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type Resolver<T extends GameEvent> = (
  database: DbFacade,
  args: T,
) => void;
