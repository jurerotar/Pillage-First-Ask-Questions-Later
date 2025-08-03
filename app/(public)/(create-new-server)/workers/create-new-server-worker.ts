import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';
import { initializeServer } from 'app/(public)/(create-new-server)/utils/create-new-server';
import { dehydrate } from '@tanstack/react-query';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import createPreferencesTable from 'app/db/schemas/preferences-schema.sql?raw';
import createBookmarksTable from 'app/db/schemas/bookmarks-schema.sql?raw';
import createMapMarkersTable from 'app/db/schemas/map-markers-schema.sql?raw';
import createMapFiltersTable from 'app/db/schemas/map-filters-schema.sql?raw';
import createAdventurePointsTable from 'app/db/schemas/adventure-points-schema.sql?raw';
import createServerTable from 'app/db/schemas/server-schema.sql?raw';
import { preferencesSeeder } from 'app/db/seeders/preferences-seeder';
import { bookmarksSeeder } from 'app/db/seeders/bookmarks-seeder';
import { mapFiltersSeeder } from 'app/db/seeders/map-filters-seeder';
import { adventurePointsSeeder } from 'app/db/seeders/adventure-points-seeder';
import { serverSeeder } from 'app/db/seeders/server-seeder';

export type CreateServerWorkerPayload = {
  server: Server;
};

self.addEventListener(
  'message',
  async (event: MessageEvent<CreateServerWorkerPayload>) => {
    const { server } = event.data;

    const sqlite3 = await sqlite3InitModule();
    const database = new sqlite3.oo1.OpfsDb(
      `/pillage-first-ask-questions-later/${server.slug}.sqlite3`,
      'c',
    );

    // Preferences
    database.exec(createPreferencesTable);
    preferencesSeeder(database);

    // Map filters
    database.exec(createMapFiltersTable);
    mapFiltersSeeder(database);

    // Map markers
    database.exec(createMapMarkersTable);

    // Bookmarks
    database.exec(createBookmarksTable);
    bookmarksSeeder(database);

    // Adventure points
    database.exec(createAdventurePointsTable);
    adventurePointsSeeder(database);

    // Server
    database.exec(createServerTable);
    serverSeeder(database, server);

    const serverState = await initializeServer(server);

    const rootHandle = await getRootHandle();

    await writeFileContents(rootHandle, server.slug, dehydrate(serverState));

    self.postMessage({ resolved: true });
    self.close();
  },
);
