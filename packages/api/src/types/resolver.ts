import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '../facades/database-facade';

export type Resolver<T extends GameEvent> = (
  database: DbFacade,
  args: T,
) => void;
