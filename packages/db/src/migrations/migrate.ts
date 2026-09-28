import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import createBuildingDataIndexes from '../indexes/building-data-indexes.sql?raw';
import createBuildingFieldsIndexes from '../indexes/building-fields-indexes.sql?raw';
import createEffectsIndexes from '../indexes/effects-indexes.sql?raw';
import createOasisBonusesIndexes from '../indexes/oasis-indexes.sql?raw';
import createPlayersIndexes from '../indexes/players-indexes.sql?raw';
import createReportsIndexes from '../indexes/reports-indexes.sql?raw';
import createTilesIndexes from '../indexes/tiles-indexes.sql?raw';
import createTrapperCagesIndexes from '../indexes/trapper-cages-indexes.sql?raw';
import createTroopsIndexes from '../indexes/troops-indexes.sql?raw';
import createWorldItemsIndexes from '../indexes/world-items-indexes.sql?raw';
import createWoundedTroopsIndexes from '../indexes/wounded-troops-indexes.sql?raw';
import createBattleReportBuildingsTable from '../schemas/battle-report-buildings-schema.sql?raw';
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
import createHeroAuctionBuyListingsTable from '../schemas/hero-auction-buy-listings-schema.sql?raw';
import createHeroAuctionHistoryTable from '../schemas/hero-auction-history-schema.sql?raw';
import createHeroAuctionSellListingsTable from '../schemas/hero-auction-sell-listings-schema.sql?raw';
import createHeroEquippedItemsTable from '../schemas/hero-equipped-items-schema.sql?raw';
import createHeroInventoriesTable from '../schemas/hero-inventories-schema.sql?raw';
import createHeroSelectableAttributesTable from '../schemas/hero-selectable-attributes-schema.sql?raw';
import createHeroesTable from '../schemas/heroes-schema.sql?raw';
import createBuildingLevelChangeHistoryTable from '../schemas/history-tables/building-level-change-history-schema.sql?raw';
import createScheduledBuildingConstructionCancellationHistoryTable from '../schemas/history-tables/scheduled-building-construction-cancellation-history-schema.sql?raw';
import createUnitTrainingHistoryTable from '../schemas/history-tables/unit-training-history-schema.sql?raw';
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
import createReportFiltersTable from '../schemas/report-filters-schema.sql?raw';
import createReportTagsTable from '../schemas/report-tags-schema.sql?raw';
import createReportsTable from '../schemas/reports-schema.sql?raw';
import createResourceSitesTable from '../schemas/resource-sites-schema.sql?raw';
import createScheduledBuildingUpgradesTable from '../schemas/scheduled-building-upgrades-schema.sql?raw';
import createScheduledConstructionCancellationReportsTable from '../schemas/scheduled-construction-cancellation-reports-schema.sql?raw';
import createScoutingReportAttackerUnitsTable from '../schemas/scouting-report-attacker-units-schema.sql?raw';
import createScoutingReportStructuresTable from '../schemas/scouting-report-structures-schema.sql?raw';
import createScoutingReportUnitsTable from '../schemas/scouting-report-units-schema.sql?raw';
import createScoutingReportsTable from '../schemas/scouting-reports-schema.sql?raw';
import createServersTable from '../schemas/servers-schema.sql?raw';
import createTilesTable from '../schemas/tiles-schema.sql?raw';
import createTradeReportsTable from '../schemas/trade-reports-schema.sql?raw';
import createTrapperCagesTable from '../schemas/trapper-cages-schema.sql?raw';
import createTroopsTable from '../schemas/troops-schema.sql?raw';
import createUnitImprovementReportsTable from '../schemas/unit-improvement-reports-schema.sql?raw';
import createUnitImprovementTable from '../schemas/unit-improvements-schema.sql?raw';
import createUnitResearchReportsTable from '../schemas/unit-research-reports-schema.sql?raw';
import createUnitResearchTable from '../schemas/unit-research-schema.sql?raw';
import createVillageFoundingReportsTable from '../schemas/village-founding-reports-schema.sql?raw';
import createVillagesTable from '../schemas/villages-schema.sql?raw';
import createWorldItemsTable from '../schemas/world-items-schema.sql?raw';
import createWoundedTroopsTable from '../schemas/wounded-troops-schema.sql?raw';
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
import { heroAdventuresSeeder } from '../seeders/hero-adventures-seeder';
import { heroSeeder } from '../seeders/hero-seeder';
import { mapFiltersSeeder } from '../seeders/map-filters-seeder';
import { metaSeeder } from '../seeders/meta-seeder';
import { oasisSeeder } from '../seeders/oasis-seeder';
import { occupiedOasisSeeder } from '../seeders/occupied-oasis-seeder';
import { playersSeeder } from '../seeders/players-seeder';
import { preferencesSeeder } from '../seeders/preferences-seeder';
import { questsSeeder } from '../seeders/quests-seeder';
import { reportFiltersSeeder } from '../seeders/report-filters-seeder';
import { reportOutcomeIdsSeeder } from '../seeders/report-outcome-ids-seeder';
import { reportTagIdsSeeder } from '../seeders/report-tag-ids-seeder';
import { reportTypeIdsSeeder } from '../seeders/report-type-ids-seeder';
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
import createBattleReportWoundedTroopsTriggers from '../triggers/battle-report-wounded-troops-triggers.sql?raw';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import { setupHistoryTriggers } from '../triggers/history-triggers';
import { setupLoyaltyTriggers } from '../triggers/loyalty-triggers';
import createReportDeleteTriggers from '../triggers/report-delete-triggers.sql?raw';
import createReportRetentionTriggers from '../triggers/report-retention-triggers.sql?raw';

