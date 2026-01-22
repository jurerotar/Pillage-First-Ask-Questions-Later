import type { OpfsSAHPoolDatabase } from '@sqlite.org/sqlite-wasm';
import type { Server } from '@pillage-first/types/models/server';

export type Seeder = <TArgs = void>(
  database: OpfsSAHPoolDatabase,
  server: Server,
  args?: TArgs,
) => void;
