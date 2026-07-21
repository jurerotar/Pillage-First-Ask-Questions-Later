import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import createBuildingFieldsIndexes from '../indexes/building-fields-indexes.sql?raw';
import createEffectsIndexes from '../indexes/effects-indexes.sql?raw';
import createOasisBonusesIndexes from '../indexes/oasis-indexes.sql?raw';
import createPlayersIndexes from '../indexes/players-indexes.sql?raw';
import createReportsIndexes from '../indexes/reports-indexes.sql?raw';
import createResourceSitesIndexes from '../indexes/resource-sites-indexes.sql?raw';
import createTilesIndexes from '../indexes/tiles-indexes.sql?raw';
import createTrapperCagesIndexes from '../indexes/trapper-cages-indexes.sql?raw';
import createTroopsIndexes from '../indexes/troops-indexes.sql?raw';
import createWorldItemsIndexes from '../indexes/world-items-indexes.sql?raw';
import createBattleReportParticipantsTable from '../schemas/battle-report-participants-schema.sql?raw';
import createBattleReportUnitsTable from '../schemas/battle-report-units-schema.sql?raw';
import createBattleReportsTable from '../schemas/battle-reports-schema.sql?raw';
import createBookmarksTable from '../schemas/bookmarks-schema.sql?raw';
import createBuildingFieldsTable from '../schemas/building-fields-schema.sql?raw';
import createDeveloperSettingsTable from '../schemas/developer-settings-schema.sql?raw';
import createEffectsTable from '../schemas/effects-schema.sql?raw';
import createEventsTable from '../schemas/events-schema.sql?raw';
import createFactionReputationTable from '../schemas/faction-reputation-schema.sql?raw';
import createFarmListTilesTable from '../schemas/farm-list-tiles-schema.sql?raw';
import createFarmListsTable from '../schemas/farm-lists-schema.sql?raw';
import createGatherersHutExpeditionsTable from '../schemas/gatherers-hut-expeditions-schema.sql?raw';
import createGatheringExpeditionReportUnitsTable from '../schemas/gathering-expedition-report-units-schema.sql?raw';
import createGatheringExpeditionReportsTable from '../schemas/gathering-expedition-reports-schema.sql?raw';
import createHeroAdventureReportsTable from '../schemas/hero-adventure-reports-schema.sql?raw';
import createHeroAdventuresTable from '../schemas/hero-adventures-schema.sql?raw';
import createHeroEquippedItemsTable from '../schemas/hero-equipped-items-schema.sql?raw';
import createHeroInventoriesTable from '../schemas/hero-inventories-schema.sql?raw';
import createHeroSelectableAttributesTable from '../schemas/hero-selectable-attributes-schema.sql?raw';
import createHeroesTable from '../schemas/heroes-schema.sql?raw';
import createBuildingLevelChangeHistoryTable from '../schemas/history-tables/building-level-change-history-schema.sql?raw';
import createUnitImprovementHistoryTable from '../schemas/history-tables/unit-improvement-history-schema.sql?raw';
import createUnitResearchHistoryTable from '../schemas/history-tables/unit-research-history-schema.sql?raw';
import createUnitTrainingHistoryTable from '../schemas/history-tables/unit-training-history-schema.sql?raw';
import createVillageFoundingHistoryTable from '../schemas/history-tables/village-founding-history-schema.sql?raw';
import createHuntingPartyReportUnitsTable from '../schemas/hunting-party-report-units-schema.sql?raw';
import createHuntingPartyReportsTable from '../schemas/hunting-party-reports-schema.sql?raw';
import createBuildingDataTable from '../schemas/lookup-tables/building-data-schema.sql?raw';
import createBuildingIdsTable from '../schemas/lookup-tables/building-ids-schema.sql?raw';
import createEffectIdsTable from '../schemas/lookup-tables/effect-ids-schema.sql?raw';
import createEffectScopeIdsTable from '../schemas/lookup-tables/effect-scope-ids-schema.sql?raw';
import createEffectSourceIdsTable from '../schemas/lookup-tables/effect-source-ids-schema.sql?raw';
import createEffectTypeIdsTable from '../schemas/lookup-tables/effect-type-ids-schema.sql?raw';
import createFactionIdsTable from '../schemas/lookup-tables/faction-ids-schema.sql?raw';
import createReportOutcomeIdsTable from '../schemas/lookup-tables/report-outcome-ids-schema.sql?raw';
import createReportTagIdsTable from '../schemas/lookup-tables/report-tag-ids-schema.sql?raw';
import createReportTypeIdsTable from '../schemas/lookup-tables/report-type-ids-schema.sql?raw';
import createResourceFieldCompositionIdsTable from '../schemas/lookup-tables/resource-field-composition-ids-schema.sql?raw';
import createResourceIdsTable from '../schemas/lookup-tables/resource-ids-schema.sql?raw';
import createTileTypeIdsTable from '../schemas/lookup-tables/tile-type-ids-schema.sql?raw';
import createTribeIdsTable from '../schemas/lookup-tables/tribe-ids-schema.sql?raw';
import createUnitDataTable from '../schemas/lookup-tables/unit-data-schema.sql?raw';
import createUnitIdsTable from '../schemas/lookup-tables/unit-ids-schema.sql?raw';
import createLoyaltiesTable from '../schemas/loyalties-schema.sql?raw';
import createMapFiltersTable from '../schemas/map-filters-schema.sql?raw';
import createMapMarkersTable from '../schemas/map-markers-schema.sql?raw';
import createMetaTable from '../schemas/meta-schema.sql?raw';
import createMovementReportUnitsTable from '../schemas/movement-report-units-schema.sql?raw';
import createMovementReportsTable from '../schemas/movement-reports-schema.sql?raw';
import createOasisBonusesTable from '../schemas/oasis-schema.sql?raw';
import createPlayersTable from '../schemas/players-schema.sql?raw';
import createPreferencesTable from '../schemas/preferences-schema.sql?raw';
import createQuestsTable from '../schemas/quests-schema.sql?raw';
import createReportTagsTable from '../schemas/report-tags-schema.sql?raw';
import createReportsTable from '../schemas/reports-schema.sql?raw';
import createResourceSitesTable from '../schemas/resource-sites-schema.sql?raw';
import createServersTable from '../schemas/servers-schema.sql?raw';
import createTilesTable from '../schemas/tiles-schema.sql?raw';
import createTradeReportsTable from '../schemas/trade-reports-schema.sql?raw';
import createTrapperCagesTable from '../schemas/trapper-cages-schema.sql?raw';
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
import { effectAttributeIdsSeeder } from '../seeders/effect-attribute-ids-seeder';
import { effectIdsSeeder } from '../seeders/effect-ids-seeder';
import { effectsSeeder } from '../seeders/effects-seeder';
import { eventsSeeder } from '../seeders/events-seeder';
import { factionIdsSeeder } from '../seeders/faction-ids-seeder';
import { factionReputationSeeder } from '../seeders/faction-reputation-seeder';
import { gatherersHutExpeditionsSeeder } from '../seeders/gatherers-hut-expeditions-seeder';
import { guaranteedCroppersSeeder } from '../seeders/guaranteed-croppers-seeder';
import { heroAdventuresSeeder } from '../seeders/hero-adventures-seeder';
import { heroSeeder } from '../seeders/hero-seeder';
import { mapFiltersSeeder } from '../seeders/map-filters-seeder';
import { metaSeeder } from '../seeders/meta-seeder';
import { oasisSeeder } from '../seeders/oasis-seeder';
import { occupiedOasisSeeder } from '../seeders/occupied-oasis-seeder';
import { playersSeeder } from '../seeders/players-seeder';
import { preferencesSeeder } from '../seeders/preferences-seeder';
import { questsSeeder } from '../seeders/quests-seeder';
import { reportOutcomeIdsSeeder } from '../seeders/report-outcome-ids-seeder';
import { reportTagIdsSeeder } from '../seeders/report-tag-ids-seeder';
import { reportTypeIdsSeeder } from '../seeders/report-type-ids-seeder';
import { reportsSeeder } from '../seeders/reports-seeder';
import { resourceFieldCompositionIdsSeeder } from '../seeders/resource-field-composition-ids-seeder';
import { resourceIdsSeeder } from '../seeders/resource-ids-seeder';
import { resourceSitesSeeder } from '../seeders/resource-sites-seeder';
import { serverSeeder } from '../seeders/server-seeder';
import { tileTypeIdsSeeder } from '../seeders/tile-type-ids-seeder';
import { tilesSeeder } from '../seeders/tiles-seeder';
import { tribeIdsSeeder } from '../seeders/tribe-ids-seeder';
import { troopSeeder } from '../seeders/troop-seeder';
import { unitDataSeeder } from '../seeders/unit-data-seeder';
import { unitIdsSeeder } from '../seeders/unit-ids-seeder';
import { unitImprovementSeeder } from '../seeders/unit-improvement-seeder';
import { villageSeeder } from '../seeders/village-seeder';
import { worldItemsSeeder } from '../seeders/world-items-seeder';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import { setupHistoryTriggers } from '../triggers/history-triggers';
import { setupLoyaltyTriggers } from '../triggers/loyalty-triggers';
import createReportDeleteTriggers from '../triggers/report-delete-triggers.sql?raw';

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

    db.exec({ sql: createEffectTypeIdsTable });
    db.exec({ sql: createEffectScopeIdsTable });
    db.exec({ sql: createEffectSourceIdsTable });
    effectAttributeIdsSeeder(db);

    db.exec({ sql: createUnitDataTable });
    unitDataSeeder(db);

    db.exec({ sql: createBuildingDataTable });
    buildingDataSeeder(db);

    db.exec({ sql: createResourceFieldCompositionIdsTable });
    resourceFieldCompositionIdsSeeder(db);

    db.exec({ sql: createResourceIdsTable });
    resourceIdsSeeder(db);

    db.exec({ sql: createTileTypeIdsTable });
    tileTypeIdsSeeder(db);

    // Statistics
    db.exec({ sql: createUnitTrainingHistoryTable });
    db.exec({ sql: createBuildingLevelChangeHistoryTable });
    db.exec({ sql: createUnitImprovementHistoryTable });
    db.exec({ sql: createUnitResearchHistoryTable });
    db.exec({ sql: createVillageFoundingHistoryTable });

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

    // Loyalties
    db.exec({ sql: createLoyaltiesTable });

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

    // Gatherers Hut expeditions
    db.exec({ sql: createGatherersHutExpeditionsTable });
    gatherersHutExpeditionsSeeder(db);

    onProgress?.();

    // Reports
    db.exec({ sql: createReportOutcomeIdsTable });
    reportOutcomeIdsSeeder(db);

    db.exec({ sql: createReportTagIdsTable });
    reportTagIdsSeeder(db);

    db.exec({ sql: createReportTypeIdsTable });
    reportTypeIdsSeeder(db);

    db.exec({ sql: createReportsTable });
    db.exec({ sql: createHeroAdventureReportsTable });
    db.exec({ sql: createMovementReportsTable });
    db.exec({ sql: createMovementReportUnitsTable });
    db.exec({ sql: createTradeReportsTable });
    db.exec({ sql: createHuntingPartyReportsTable });
    db.exec({ sql: createHuntingPartyReportUnitsTable });
    db.exec({ sql: createGatheringExpeditionReportsTable });
    db.exec({ sql: createGatheringExpeditionReportUnitsTable });
    db.exec({ sql: createReportDeleteTriggers });
    db.exec({ sql: createReportTagsTable });

    db.exec({ sql: createBattleReportsTable });
    db.exec({ sql: createBattleReportParticipantsTable });
    db.exec({ sql: createBattleReportUnitsTable });
    reportsSeeder(db, server);

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
    db.exec({ sql: createBuildingFieldsIndexes });

    // Trapper cages
    db.exec({ sql: createTrapperCagesTable });
    db.exec({ sql: createTrapperCagesIndexes });

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
    db.exec({ sql: createResourceSitesIndexes });

    // World items
    db.exec({ sql: createWorldItemsTable });
    worldItemsSeeder(db, server);
    db.exec({ sql: createWorldItemsIndexes });
    db.exec({ sql: createReportsIndexes });

    // Unit research
    db.exec({ sql: createUnitResearchTable });

    // Unit improvement
    db.exec({ sql: createUnitImprovementTable });
    unitImprovementSeeder(db, server);

    // Quests
    db.exec({ sql: createQuestsTable });
    questsSeeder(db);

    // Events
    db.exec({ sql: createEventsTable });
    eventsSeeder(db, server);

    // Meta table and write triggers
    db.exec({ sql: createMetaTable });
    metaSeeder(db);
    setupGlobalWriteTriggers(db);
    setupHistoryTriggers(db);
    setupLoyaltyTriggers(db);
  });

  const t1 = performance.now();

  return t1 - t0;
};
