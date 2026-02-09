import { match } from 'path-to-regexp';
import {
  getBookmarks,
  updateBookmark,
} from '../controllers/bookmark-controllers';
import {
  getDeveloperSettings,
  incrementHeroAdventurePoints,
  spawnHeroItem,
  updateDeveloperSettings,
  updateVillageResources,
} from '../controllers/developer-tools-controllers';
import { getVillageEffects } from '../controllers/effect-controllers';
import {
  cancelConstructionEvent,
  createNewEvents,
  getVillageEvents,
  getVillageEventsByType,
} from '../controllers/event-controllers';
import {
  addTileToFarmList,
  createFarmList,
  deleteFarmList,
  getFarmList,
  getFarmLists,
  removeTileFromFarmList,
  renameFarmList,
} from '../controllers/farm-list-controllers';
import {
  getHero,
  getHeroAdventures,
  getHeroInventory,
  getHeroLoadout,
  useHeroItem,
} from '../controllers/hero-controllers';
import {
  getTileOasisBonuses,
  getTiles,
  getTileTroops,
  getTileWorldItem,
} from '../controllers/map-controllers';
import {
  getMapFilters,
  updateMapFilter,
} from '../controllers/map-filters-controllers';
import { getTilesWithBonuses } from '../controllers/oasis-bonus-finder-controllers';
import { abandonOasis, occupyOasis } from '../controllers/oasis-controllers';
import {
  getMe,
  getPlayerBySlug,
  getPlayerVillageListing,
  getPlayerVillagesWithPopulation,
  getTroopsByVillage,
  renameVillage,
} from '../controllers/player-controllers';
import {
  getPreferences,
  updatePreference,
} from '../controllers/preferences-controllers';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from '../controllers/quest-controllers';
import { getReputations } from '../controllers/reputation-controllers';
import { getServer } from '../controllers/server-controllers';
import {
  getGameWorldOverview,
  getPlayerRankings,
  getVillageRankings,
} from '../controllers/statistics-controllers';
import { getUnitImprovements } from '../controllers/unit-improvement-controllers';
import { getResearchedUnits } from '../controllers/unit-research-controllers';
import {
  getOccupiableOasisInRange,
  getVillageBySlug,
} from '../controllers/village-controllers';
import { getArtifactsAroundVillage } from '../controllers/world-items-controllers';
import type { Route } from '../utils/route';
import { createRoute } from '../utils/route';

// NOTE: /player/:playerId/* is aliased to /me/*. In an actual server setting you'd get current user from session

const apiRoutes: Route[] = [
  // Server
  createRoute(getServer),

  // Developer Tools
  createRoute(getDeveloperSettings),
  createRoute(updateDeveloperSettings),
  createRoute(updateVillageResources),
  createRoute(spawnHeroItem),
  createRoute(incrementHeroAdventurePoints),

  // Auctions
  // createRoute(getAuctions),

  // Hero
  createRoute(getHero),
  createRoute(getHeroLoadout),
  createRoute(getHeroInventory),
  createRoute(getHeroAdventures),
  createRoute(useHeroItem),

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

  // Farm List
  createRoute(getFarmLists),
  createRoute(createFarmList),
  createRoute(getFarmList),
  createRoute(deleteFarmList),
  createRoute(addTileToFarmList),
  createRoute(removeTileFromFarmList),
  createRoute(renameFarmList),

  // Preferences
  createRoute(getPreferences),
  createRoute(updatePreference),

  // Events
  createRoute(createNewEvents),
  createRoute(cancelConstructionEvent),

  // Players
  createRoute(getMe),
  createRoute(getPlayerBySlug),
  createRoute(getPlayerVillageListing),
  createRoute(getPlayerVillagesWithPopulation),

  // Villages
  createRoute(getVillageBySlug),
  createRoute(getTroopsByVillage),
  createRoute(getVillageEffects),
  createRoute(getVillageEvents),
  createRoute(getVillageEventsByType),
  createRoute(renameVillage),
  createRoute(occupyOasis),
  createRoute(abandonOasis),
  createRoute(getOccupiableOasisInRange),
  createRoute(getResearchedUnits),

  // Map Filters
  createRoute(getMapFilters),
  createRoute(updateMapFilter),

  // World Items
  createRoute(getArtifactsAroundVillage),

  // Bookmarks
  createRoute(getBookmarks),
  createRoute(updateBookmark),

  // Bonus Finder
  createRoute(getTilesWithBonuses),

  // Statistics
  createRoute(getPlayerRankings),
  createRoute(getVillageRankings),
  createRoute(getGameWorldOverview),

  // Reputations
  createRoute(getReputations),
];

export const compiledApiRoutes = apiRoutes.map((route) => ({
  ...route,
  matcher: match(route.path, { decode: false }),
}));
