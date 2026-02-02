import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import createEffectsIndexes from '../indexes/effects-indexes.sql?raw';
import createOasisBonusesIndexes from '../indexes/oasis-indexes.sql?raw';
import createOasisOccupiableByIndexes from '../indexes/oasis-occupiable-by-indexes.sql?raw';
import createPlayersIndexes from '../indexes/players-indexes.sql?raw';
import createTilesIndexes from '../indexes/tiles-indexes.sql?raw';
import createTroopsIndexes from '../indexes/troops-indexes.sql?raw';
import createBookmarksTable from '../schemas/bookmarks-schema.sql?raw';
import createBuildingFieldsTable from '../schemas/building-fields-schema.sql?raw';
import createDeveloperSettingsTable from '../schemas/developer-settings-schema.sql?raw';
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
import { developerSettingsSeeder } from '../seeders/developer-settings-seeder';
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

export const migrateAndSeed = (database: DbFacade, server: Server): void => {
  database.transaction((db) => {
    // Statistics
    db.exec({ sql: createUnitTrainingHistoryTable });
    db.exec({ sql: createBuildingLevelChangeHistoryTable });

    // Preferences
    db.exec({ sql: createPreferencesTable });
    preferencesSeeder(db);

    // Developer settings
    db.exec({ sql: createDeveloperSettingsTable });
    developerSettingsSeeder(db);

    // Map filters
    db.exec({ sql: createMapFiltersTable });
    mapFiltersSeeder(db);

    // Map markers
    db.exec({ sql: createMapMarkersTable });

    // Server
    db.exec({ sql: createServersTable });
    serverSeeder(db, server);

    // Factions
    db.exec({ sql: createFactionsTable });
    factionsSeeder(db);

    // Faction reputations
    db.exec({ sql: createFactionReputationTable });
    factionReputationSeeder(db);

    // Heroes
    db.exec({ sql: createHeroesTable });
    heroSeeder(db);

    // Hero adventures
    db.exec({ sql: createHeroAdventuresTable });
    heroAdventuresSeeder(db);

    // Hero equipped items
    db.exec({ sql: createHeroEquippedItemsTable });

    // Hero inventories
    db.exec({ sql: createHeroInventoriesTable });

    // Players
    db.exec({ sql: createPlayersTable });
    playersSeeder(db, server);
    db.exec({ sql: createPlayersIndexes });

    // RFC reference table
    db.exec({ sql: createResourceFieldCompositionsTable });
    resourceFieldCompositionsSeeder(db);

    // Tiles
    db.exec({ sql: createTilesTable });
    tilesSeeder(db, server);
    db.exec({ sql: createTilesIndexes });

    // Oasis bonuses
    db.exec({ sql: createOasisBonusesTable });
    oasisSeeder(db, server);
    db.exec({ sql: createOasisBonusesIndexes });

    // Oasis-occupiable-by
    db.exec({ sql: createOasisOccupiableByTable });
    oasisOccupiableBySeeder(db);
    db.exec({ sql: createOasisOccupiableByIndexes });

    // Guaranteed croppers
    guaranteedCroppersSeeder(db, server);

    // Villages
    db.exec({ sql: createVillagesTable });
    villageSeeder(db, server);
    occupiedOasisSeeder(db, server);

    // Bookmarks
    db.exec({ sql: createBookmarksTable });
    bookmarksSeeder(db);

    // Building fields
    db.exec({ sql: createBuildingFieldsTable });
    buildingFieldsSeeder(db, server);

    // Troops
    db.exec({ sql: createTroopsTable });
    troopSeeder(db, server);
    db.exec({ sql: createTroopsIndexes });

    // Effect ids
    db.exec({ sql: createEffectIdsTable });
    effectIdsSeeder(db);

    // Effects
    db.exec({ sql: createEffectsTable });
    effectsSeeder(db, server);
    db.exec({ sql: createEffectsIndexes });

    // Resource sites
    db.exec({ sql: createResourceSitesTable });
    resourceSitesSeeder(db, server);

    // World items
    db.exec({ sql: createWorldItemsTable });
    worldItemsSeeder(db, server);

    // Unit research
    db.exec({ sql: createUnitResearchTable });
    unitResearchSeeder(db, server);

    // Unit improvement
    db.exec({ sql: createUnitImprovementTable });
    unitImprovementSeeder(db, server);

    // Quests
    db.exec({ sql: createQuestsTable });
    questsSeeder(db);

    // Events
    db.exec({ sql: createEventsTable });
    eventsSeeder(db, server);
  });
};
