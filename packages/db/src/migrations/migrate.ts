import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import createEffectsIndexes from '../indexes/effects-indexes.sql?raw';
import createOasisBonusesIndexes from '../indexes/oasis-indexes.sql?raw';
import createPlayersIndexes from '../indexes/players-indexes.sql?raw';
import createTilesIndexes from '../indexes/tiles-indexes.sql?raw';
import createTroopsIndexes from '../indexes/troops-indexes.sql?raw';
import createBookmarksTable from '../schemas/bookmarks-schema.sql?raw';
import createBuildingFieldsTable from '../schemas/building-fields-schema.sql?raw';
import createDeveloperSettingsTable from '../schemas/developer-settings-schema.sql?raw';
import createEffectsTable from '../schemas/effects-schema.sql?raw';
import createEventsTable from '../schemas/events-schema.sql?raw';
import createFactionReputationTable from '../schemas/faction-reputation-schema.sql?raw';
import createFarmListTilesTable from '../schemas/farm-list-tiles-schema.sql?raw';
import createFarmListsTable from '../schemas/farm-lists-schema.sql?raw';
import createHeroAdventuresTable from '../schemas/hero-adventures-schema.sql?raw';
import createHeroEquippedItemsTable from '../schemas/hero-equipped-items-schema.sql?raw';
import createHeroInventoriesTable from '../schemas/hero-inventories-schema.sql?raw';
import createHeroSelectableAttributesTable from '../schemas/hero-selectable-attributes-schema.sql?raw';
import createHeroesTable from '../schemas/heroes-schema.sql?raw';
import createBuildingDataTable from '../schemas/lookup-tables/building-data-schema.sql?raw';
import createBuildingIdsTable from '../schemas/lookup-tables/building-ids-schema.sql?raw';
import createEffectIdsTable from '../schemas/lookup-tables/effect-ids-schema.sql?raw';
import createFactionIdsTable from '../schemas/lookup-tables/faction-ids-schema.sql?raw';
import createResourceFieldCompositionIdsTable from '../schemas/lookup-tables/resource-field-composition-ids-schema.sql?raw';
import createTribeIdsTable from '../schemas/lookup-tables/tribe-ids-schema.sql?raw';
import createUnitDataTable from '../schemas/lookup-tables/unit-data-schema.sql?raw';
import createUnitIdsTable from '../schemas/lookup-tables/unit-ids-schema.sql?raw';
import createMapFiltersTable from '../schemas/map-filters-schema.sql?raw';
import createMapMarkersTable from '../schemas/map-markers-schema.sql?raw';
import createOasisBonusesTable from '../schemas/oasis-schema.sql?raw';
import createPlayersTable from '../schemas/players-schema.sql?raw';
import createPreferencesTable from '../schemas/preferences-schema.sql?raw';
import createQuestsTable from '../schemas/quests-schema.sql?raw';
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
import { buildingDataSeeder } from '../seeders/building-data-seeder';
import { buildingFieldsSeeder } from '../seeders/building-fields-seeder';
import { buildingIdsSeeder } from '../seeders/building-ids-seeder';
import { developerSettingsSeeder } from '../seeders/developer-settings-seeder';
import { effectIdsSeeder } from '../seeders/effect-ids-seeder';
import { effectsSeeder } from '../seeders/effects-seeder';
import { eventsSeeder } from '../seeders/events-seeder';
import { factionIdsSeeder } from '../seeders/faction-ids-seeder';
import { factionReputationSeeder } from '../seeders/faction-reputation-seeder';
import { guaranteedCroppersSeeder } from '../seeders/guaranteed-croppers-seeder';
import { heroAdventuresSeeder } from '../seeders/hero-adventures-seeder';
import { heroSeeder } from '../seeders/hero-seeder';
import { mapFiltersSeeder } from '../seeders/map-filters-seeder';
import { oasisSeeder } from '../seeders/oasis-seeder';
import { occupiedOasisSeeder } from '../seeders/occupied-oasis-seeder';
import { playersSeeder } from '../seeders/players-seeder';
import { preferencesSeeder } from '../seeders/preferences-seeder';
import { questsSeeder } from '../seeders/quests-seeder';
import { resourceFieldCompositionIdsSeeder } from '../seeders/resource-field-composition-ids-seeder';
import { resourceSitesSeeder } from '../seeders/resource-sites-seeder';
import { serverSeeder } from '../seeders/server-seeder';
import { tilesSeeder } from '../seeders/tiles-seeder';
import { tribeIdsSeeder } from '../seeders/tribe-ids-seeder';
import { troopSeeder } from '../seeders/troop-seeder';
import { unitDataSeeder } from '../seeders/unit-data-seeder';
import { unitIdsSeeder } from '../seeders/unit-ids-seeder';
import { unitImprovementSeeder } from '../seeders/unit-improvement-seeder';
import { unitResearchSeeder } from '../seeders/unit-research-seeder';
import { villageSeeder } from '../seeders/village-seeder';
import { worldItemsSeeder } from '../seeders/world-items-seeder';

