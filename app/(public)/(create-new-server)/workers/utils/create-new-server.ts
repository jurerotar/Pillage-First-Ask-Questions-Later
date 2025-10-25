import type { Database } from 'app/interfaces/db';
import type { Server } from 'app/interfaces/models/game/server';
import createUnitTrainingHistoryTable from 'app/db/schemas/statistics/unit-training-history-schema.sql?raw';
import createBuildingLevelChangeHistoryTable from 'app/db/schemas/statistics/building-level-change-history-schema.sql?raw';
import createPreferencesTable from 'app/db/schemas/preferences-schema.sql?raw';
import createResourceFieldCompositionsTable from 'app/db/schemas/resource-field-compositions-schema.sql?raw';
import createEffectIdsTable from 'app/db/schemas/effect-ids-schema.sql?raw';
import createBookmarksTable from 'app/db/schemas/bookmarks-schema.sql?raw';
import createMapMarkersTable from 'app/db/schemas/map-markers-schema.sql?raw';
import createMapFiltersTable from 'app/db/schemas/map-filters-schema.sql?raw';
import createEventsTable from 'app/db/schemas/events-schema.sql?raw';
import createHeroAdventuresTable from 'app/db/schemas/hero-adventures-schema.sql?raw';
import createServersTable from 'app/db/schemas/servers-schema.sql?raw';
import createPlayersTable from 'app/db/schemas/players-schema.sql?raw';
import createFactionsTable from 'app/db/schemas/factions-schema.sql?raw';
import createTilesTable from 'app/db/schemas/tiles-schema.sql?raw';
import createOasisBonusesTable from 'app/db/schemas/oasis-schema.sql?raw';
import createOasisOccupiableByTable from 'app/db/schemas/oasis-occupiable-by-schema.sql?raw';
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
import createQuestsTable from 'app/db/schemas/quests-schema.sql?raw';
import createResourceSitesTable from 'app/db/schemas/resource-sites-schema.sql?raw';
import createEffectsTable from 'app/db/schemas/effects-schema.sql?raw';
import createOasisBonusesIndexes from 'app/db/indexes/oasis-indexes.sql?raw';
import createPlayersIndexes from 'app/db/indexes/players-indexes.sql?raw';
import createTroopsIndexes from 'app/db/indexes/troops-indexes.sql?raw';
import createEffectsIndexes from 'app/db/indexes/effects-indexes.sql?raw';
import createTilesIndexes from 'app/db/indexes/tiles-indexes.sql?raw';
import { preferencesSeeder } from 'app/db/seeders/preferences-seeder';
import { mapFiltersSeeder } from 'app/db/seeders/map-filters-seeder';
import { serverSeeder } from 'app/db/seeders/server-seeder';
import { factionsSeeder } from 'app/db/seeders/factions-seeder';
import { factionReputationSeeder } from 'app/db/seeders/faction-reputation-seeder';
import { heroSeeder } from 'app/db/seeders/hero-seeder';
import { heroAdventuresSeeder } from 'app/db/seeders/hero-adventures-seeder';
import { playersSeeder } from 'app/db/seeders/players-seeder';
import { tilesSeeder } from 'app/db/seeders/tiles-seeder';
import { oasisSeeder } from 'app/db/seeders/oasis-seeder';
import { villageSeeder } from 'app/db/seeders/village-seeder';
import { occupiedOasisSeeder } from 'app/db/seeders/occupied-oasis-seeder';
import { bookmarksSeeder } from 'app/db/seeders/bookmarks-seeder';
import { buildingFieldsSeeder } from 'app/db/seeders/building-fields-seeder';
import { troopSeeder } from 'app/db/seeders/troop-seeder';
import { effectsSeeder } from 'app/db/seeders/effects-seeder';
import { resourceSitesSeeder } from 'app/db/seeders/resource-sites-seeder';
import { worldItemsSeeder } from 'app/db/seeders/world-items-seeder';
import { unitResearchSeeder } from 'app/db/seeders/unit-research-seeder';
import { unitImprovementSeeder } from 'app/db/seeders/unit-improvement-seeder';
import { questsSeeder } from 'app/db/seeders/quests-seeder';
import { resourceFieldCompositionsSeeder } from 'app/db/seeders/resource-field-compositions-seeder';
import { effectIdsSeeder } from 'app/db/seeders/effect-ids-seeder';
import { eventsSeeder } from 'app/db/seeders/events-seeder';
import { oasisOccupiableBySeeder } from 'app/db/seeders/oasis-occupiable-by-seeder';

export const createNewServer = (database: Database, server: Server): void => {
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
