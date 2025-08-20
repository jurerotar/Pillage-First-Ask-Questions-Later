import type { Server } from 'app/interfaces/models/game/server';
import type sqlite3InitModule from '@sqlite.org/sqlite-wasm';

export type Database = Awaited<
  ReturnType<typeof sqlite3InitModule>
>['oo1']['OpfsDb']['prototype'];

export type Seeder = <TArgs = void>(
  database: Database,
  server: Server,
  args?: TArgs,
) => void;
