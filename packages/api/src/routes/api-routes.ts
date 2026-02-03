import { match } from 'path-to-regexp';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { paths } from '../../open-api';
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

// NOTE: /player/:playerId/* is aliased to /me/*. In an actual server setting you'd get current user from session

type RoutePath = keyof paths;
type RouteMethod<T extends RoutePath> = keyof paths[T] &
  ('get' | 'post' | 'put' | 'delete' | 'patch');

type Route<T extends RoutePath = RoutePath> = {
  [K in T]: {
    path: K;
    method: Uppercase<RouteMethod<K> & string>;
    controller: (database: DbFacade, args: any) => unknown;
  };
}[T];

const serverRoutes: Route[] = [
  {
    method: 'GET',
    path: '/server',
    controller: getServer,
  },
];

const developerToolsRoutes: Route[] = [
  {
    method: 'GET',
    path: '/developer-settings',
    controller: getDeveloperSettings,
  },
  {
    method: 'PATCH',
    path: '/developer-settings/:developerSettingName',
    controller: updateDeveloperSettings,
  },
  {
    method: 'PATCH',
    path: '/developer-settings/:villageId/resources',
    controller: updateVillageResources,
  },
  {
    method: 'PATCH',
    path: '/developer-settings/:heroId/spawn-item',
    controller: spawnHeroItem,
  },
  {
    method: 'PATCH',
    path: '/developer-settings/:heroId/increment-adventure-points',
    controller: incrementHeroAdventurePoints,
  },
];

const auctionRoutes: Route[] = [
  // {
  //   method: 'GET',
  //   path: '/auctions',
  //   controller: () => {},
  // },
];

const heroRoutes: Route[] = [
  {
    method: 'GET',
    path: '/players/:playerId/hero',
    controller: getHero,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/equipped-items',
    controller: getHeroLoadout,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/inventory',
    controller: getHeroInventory,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/adventures',
    controller: getHeroAdventures,
  },
  {
    method: 'POST',
    path: '/players/:playerId/hero/item',
    controller: useHeroItem,
  },
  {
    method: 'POST',
    path: '/players/:playerId/hero/adventures',
    controller: () => {},
  },
];

const unitImprovementRoutes: Route[] = [
  {
    method: 'GET',
    path: '/players/:playerId/unit-improvements',
    controller: getUnitImprovements,
  },
];

const questRoutes: Route[] = [
  {
    method: 'GET',
    path: '/villages/:villageId/quests',
    controller: getQuests,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/quests/collectables/count',
    controller: getCollectableQuestCount,
  },
  {
    method: 'PATCH',
    path: '/villages/:villageId/quests/:questId/collect',
    controller: collectQuest,
  },
];

const mapRoutes: Route[] = [
  {
    method: 'GET',
    path: '/tiles',
    controller: getTiles,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/troops',
    controller: getTileTroops,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/bonuses',
    controller: getTileOasisBonuses,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/world-item',
    controller: getTileWorldItem,
  },
];

const preferencesRoutes: Route[] = [
  {
    method: 'GET',
    path: '/players/:playerId/preferences',
    controller: getPreferences,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/preferences/:preferenceName',
    controller: updatePreference,
  },
];

const eventRoutes: Route[] = [
  {
    method: 'POST',
    path: '/events',
    controller: createNewEvents,
  },
  {
    method: 'DELETE',
    path: '/events/:eventId',
    controller: cancelConstructionEvent,
  },
];

const playerRoutes: Route[] = [
  {
    method: 'GET',
    path: '/players/me',
    controller: getMe,
  },
  {
    method: 'GET',
    path: '/players/:playerSlug',
    controller: getPlayerBySlug,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages',
    controller: getPlayerVillageListing,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages-with-population',
    controller: getPlayerVillagesWithPopulation,
  },
];

const villageRoutes: Route[] = [
  {
    method: 'GET',
    path: '/villages/:villageSlug',
    controller: getVillageBySlug,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/troops',
    controller: getTroopsByVillage,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/effects',
    controller: getVillageEffects,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/events',
    controller: getVillageEvents,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/events/:eventType',
    controller: getVillageEventsByType,
  },
  {
    method: 'PATCH',
    path: '/villages/:villageId/rename',
    controller: renameVillage,
  },
  {
    method: 'POST',
    path: '/villages/:villageId/oasis/:oasisId',
    controller: occupyOasis,
  },
  {
    method: 'DELETE',
    path: '/villages/:villageId/oasis/:oasisId',
    controller: abandonOasis,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/occupiable-oasis',
    controller: getOccupiableOasisInRange,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/researched-units',
    controller: getResearchedUnits,
  },
];

const mapFiltersRoutes: Route[] = [
  {
    method: 'GET',
    path: '/players/:playerId/map-filters',
    controller: getMapFilters,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/map-filters/:filterName',
    controller: updateMapFilter,
  },
];

const worldItemsRoutes: Route[] = [
  {
    method: 'GET',
    path: '/villages/:villageId/artifacts',
    controller: getArtifactsAroundVillage,
  },
];

const bookmarkRoutes: Route[] = [
  {
    method: 'GET',
    path: '/villages/:villageId/bookmarks',
    controller: getBookmarks,
  },
  {
    method: 'PATCH',
    path: '/villages/:villageId/bookmarks/:buildingId',
    controller: updateBookmark,
  },
];

const bonusFinderRoutes: Route[] = [
  {
    method: 'GET',
    path: '/oasis-bonus-finder',
    controller: getTilesWithBonuses,
  },
];

const statisticsRoutes: Route[] = [
  {
    method: 'GET',
    path: '/statistics/players',
    controller: getPlayerRankings,
  },
  {
    method: 'GET',
    path: '/statistics/villages',
    controller: getVillageRankings,
  },
  {
    method: 'GET',
    path: '/statistics/overview',
    controller: getGameWorldOverview,
  },
];

const reputationRoutes: Route[] = [
  {
    method: 'GET',
    path: '/players/:playerId/reputations',
    controller: getReputations,
  },
];

const apiRoutes: Route[] = [
  ...serverRoutes,
  ...developerToolsRoutes,
  ...heroRoutes,
  ...questRoutes,
  ...mapRoutes,
  ...playerRoutes,
  ...eventRoutes,
  ...villageRoutes,
  ...preferencesRoutes,
  ...mapFiltersRoutes,
  ...worldItemsRoutes,
  ...auctionRoutes,
  ...unitImprovementRoutes,
  ...bookmarkRoutes,
  ...statisticsRoutes,
  ...bonusFinderRoutes,
  ...reputationRoutes,
];

export const compiledApiRoutes = apiRoutes.map((route) => ({
  ...route,
  matcher: match(route.path, { decode: false }),
}));
