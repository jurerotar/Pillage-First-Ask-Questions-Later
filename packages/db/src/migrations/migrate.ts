import type { OpfsSAHPoolDatabase } from '@sqlite.org/sqlite-wasm';
import type { Server } from '@pillage-first/types/models/server';
import createEffectsIndexes from '../indexes/effects-indexes.sql?raw';
import createOasisBonusesIndexes from '../indexes/oasis-indexes.sql?raw';
import createOasisOccupiableByIndexes from '../indexes/oasis-occupiable-by-indexes.sql?raw';
import createPlayersIndexes from '../indexes/players-indexes.sql?raw';
import createTilesIndexes from '../indexes/tiles-indexes.sql?raw';
import createTroopsIndexes from '../indexes/troops-indexes.sql?raw';
import createBookmarksTable from '../schemas/bookmarks-schema.sql?raw';
import createBuildingFieldsTable from '../schemas/building-fields-schema.sql?raw';
import createEffectIdsTable from '../schemas/effect-ids-schema.sql?raw';
import createEffectsTable from '../schemas/effects-schema.sql?raw';
import createEventsTable from '../schemas/events-schema.sql?raw';
import createFactionReputationTable from '../schemas/faction-reputation-schema.sql?raw';
import createFactionsTable from '../schemas/factions-schema.sql?raw';
import createHeroAdventuresTable from '../schemas/hero-adventures-schema.sql?raw';
import createHeroEquippedItemsTable from '../schemas/hero-equipped-items-schema.sql?raw';
import createHeroInventoriesTable from '../schemas/hero-inventories-schema.sql?raw';
import createHeroesTable from '../schemas/heroes-schema.sql?raw';
import createMapFiltersTable from '../schemas/map-filters-schema.sql?raw';
import createMapMarkersTable from '../schemas/map-markers-schema.sql?raw';
import createOasisOccupiableByTable from '../schemas/oasis-occupiable-by-schema.sql?raw';
import createOasisBonusesTable from '../schemas/oasis-schema.sql?raw';
import createPlayersTable from '../schemas/players-schema.sql?raw';
import createPreferencesTable from '../schemas/preferences-schema.sql?raw';
import createQuestsTable from '../schemas/quests-schema.sql?raw';
import createResourceFieldCompositionsTable from '../schemas/resource-field-compositions-schema.sql?raw';
import createResourceSitesTable from '../schemas/resource-sites-schema.sql?raw';
import createServersTable from '../schemas/servers-schema.sql?raw';
import createBuildingLevelChangeHistoryTable from '../schemas/statistics/building-level-change-history-schema.sql?raw';
import createUnitTrainingHistoryTable from '../schemas/statistics/unit-training-history-schema.sql?raw';
import createTilesTable from '../schemas/tiles-schema.sql?raw';
import createTroopsTable from '../schemas/troops-schema.sql?raw';
import createUnitImprovementTable from '../schemas/unit-improvements-schema.sql?raw';
import createUnitResearchTable from '../schemas/unit-research-schema.sql?raw';
import createVillagesTable from '../schemas/villages-schema.sql?raw';
import createWorldItemsTable from '../schemas/world-items-schema.sql?raw';
import { bookmarksSeeder } from '../seeders/bookmarks-seeder';
import { buildingFieldsSeeder } from '../seeders/building-fields-seeder';
import { effectIdsSeeder } from '../seeders/effect-ids-seeder';
import { effectsSeeder } from '../seeders/effects-seeder';
import { eventsSeeder } from '../seeders/events-seeder';
import { factionReputationSeeder } from '../seeders/faction-reputation-seeder';
import { factionsSeeder } from '../seeders/factions-seeder';
import { guaranteedCroppersSeeder } from '../seeders/guaranteed-croppers-seeder';
import { heroAdventuresSeeder } from '../seeders/hero-adventures-seeder';
import { heroSeeder } from '../seeders/hero-seeder';
import { mapFiltersSeeder } from '../seeders/map-filters-seeder';
import { oasisOccupiableBySeeder } from '../seeders/oasis-occupiable-by-seeder';
import { oasisSeeder } from '../seeders/oasis-seeder';
import { occupiedOasisSeeder } from '../seeders/occupied-oasis-seeder';
import { playersSeeder } from '../seeders/players-seeder';
import { preferencesSeeder } from '../seeders/preferences-seeder';
import { questsSeeder } from '../seeders/quests-seeder';
import { resourceFieldCompositionsSeeder } from '../seeders/resource-field-compositions-seeder';
import { resourceSitesSeeder } from '../seeders/resource-sites-seeder';
import { serverSeeder } from '../seeders/server-seeder';
import { tilesSeeder } from '../seeders/tiles-seeder';
import { troopSeeder } from '../seeders/troop-seeder';
import { unitImprovementSeeder } from '../seeders/unit-improvement-seeder';
import { unitResearchSeeder } from '../seeders/unit-research-seeder';
import { villageSeeder } from '../seeders/village-seeder';
import { worldItemsSeeder } from '../seeders/world-items-seeder';

