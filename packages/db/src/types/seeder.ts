import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type Seeder = <TArgs = void>(
  database: DbFacade,
  server: Server,
  args?: TArgs,
) => void;
