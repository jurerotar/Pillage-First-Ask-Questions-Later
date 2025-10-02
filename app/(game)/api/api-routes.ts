import {
  getContextualMap,
  getTileOccupiableOasis,
  getTilePlayer,
  getTileTroops,
  getTileWorldItem,
} from 'app/(game)/api/handlers/map-handlers';
import {
  getPreferences,
  updatePreference,
} from 'app/(game)/api/handlers/preferences-handlers';
import { getServer } from 'app/(game)/api/handlers/server-handlers';
import {
  getHero,
  getHeroAdventures,
  getHeroEquippedItems,
  getHeroInventory,
} from 'app/(game)/api/handlers/hero-handlers';
import {
  getPlayerById,
  getPlayerVillageListing,
  getTroopsByVillage,
  renameVillage,
} from 'app/(game)/api/handlers/player-handlers';
import {
  collectQuest,
  getCollectableQuestCount,
  getQuests,
} from 'app/(game)/api/handlers/quest-handlers';
import {
  cancelConstructionEvent,
  createNewEvents,
  getVillageEvents,
  getVillageEventsByType,
} from 'app/(game)/api/handlers/event-handlers';
import { getVillageEffects } from 'app/(game)/api/handlers/effect-handlers';
import {
  getMapFilters,
  updateMapFilter,
} from 'app/(game)/api/handlers/map-filters-handlers';
import { getVillageBySlug } from 'app/(game)/api/handlers/village-handlers';
import { getReputations } from 'app/(game)/api/handlers/reputations-handlers';
import { getWorldItems } from 'app/(game)/api/handlers/world-items-handlers';
import { match } from 'path-to-regexp';
import { getResearchedUnits } from 'app/(game)/api/handlers/unit-research-handlers';
import { getUnitImprovements } from 'app/(game)/api/handlers/unit-improvement-handlers';
import {
  getBookmarks,
  updateBookmark,
} from 'app/(game)/api/handlers/bookmark-handlers';
import {
  abandonOasis,
  occupyOasis,
} from 'app/(game)/api/handlers/oasis-handlers';

// NOTE: /player/:playerId/* is aliased to /me/*. In an actual server setting you'd get current user from session

const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    handler: getServer,
  },
];

const auctionRoutes = [
  {
    method: 'GET',
    path: '/auctions',
    handler: () => {},
  },
];

const heroRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/hero',
    handler: getHero,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/equipped-items',
    handler: getHeroEquippedItems,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/inventory',
    handler: getHeroInventory,
  },
  {
    method: 'GET',
    path: '/players/:playerId/hero/adventures',
    handler: getHeroAdventures,
  },
  {
    method: 'POST',
    path: '/players/:playerId/hero/adventures',
    handler: () => {},
  },
];

const unitResearchRoutes = [
  {
    method: 'GET',
    path: '/researched-units/:villageId',
    handler: getResearchedUnits,
  },
];

const unitImprovementRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/unit-improvements',
    handler: getUnitImprovements,
  },
];

const questRoutes = [
  {
    method: 'GET',
    path: '/villages/:villageId/quests',
    handler: getQuests,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/quests/collectables/count',
    handler: getCollectableQuestCount,
  },
  {
    method: 'PATCH',
    path: '/villages/:villageId/quests/:questId/collect',
    handler: collectQuest,
  },
];

const mapRoutes = [
  {
    method: 'GET',
    path: '/map/:villageId/contextual',
    handler: getContextualMap,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/troops',
    handler: getTileTroops,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/player',
    handler: getTilePlayer,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/world-item',
    handler: getTileWorldItem,
  },
  {
    method: 'GET',
    path: '/tiles/:tileId/occupiable-oasis',
    handler: getTileOccupiableOasis,
  },
];

const preferencesRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/preferences',
    handler: getPreferences,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/preferences/:preferenceName',
    handler: updatePreference,
  },
];

const eventRoutes = [
  {
    method: 'POST',
    path: '/events',
    handler: createNewEvents,
  },
  {
    method: 'DELETE',
    path: '/events/:eventId',
    handler: cancelConstructionEvent,
  },
];

const playerRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId',
    handler: getPlayerById,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages',
    handler: getPlayerVillageListing,
  },
];

const villageRoutes = [
  {
    method: 'GET',
    path: '/villages/:villageSlug',
    handler: getVillageBySlug,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/troops',
    handler: getTroopsByVillage,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/effects',
    handler: getVillageEffects,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/events',
    handler: getVillageEvents,
  },
  {
    method: 'GET',
    path: '/villages/:villageId/events/:eventType',
    handler: getVillageEventsByType,
  },
  {
    method: 'PATCH',
    path: '/villages/:villageId/rename',
    handler: renameVillage,
  },
  {
    method: 'POST',
    path: '/villages/:villageId/oasis/:oasisId',
    handler: occupyOasis,
  },
  {
    method: 'DELETE',
    path: '/villages/:villageId/oasis/:oasisId',
    handler: abandonOasis,
  },
];

const mapFiltersRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/map-filters',
    handler: getMapFilters,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/map-filters/:filterName',
    handler: updateMapFilter,
  },
];

const worldItemsRoutes = [
  {
    method: 'GET',
    path: '/world-items',
    handler: getWorldItems,
  },
];

const reputationRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/reputations',
    handler: getReputations,
  },
];

const bookmarkRoutes = [
  {
    method: 'GET',
    path: '/players/:playerId/bookmarks',
    handler: getBookmarks,
  },
  {
    method: 'PATCH',
    path: '/players/:playerId/bookmarks/:buildingId',
    handler: updateBookmark,
  },
];

const apiRoutes = [
  ...serverRoutes,
  ...heroRoutes,
  ...questRoutes,
  ...mapRoutes,
  ...playerRoutes,
  ...eventRoutes,
  ...villageRoutes,
  ...preferencesRoutes,
  ...mapFiltersRoutes,
  ...worldItemsRoutes,
  ...reputationRoutes,
  ...auctionRoutes,
  ...unitResearchRoutes,
  ...unitImprovementRoutes,
  ...bookmarkRoutes,
];

export const compiledApiRoutes = apiRoutes.map((route) => ({
  ...route,
  matcher: match(route.path, { decode: false }),
}));