export const migrateAndSeed = (
  database: DbFacade,
  server: Server,
  onProgress?: () => void,
): number => {
  const t0 = performance.now();

  database.transaction((db) => {
    // Lookup tables
    db.exec({ sql: createBuildingIdsTable });
    buildingIdsSeeder(db);

    db.exec({ sql: createFactionIdsTable });
    factionIdsSeeder(db);

    db.exec({ sql: createTribeIdsTable });
    tribeIdsSeeder(db);

    db.exec({ sql: createUnitIdsTable });
    unitIdsSeeder(db);

    db.exec({ sql: createEffectIdsTable });
    effectIdsSeeder(db);

    db.exec({ sql: createUnitDataTable });
    unitDataSeeder(db);

    db.exec({ sql: createBuildingDataTable });
    buildingDataSeeder(db);

    db.exec({ sql: createResourceFieldCompositionIdsTable });
    resourceFieldCompositionIdsSeeder(db);

    // Statistics
    db.exec({ sql: createUnitTrainingHistoryTable });
    db.exec({ sql: createBuildingLevelChangeHistoryTable });

    // Developer settings
    db.exec({ sql: createDeveloperSettingsTable });
    developerSettingsSeeder(db);

    // Server
    db.exec({ sql: createServersTable });
    serverSeeder(db, server);

    // Map filters
    db.exec({ sql: createMapFiltersTable });
    mapFiltersSeeder(db);

    // Preferences
    db.exec({ sql: createPreferencesTable });
    preferencesSeeder(db);

    // Faction reputations
    db.exec({ sql: createFactionReputationTable });
    factionReputationSeeder(db);

    // Tiles
    db.exec({ sql: createTilesTable });
    tilesSeeder(db, server);
    db.exec({ sql: createTilesIndexes });

    // Map markers
    db.exec({ sql: createMapMarkersTable });

    onProgress?.();

    // Oasis bonuses
    db.exec({ sql: createOasisBonusesTable });
    oasisSeeder(db, server);
    db.exec({ sql: createOasisBonusesIndexes });

    onProgress?.();

    // Players
    db.exec({ sql: createPlayersTable });
    playersSeeder(db, server);
    db.exec({ sql: createPlayersIndexes });

    onProgress?.();

    // Villages
    db.exec({ sql: createVillagesTable });
    villageSeeder(db, server);
    occupiedOasisSeeder(db, server);

    onProgress?.();

    // Heroes
    db.exec({ sql: createHeroesTable });
    db.exec({ sql: createHeroSelectableAttributesTable });
    heroSeeder(db);

    // Bookmarks
    db.exec({ sql: createBookmarksTable });
    bookmarksSeeder(db);

    // Hero adventures
    db.exec({ sql: createHeroAdventuresTable });
    heroAdventuresSeeder(db);

    // Hero equipped items
    db.exec({ sql: createHeroEquippedItemsTable });

    // Hero inventories
    db.exec({ sql: createHeroInventoriesTable });

    // Guaranteed croppers
    guaranteedCroppersSeeder(db, server);

    // Farm lists
    db.exec({ sql: createFarmListsTable });
    db.exec({ sql: createFarmListTilesTable });

    // Building fields
    db.exec({ sql: createBuildingFieldsTable });
    buildingFieldsSeeder(db, server);

    // Troops
    db.exec({ sql: createTroopsTable });
    troopSeeder(db, server);
    db.exec({ sql: createTroopsIndexes });

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

  const t1 = performance.now();

  return t1 - t0;
};
