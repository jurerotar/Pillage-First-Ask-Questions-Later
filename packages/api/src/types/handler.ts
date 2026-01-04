import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { paths } from '../../open-api';
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

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type Controller<
  TPath extends keyof paths,
  TMethod extends Method = 'get',
> = (
  database: DbFacade,
  args: {
    params: paths[TPath][TMethod] extends { parameters: { path: infer P } }
      ? P
      : Record<string, never>;
    query: paths[TPath][TMethod] extends { parameters: { query: infer Q } }
      ? Q
      : Record<string, never>;
    body: paths[TPath][TMethod] extends {
      requestBody: { content: { 'application/json': infer B } };
    }
      ? B
      : Record<string, never>;
  },
) => unknown;
