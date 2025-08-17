import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';
import { initializeServer } from 'app/(public)/(create-new-server)/utils/create-new-server';
import { dehydrate } from '@tanstack/react-query';
import createPreferencesTable from 'app/db/schemas/preferences-schema.sql?raw';
import createBookmarksTable from 'app/db/schemas/bookmarks-schema.sql?raw';
import createMapMarkersTable from 'app/db/schemas/map-markers-schema.sql?raw';
import createMapFiltersTable from 'app/db/schemas/map-filters-schema.sql?raw';
import createAdventurePointsTable from 'app/db/schemas/adventure-points-schema.sql?raw';
import createServerTable from 'app/db/schemas/server-schema.sql?raw';
import createPlayersTable from 'app/db/schemas/players-schema.sql?raw';
import createFactionsTable from 'app/db/schemas/factions-schema.sql?raw';
import createFactionReputationTable from 'app/db/schemas/faction-reputation-schema.sql?raw';
import { preferencesSeeder } from 'app/db/seeders/preferences-seeder';
import { bookmarksSeeder } from 'app/db/seeders/bookmarks-seeder';
import { mapFiltersSeeder } from 'app/db/seeders/map-filters-seeder';
import { adventurePointsSeeder } from 'app/db/seeders/adventure-points-seeder';
import { serverSeeder } from 'app/db/seeders/server-seeder';
import { factionsSeeder } from 'app/db/seeders/factions-seeder';
import { factionReputationSeeder } from 'app/db/seeders/faction-reputation-seeder';
import { prngMulberry32 } from 'ts-seedrandom';
import {
  generateNpcPlayers,
  userPlayerFactory,
} from 'app/factories/player-factory';
import { playersSeeder } from 'app/db/seeders/players-seeder';

export type CreateServerWorkerPayload = {
  server: Server;
};

self.addEventListener(
  'message',
  async (event: MessageEvent<CreateServerWorkerPayload>) => {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );

    const { server } = event.data;

    const sqlite3 = await sqlite3InitModule();
    const database = new sqlite3.oo1.OpfsDb(
      `/pillage-first-ask-questions-later/${server.slug}.sqlite3`,
      'c',
    );

    const _prng = prngMulberry32(server.seed);

    // TODO: When migration to SQLite is done, move this to seeder
    const player = userPlayerFactory(server);
    const npcPlayers = generateNpcPlayers(server);

    database.transaction((db) => {
      // Preferences
      db.exec(createPreferencesTable);
      preferencesSeeder(db);

      // Map filters
      db.exec(createMapFiltersTable);
      mapFiltersSeeder(db);

      // Map markers
      db.exec(createMapMarkersTable);

      // Bookmarks
      db.exec(createBookmarksTable);
      bookmarksSeeder(db);

      // Adventure points
      db.exec(createAdventurePointsTable);
      adventurePointsSeeder(db);

      // Server
      db.exec(createServerTable);
      serverSeeder(db, server);

      // Factions
      db.exec(createFactionsTable);
      factionsSeeder(db);

      // Faction reputations
      db.exec(createFactionReputationTable);
      factionReputationSeeder(db);

      // Players
      db.exec(createPlayersTable);
      playersSeeder(database, [player, ...npcPlayers]);
    });

    database.close();

    const serverState = await initializeServer(server);

    const rootHandle = await getRootHandle();

    await writeFileContents(rootHandle, server.slug, dehydrate(serverState));

    self.postMessage({ resolved: true });
    self.close();
  },
);
