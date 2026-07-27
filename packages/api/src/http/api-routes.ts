import { match } from 'path-to-regexp';
import type {
  ZodOpenApiOperationObject,
  ZodOpenApiPathsObject,
} from 'zod-openapi';
import {
  getBookmarks,
  updateBookmark,
} from './controllers/bookmark-controllers';
import {
  adjustVillageLoyalty,
  getDeveloperSettings,
  incrementHeroAdventurePoints,
  killHero,
  levelUpHero,
  spawnHeroItem,
  updateDeveloperSettings,
  updateVillageResources,
} from './controllers/developer-tools-controllers';
import { getVillageEffects } from './controllers/effect-controllers';
import {
  cancelConstructionEvent,
  cancelDemolitionEvent,
  cancelUnitImprovementEvent,
  createNewEvents,
  getVillageEvents,
  getVillageEventsByType,
} from './controllers/event-controllers';
import {
  addTileToFarmList,
  cloneFarmList,
  createFarmList,
  deleteFarmList,
  getFarmList,
  getFarmLists,
  getMeFarmLists,
  removeTileFromAllPlayerFarmLists,
  removeTileFromFarmList,
  updateFarmList,
} from './controllers/farm-list-controllers';
import {
  changeHeroAttributes,
  changeHeroResourceToProduce,
  equipHeroItem,
  getHero,
  getHeroAdventures,
  getHeroInventory,
  getHeroLoadout,
  startHeroAdventure,
  unequipHeroItem,
  useHeroItem,
} from './controllers/hero-controllers';
import {
  getBuildingLevelChangeHistory,
  getEventsHistory,
  getUnitTrainingHistory,
} from './controllers/history-controllers';
import { getTileLoyalty } from './controllers/loyalty-controllers';
import {
  addMapMarker,
  getMapMarkers,
  getTileOasisBonuses,
  getTiles,
  getTileTroops,
  getTileWorldItem,
  removeMapMarker,
} from './controllers/map-controllers';
import {
  getMapFilters,
  updateMapFilter,
} from './controllers/map-filters-controllers';
import {
  createTradeRoute,
  deleteTradeRoute,
  transferResources,
  updateTradeRoute,
} from './controllers/marketplace-controllers';
import { getOasesWithAnimals } from './controllers/oasis-animal-finder-controllers';
import { getTilesWithBonuses } from './controllers/oasis-bonus-finder-controllers';
import { abandonOasis, occupyOasis } from './controllers/oasis-controllers';
import {
  getMe,
  getPlayerBySlug,
  getPlayerVillageListing,
  getPlayerVillagesWithPopulation,
  getSentReinforcementsByTile,
  getStationedTroopsByTile,
  relocateReinforcements,
  relocateSentReinforcements,
  renameVillage,
  returnReinforcements,
  returnSentReinforcements,
} from './controllers/player-controllers';
import {
  getPreferences,
  updatePreference,
} from './controllers/preferences-controllers';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from './controllers/quest-controllers';
import {
  deleteReports,
  getReport,
  getReports,
  updateReports,
} from './controllers/report-controllers';
import { getReputations } from './controllers/reputation-controllers';
import {
  cancelScheduledBuildingUpgrade,
  getScheduledBuildingUpgrades,
  reorderScheduledBuildingUpgrades,
  scheduleBuildingUpgrade,
} from './controllers/scheduled-building-upgrades-controllers';
import { getServer } from './controllers/server-controllers';
import {
  getGameWorldOverview,
  getPlayerRankings,
  getVillageRankings,
} from './controllers/statistics-controllers';
import { getTrapperCageStats } from './controllers/trapper-controllers';
import {
  cancelTroopMovement,
  getVillageTroopMovementStats,
  getVillageTroopMovements,
  validateTroopMovement,
} from './controllers/troop-movement-controllers';
import { getUnitImprovements } from './controllers/unit-improvement-controllers';
import { getResearchedUnits } from './controllers/unit-research-controllers';
import {
  getGatherersHutExpeditions,
  getOccupiableOasisInRange,
  getVillageBySlug,
  rearrangeBuildingFields,
} from './controllers/village-controllers';
import { getArtifactsAroundVillage } from './controllers/world-items-controllers';
import { createRoute, type Route } from './route';

// NOTE: /player/:playerId/* is aliased to /me/*. In an actual server setting you'd get current user from session