export const migrateAndSeed = (
  database: DbFacade,
  server: Server,
  onProgress?: () => void,
): number => {
  const t0 = performance.now();

  database.transaction((db) => {
    // Lookup tables
    db.execMulti({ sql: createBuildingIdsTable });
    buildingIdsSeeder(db);

    db.execMulti({ sql: createFactionIdsTable });
    factionIdsSeeder(db);

    db.execMulti({ sql: createTribeIdsTable });
    tribeIdsSeeder(db);

    db.execMulti({ sql: createUnitIdsTable });
    unitIdsSeeder(db);

    db.execMulti({ sql: createEffectIdsTable });
    effectIdsSeeder(db);

    db.execMulti({ sql: createEffectTypeIdsTable });
    db.execMulti({ sql: createEffectScopeIdsTable });
    db.execMulti({ sql: createEffectSourceIdsTable });
    effectAttributeIdsSeeder(db);

    db.execMulti({ sql: createUnitDataTable });
    unitDataSeeder(db);

    db.execMulti({ sql: createBuildingDataTable });
    buildingDataSeeder(db);
    db.execMulti({ sql: createBuildingDataIndexes });

    db.execMulti({ sql: createResourceFieldCompositionIdsTable });
    resourceFieldCompositionIdsSeeder(db);

    db.execMulti({ sql: createResourceIdsTable });
    resourceIdsSeeder(db);

    db.execMulti({ sql: createTileTypeIdsTable });
    tileTypeIdsSeeder(db);

    // Statistics
    db.execMulti({ sql: createUnitTrainingHistoryTable });
    db.execMulti({ sql: createBuildingLevelChangeHistoryTable });
    db.execMulti({
      sql: createScheduledBuildingConstructionCancellationHistoryTable,
    });

    // Developer settings
    db.execMulti({ sql: createDeveloperSettingsTable });
    developerSettingsSeeder(db);

    // Server
    db.execMulti({ sql: createServersTable });
    serverSeeder(db, server);

    // Map filters
    db.execMulti({ sql: createMapFiltersTable });
    mapFiltersSeeder(db);

    // Preferences
    db.execMulti({ sql: createPreferencesTable });
    preferencesSeeder(db);

    // Report filters
    db.exec({ sql: createReportFiltersTable });
    reportFiltersSeeder(db);

    // Faction reputations
    db.execMulti({ sql: createFactionReputationTable });
    factionReputationSeeder(db);

    // Tiles
    db.execMulti({ sql: createTilesTable });
    tilesSeeder(db, server);
    db.execMulti({ sql: createTilesIndexes });

    // Loyalties
    db.execMulti({ sql: createLoyaltiesTable });

    // Map markers
    db.execMulti({ sql: createMapMarkersTable });

    onProgress?.();

    // Oasis bonuses
    db.execMulti({ sql: createOasisBonusesTable });
    oasisSeeder(db, server);
    db.execMulti({ sql: createOasisBonusesIndexes });

    onProgress?.();

    // Players
    db.execMulti({ sql: createPlayersTable });
    playersSeeder(db, server);
    db.execMulti({ sql: createPlayersIndexes });

    onProgress?.();

    // Villages
    db.execMulti({ sql: createVillagesTable });
    villageSeeder(db, server);

    // Gatherers Hut expeditions
    db.execMulti({ sql: createGatherersHutExpeditionsTable });
    gatherersHutExpeditionsSeeder(db);

    onProgress?.();

    // Reports
    db.execMulti({ sql: createReportOutcomeIdsTable });
    reportOutcomeIdsSeeder(db);

    db.execMulti({ sql: createReportTagIdsTable });
    reportTagIdsSeeder(db);

    db.execMulti({ sql: createReportTypeIdsTable });
    reportTypeIdsSeeder(db);

    db.execMulti({ sql: createReportsTable });
    db.execMulti({ sql: createHeroAdventureReportsTable });
    db.execMulti({ sql: createMovementReportsTable });
    db.execMulti({ sql: createMovementReportUnitsTable });
    db.execMulti({ sql: createTradeReportsTable });
    db.execMulti({ sql: createHuntingPartyReportsTable });
    db.execMulti({ sql: createHuntingPartyReportUnitsTable });
    db.execMulti({ sql: createGatheringExpeditionReportsTable });
    db.execMulti({ sql: createGatheringExpeditionReportUnitsTable });
    db.execMulti({ sql: createReportTagsTable });
    db.execMulti({ sql: createBattleReportsTable });
    db.execMulti({ sql: createBattleReportBuildingsTable });
    db.execMulti({ sql: createBattleReportParticipantsTable });
    db.execMulti({ sql: createBattleReportUnitsTable });
    db.execMulti({ sql: createScoutingReportsTable });
    db.execMulti({ sql: createScoutingReportAttackerUnitsTable });
    db.execMulti({ sql: createScoutingReportUnitsTable });
    db.execMulti({ sql: createScoutingReportStructuresTable });
    db.exec({ sql: createUnitResearchReportsTable });
    db.exec({ sql: createUnitImprovementReportsTable });
    db.exec({ sql: createVillageFoundingReportsTable });
    db.exec({ sql: createScheduledConstructionCancellationReportsTable });

    db.execMulti({ sql: createReportsIndexes });

    db.execMulti({ sql: createReportDeleteTriggers });
    db.execMulti({ sql: createReportRetentionTriggers });

    // Heroes
    db.execMulti({ sql: createHeroesTable });
    db.execMulti({ sql: createHeroSelectableAttributesTable });
    heroSeeder(db);

    // Bookmarks
    db.execMulti({ sql: createBookmarksTable });
    bookmarksSeeder(db);

    // Hero adventures
    db.execMulti({ sql: createHeroAdventuresTable });
    heroAdventuresSeeder(db);

    // Hero equipped items
    db.execMulti({ sql: createHeroEquippedItemsTable });

    // Hero inventories
    db.execMulti({ sql: createHeroInventoriesTable });

    // Hero auctions
    db.execMulti({ sql: createHeroAuctionBuyListingsTable });
    db.execMulti({ sql: createHeroAuctionSellListingsTable });
    db.execMulti({ sql: createHeroAuctionHistoryTable });

    // Farm lists
    db.execMulti({ sql: createFarmListsTable });
    db.execMulti({ sql: createFarmListTilesTable });

    // Building fields
    db.execMulti({ sql: createBuildingFieldsTable });
    buildingFieldsSeeder(db, server);
    occupiedOasisSeeder(db, server);
    db.execMulti({ sql: createBuildingFieldsIndexes });

    // Trapper cages
    db.execMulti({ sql: createTrapperCagesTable });
    db.execMulti({ sql: createTrapperCagesIndexes });

    // Troops
    db.execMulti({ sql: createTroopsTable });
    troopSeeder(db, server);
    db.execMulti({ sql: createTroopsIndexes });

    // Wounded troops
    db.execMulti({ sql: createWoundedTroopsTable });
    db.execMulti({ sql: createWoundedTroopsIndexes });
    db.execMulti({ sql: createBattleReportWoundedTroopsTriggers });

    // Effects
    db.execMulti({ sql: createEffectsTable });
    effectsSeeder(db, server);
    db.execMulti({ sql: createEffectsIndexes });

    // Resource sites
    db.execMulti({ sql: createResourceSitesTable });
    resourceSitesSeeder(db, server);

    // World items
    db.execMulti({ sql: createWorldItemsTable });
    worldItemsSeeder(db, server);
    db.execMulti({ sql: createWorldItemsIndexes });

    // Unit research
    db.execMulti({ sql: createUnitResearchTable });

    // Unit improvement
    db.execMulti({ sql: createUnitImprovementTable });
    unitImprovementSeeder(db, server);

    // Quests
    db.execMulti({ sql: createQuestsTable });
    questsSeeder(db);

    // Events
    db.execMulti({ sql: createEventsTable });
    eventsSeeder(db, server);

    // Scheduled building upgrades
    db.execMulti({ sql: createScheduledBuildingUpgradesTable });

    // Meta table and write triggers
    db.execMulti({ sql: createMetaTable });
    metaSeeder(db);
    setupGlobalWriteTriggers(db);
    setupHistoryTriggers(db);
    setupLoyaltyTriggers(db);
  });

  const t1 = performance.now();

  return t1 - t0;
};
