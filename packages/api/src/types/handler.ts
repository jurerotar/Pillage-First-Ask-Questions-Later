import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '../facades/database-facade';

export type Resolver<T extends GameEvent> = (
  database: DbFacade,
  args: T,
) => void;

type ParamType<T extends string> = T extends
  | 'villageId'
  | 'playerId'
  | 'tileId'
  | 'oasisId'
  ? number
  : string;

type ApiHandlerArgs<TBody, TParams extends string> = {
  body: TBody;
  params: {
    [K in TParams]: ParamType<K>;
  };
};

export type ApiHandler<
  TParams extends string = '',
  TBody = Record<string, unknown>,
> = (database: DbFacade, args: ApiHandlerArgs<TBody, TParams>) => unknown;
