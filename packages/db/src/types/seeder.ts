import type { Database } from '@pillage-first/types/database';
import type { Server } from '@pillage-first/types/models/server';

export type Seeder = <TArgs = void>(
  database: Database,
  server: Server,
  args?: TArgs,
) => void;