export const migrateAndSeed = (
  database: OpfsSAHPoolDatabase,
  server: Server,
): void => {
  database.transaction((db) => {
    // Statistics
    db.exec(createUnitTrainingHistoryTable);
    db.exec(createBuildingLevelChangeHistoryTable);

    // Preferences
    db.exec(createPreferencesTable);
    preferencesSeeder(db, server);

    // Map filters
    db.exec(createMapFiltersTable);
    mapFiltersSeeder(db, server);

    // Map markers
    db.exec(createMapMarkersTable);

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

    // Hero adventures
    db.exec(createHeroAdventuresTable);
    heroAdventuresSeeder(db, server);

    // Hero equipped items
    db.exec(createHeroEquippedItemsTable);

    // Hero inventories
    db.exec(createHeroInventoriesTable);

    // Players
    db.exec(createPlayersTable);
    playersSeeder(db, server);
    db.exec(createPlayersIndexes);

    // RFC reference table
    db.exec(createResourceFieldCompositionsTable);
    resourceFieldCompositionsSeeder(db, server);

    // Tiles
    db.exec(createTilesTable);
    tilesSeeder(db, server);
    db.exec(createTilesIndexes);

    // Oasis bonuses
    db.exec(createOasisBonusesTable);
    oasisSeeder(db, server);
    db.exec(createOasisBonusesIndexes);

    // Oasis-occupiable-by
    db.exec(createOasisOccupiableByTable);
    oasisOccupiableBySeeder(db, server);
    db.exec(createOasisOccupiableByIndexes);

    // Guaranteed croppers
    guaranteedCroppersSeeder(db, server);

    // Villages
    db.exec(createVillagesTable);
    villageSeeder(db, server);
    occupiedOasisSeeder(db, server);

    // Bookmarks
    db.exec(createBookmarksTable);
    bookmarksSeeder(db, server);

    // Building fields
    db.exec(createBuildingFieldsTable);
    buildingFieldsSeeder(db, server);

    // Troops
    db.exec(createTroopsTable);
    troopSeeder(db, server);
    db.exec(createTroopsIndexes);

    // Effect ids
    db.exec(createEffectIdsTable);
    effectIdsSeeder(db, server);

    // Effects
    db.exec(createEffectsTable);
    effectsSeeder(db, server);
    db.exec(createEffectsIndexes);

    // Resource sites
    db.exec(createResourceSitesTable);
    resourceSitesSeeder(db, server);

    // World items
    db.exec(createWorldItemsTable);
    worldItemsSeeder(db, server);

    // Unit research
    db.exec(createUnitResearchTable);
    unitResearchSeeder(db, server);

    // Unit improvement
    db.exec(createUnitImprovementTable);
    unitImprovementSeeder(db, server);

    // Quests
    db.exec(createQuestsTable);
    questsSeeder(db, server);

    // Events
    db.exec(createEventsTable);
    eventsSeeder(db, server);

    db.exec('ANALYZE;');
  });
};
