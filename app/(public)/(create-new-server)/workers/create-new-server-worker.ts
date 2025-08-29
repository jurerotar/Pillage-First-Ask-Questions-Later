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
import createOasisBonusesTable from 'app/db/schemas/oasis-schema.sql?raw';
import createFactionReputationTable from 'app/db/schemas/faction-reputation-schema.sql?raw';
import createHeroesTable from 'app/db/schemas/heroes-schema.sql?raw';
import createHeroInventoriesTable from 'app/db/schemas/hero-inventories-schema.sql?raw';
import createHeroEquippedItemsTable from 'app/db/schemas/hero-equipped-items-schema.sql?raw';
import createWorldItemsTable from 'app/db/schemas/world-items-schema.sql?raw';
import createTroopsTable from 'app/db/schemas/troops-schema.sql?raw';
import createVillagesTable from 'app/db/schemas/villages-schema.sql?raw';
import createUnitResearchTable from 'app/db/schemas/unit-research-schema.sql?raw';
import createUnitImprovementTable from 'app/db/schemas/unit-improvements-schema.sql?raw';
import createBuildingFieldsTable from 'app/db/schemas/building-fields-schema.sql?raw';
import createResourceSitesTable from 'app/db/schemas/resource-sites-schema.sql?raw';
import createOasisBonusesIndexes from 'app/db/indexes/oasis-indexes.sql?raw';
import createPlayersIndexes from 'app/db/indexes/players-indexes.sql?raw';
import createTroopsIndexes from 'app/db/indexes/troops-indexes.sql?raw';
import createWorldItemsIndexes from 'app/db/indexes/world-items-indexes.sql?raw';
import { preferencesSeeder } from 'app/db/seeders/preferences-seeder';
import { bookmarksSeeder } from 'app/db/seeders/bookmarks-seeder';
import { mapFiltersSeeder } from 'app/db/seeders/map-filters-seeder';
import { adventurePointsSeeder } from 'app/db/seeders/adventure-points-seeder';
import { serverSeeder } from 'app/db/seeders/server-seeder';
import { factionsSeeder } from 'app/db/seeders/factions-seeder';
import { factionReputationSeeder } from 'app/db/seeders/faction-reputation-seeder';
import { playersSeeder } from 'app/db/seeders/players-seeder';
import { heroSeeder } from 'app/db/seeders/hero-seeder';
import { tilesSeeder } from 'app/db/seeders/tiles-seeder';
import { oasisSeeder } from 'app/db/seeders/oasis-seeder';
import { villageSeeder } from 'app/db/seeders/village-seeder';
import { occupiedOasisSeeder } from 'app/db/seeders/occupied-oasis-seeder';
import { resourceSitesSeeder } from 'app/db/seeders/resource-sites-seeder';
import { unitImprovementSeeder } from 'app/db/seeders/unit-improvement-seeder';
import { unitResearchSeeder } from 'app/db/seeders/unit-research-seeder';
import { troopSeeder } from 'app/db/seeders/troop-seeder';
import { worldItemsSeeder } from 'app/db/seeders/world-items-seeder';
import { buildingFieldsSeeder } from 'app/db/seeders/building-fields-seeder';

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

    database.exec('PRAGMA foreign_keys=OFF;');
    database.exec('PRAGMA journal_mode=OFF;');
    database.exec('PRAGMA synchronous=OFF;');
    database.exec('PRAGMA temp_store=MEMORY;');
    database.exec('PRAGMA cache_size=-20000;');

    database.transaction((db) => {
      // Preferences
      db.exec(createPreferencesTable);
      preferencesSeeder(db, server);

      // Map filters
      db.exec(createMapFiltersTable);
      mapFiltersSeeder(db, server);

      // Map markers
      db.exec(createMapMarkersTable);

      // Bookmarks
      db.exec(createBookmarksTable);
      bookmarksSeeder(db, server);

      // Adventure points
      db.exec(createAdventurePointsTable);
      adventurePointsSeeder(db, server);

      // Server
      db.exec(createServersTable);
      serverSeeder(db, server);

      // Factions
      db.exec(createFactionsTable);
      factionsSeeder(db, server);

      // Faction reputations
      db.exec(createFactionReputationTable);
      factionReputationSeeder(db, server);

      // Heroes
      db.exec(createHeroesTable);
      heroSeeder(db, server);

      // Hero equipped items
      db.exec(createHeroEquippedItemsTable);

      // Hero inventories
      db.exec(createHeroInventoriesTable);

      // Players
      db.exec(createPlayersTable);
      playersSeeder(db, server);
      db.exec(createPlayersIndexes);

      // Tiles
      db.exec(createTilesTable);
      tilesSeeder(db, server);

      // Oasis bonuses
      db.exec(createOasisBonusesTable);
      oasisSeeder(db, server);
      db.exec(createOasisBonusesIndexes);

      // Villages
      db.exec(createVillagesTable);
      villageSeeder(db, server);
      occupiedOasisSeeder(db, server);

      // Building fields
      db.exec(createBuildingFieldsTable);
      buildingFieldsSeeder(db, server);

      // Resource sites
      db.exec(createResourceSitesTable);
      resourceSitesSeeder(db, server);

      // World items
      db.exec(createWorldItemsTable);
      worldItemsSeeder(db, server);
      db.exec(createWorldItemsIndexes);

      // Troops
      db.exec(createTroopsTable);
      troopSeeder(db, server);
      db.exec(createTroopsIndexes);

      // Unit research
      db.exec(createUnitResearchTable);
      unitResearchSeeder(db, server);

      // Unit improvement
      db.exec(createUnitImprovementTable);
      unitImprovementSeeder(db, server);
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
