import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type sqlite3InitModule from '@sqlite.org/sqlite-wasm';

export type Resolver<T extends GameEvent> = (
  queryClient: QueryClient,
  database: Database,
  args: T,
) => Promise<void>;

export type Point = {
  x: number;
  y: number;
};

export type Database = Awaited<
  ReturnType<typeof sqlite3InitModule>
>['oo1']['OpfsDb']['prototype'];