export const apiRoutes = [
  // Server
  createRoute(getServer),

  // Developer Tools
  createRoute(getDeveloperSettings),
  createRoute(updateDeveloperSettings),
  createRoute(updateVillageResources),
  createRoute(spawnHeroItem),
  createRoute(levelUpHero),
  createRoute(incrementHeroAdventurePoints),
  createRoute(killHero),
  createRoute(adjustVillageLoyalty),

  // Auctions
  // createRoute(getAuctions),

  // Hero
  createRoute(getHero),
  createRoute(getHeroLoadout),
  createRoute(getHeroInventory),
  createRoute(getHeroAdventures),
  createRoute(startHeroAdventure),
  createRoute(useHeroItem),
  createRoute(equipHeroItem),
  createRoute(unequipHeroItem),
  createRoute(changeHeroAttributes),
  createRoute(changeHeroResourceToProduce),

  // Unit Improvements
  createRoute(getUnitImprovements),

  // Quests
  createRoute(getQuests),
  createRoute(getCollectableQuestCount),
  createRoute(collectQuest),

  // Map
  createRoute(getTiles),
  createRoute(getTileTroops),
  createRoute(getTileOasisBonuses),
  createRoute(getTileWorldItem),
  createRoute(getMapMarkers),
  createRoute(addMapMarker),
  createRoute(removeMapMarker),

  // Farm List
  createRoute(getFarmLists),
  createRoute(getMeFarmLists),
  createRoute(createFarmList),
  createRoute(getFarmList),
  createRoute(updateFarmList),
  createRoute(deleteFarmList),
  createRoute(addTileToFarmList),
  createRoute(cloneFarmList),
  createRoute(removeTileFromFarmList),
  createRoute(removeTileFromAllPlayerFarmLists),

  // Preferences
  createRoute(getPreferences),
  createRoute(updatePreference),

  // Events
  createRoute(createNewEvents),
  createRoute(cancelConstructionEvent),
  createRoute(cancelUnitImprovementEvent),
  createRoute(cancelDemolitionEvent),

  // Players
  createRoute(getMe),
  createRoute(getPlayerBySlug),
  createRoute(getPlayerVillageListing),
  createRoute(getPlayerVillagesWithPopulation),

  // Villages
  createRoute(getVillageBySlug),
  createRoute(getGatherersHutExpeditions),
  createRoute(getStationedTroopsByTile),
  createRoute(getSentReinforcementsByTile),
  createRoute(getVillageEffects),
  createRoute(getVillageEvents),
  createRoute(getVillageEventsByType),
  createRoute(renameVillage),
  createRoute(relocateReinforcements),
  createRoute(returnReinforcements),
  createRoute(relocateSentReinforcements),
  createRoute(returnSentReinforcements),
  createRoute(occupyOasis),
  createRoute(abandonOasis),
  createRoute(getOccupiableOasisInRange),
  createRoute(rearrangeBuildingFields),
  createRoute(getScheduledBuildingUpgrades),
  createRoute(scheduleBuildingUpgrade),
  createRoute(reorderScheduledBuildingUpgrades),
  createRoute(cancelScheduledBuildingUpgrade),
  createRoute(getResearchedUnits),
  createRoute(transferResources),
  createRoute(createTradeRoute),
  createRoute(updateTradeRoute),
  createRoute(deleteTradeRoute),

  // Map Filters
  createRoute(getMapFilters),
  createRoute(updateMapFilter),

  // World Items
  createRoute(getArtifactsAroundVillage),

  // Bookmarks
  createRoute(getBookmarks),
  createRoute(updateBookmark),

  // Reports
  createRoute(getReports),
  createRoute(getReport),
  createRoute(updateReports),
  createRoute(deleteReports),

  // Bonus Finder
  createRoute(getTilesWithBonuses),

  // Animal Finder
  createRoute(getOasesWithAnimals),

  // Statistics
  createRoute(getPlayerRankings),
  createRoute(getVillageRankings),
  createRoute(getGameWorldOverview),

  // Reputations
  createRoute(getReputations),

  // Loyalty
  createRoute(getTileLoyalty),

  // History
  createRoute(getBuildingLevelChangeHistory),
  createRoute(getEventsHistory),
  createRoute(getUnitTrainingHistory),

  // Troop Movements
  createRoute(getVillageTroopMovements),
  createRoute(getVillageTroopMovementStats),
  createRoute(validateTroopMovement),
  createRoute(cancelTroopMovement),

  // Trapper
  createRoute(getTrapperCageStats),
] as const;

const openApiPaths: ZodOpenApiPathsObject = {};

for (const route of apiRoutes) {
  openApiPaths[route.path] ??= {};
  openApiPaths[route.path][route.controller.method] = route.controller
    .operation as ZodOpenApiOperationObject;
}

export const paths: ZodOpenApiPathsObject = openApiPaths;

type CompiledRoute = Route & { matcher: ReturnType<typeof match> };

export const compiledApiRoutes: CompiledRoute[] = apiRoutes.map((route) => ({
  ...route,
  matcher: match(route.path, { decode: false }),
}));
