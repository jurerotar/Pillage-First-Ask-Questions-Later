import type { Server } from 'app/interfaces/models/game/server';
import { getRootHandle, writeFileContents } from 'app/utils/opfs';
import { initializeServer } from 'app/(public)/(create-new-server)/utils/create-new-server';
import { dehydrate } from '@tanstack/react-query';
import createPreferencesTable from 'app/db/schemas/preferences-schema.sql?raw';
import createBookmarksTable from 'app/db/schemas/bookmarks-schema.sql?raw';
import createMapMarkersTable from 'app/db/schemas/map-markers-schema.sql?raw';
import createMapFiltersTable from 'app/db/schemas/map-filters-schema.sql?raw';
import createAdventurePointsTable from 'app/db/schemas/adventure-points-schema.sql?raw';
import createServersTable from 'app/db/schemas/servers-schema.sql?raw';
import createPlayersTable from 'app/db/schemas/players-schema.sql?raw';
import createFactionsTable from 'app/db/schemas/factions-schema.sql?raw';
import createTilesTable from 'app/db/schemas/tiles-schema.sql?raw';
import createOasisBonusesTable from 'app/db/schemas/oasis-bonuses-schema.sql?raw';
import createTileOwnershipsTable from 'app/db/schemas/tile-ownerships-schema.sql?raw';
import createFactionReputationTable from 'app/db/schemas/faction-reputation-schema.sql?raw';
import createHeroesTable from 'app/db/schemas/heroes-schema.sql?raw';
import createHeroInventoriesTable from 'app/db/schemas/hero-inventories-schema.sql?raw';
import createHeroEquippedItemsTable from 'app/db/schemas/hero-equipped-items-schema.sql?raw';
import createWorldItemsTable from 'app/db/schemas/world-items-schema.sql?raw';
import createTroopsTable from 'app/db/schemas/troops-schema.sql?raw';
import oasisBonusesIndexes from 'app/db/indexes/oasis-bonuses-indexes.sql?raw';
import playersIndexes from 'app/db/indexes/players-indexes.sql?raw';
import tileOwnershipsIndexes from 'app/db/indexes/tile-ownerships-indexes.sql?raw';
import tilesIndexes from 'app/db/indexes/tiles-indexes.sql?raw';
import troopsIndexes from 'app/db/indexes/troops-indexes.sql?raw';
import worldItemsIndexes from 'app/db/indexes/world-items-indexes.sql?raw';
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
  playerFactory,
} from 'app/factories/player-factory';
import { playersSeeder } from 'app/db/seeders/players-seeder';
import { heroSeeder } from 'app/db/seeders/hero-seeder';
import { tilesSeeder } from 'app/db/seeders/tiles-seeder';

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
    const player = playerFactory(server);
    const npcPlayers = generateNpcPlayers(server);

    database.exec('PRAGMA foreign_keys=OFF;');
    database.exec('PRAGMA journal_mode=OFF;');
    database.exec('PRAGMA synchronous=OFF;');
    database.exec('PRAGMA temp_store=MEMORY;');
    database.exec('PRAGMA cache_size=-20000;');

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
      db.exec(createServersTable);
      serverSeeder(db, server);

      // Factions
      db.exec(createFactionsTable);
      factionsSeeder(db);

      // Faction reputations
      db.exec(createFactionReputationTable);
      factionReputationSeeder(db);

      // Heroes
      db.exec(createHeroesTable);
      heroSeeder(db);

      // Hero equipped items
      db.exec(createHeroEquippedItemsTable);

      // Hero inventories
      db.exec(createHeroInventoriesTable);

      // Players
      db.exec(createPlayersTable);
      playersSeeder(db, [player, ...npcPlayers]);
      db.exec(playersIndexes);

      // Tiles
      db.exec(createTilesTable);
      tilesSeeder(db, server);
      db.exec(tilesIndexes);

      // Oasis bonuses
      db.exec(createOasisBonusesTable);
      db.exec(oasisBonusesIndexes);

      // Tile ownerships
      db.exec(createTileOwnershipsTable);
      db.exec(tileOwnershipsIndexes);

      // World items
      db.exec(createWorldItemsTable);
      db.exec(worldItemsIndexes);

      // Troops
      db.exec(createTroopsTable);
      db.exec(troopsIndexes);

      // Unit research
      // db.exec(createUnitResearchTable);
    });

    database.exec('PRAGMA foreign_keys=ON;');
    database.exec('PRAGMA synchronous=NORMAL;');

    database.close();

    const serverState = await initializeServer(server);

    const rootHandle = await getRootHandle();

    await writeFileContents(rootHandle, server.slug, dehydrate(serverState));

    self.postMessage({ resolved: true });
    self.close();
  },
);
