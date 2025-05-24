import { getMap } from 'app/(game)/api/handlers/map-handlers';
import { getPreferences, updatePreference } from 'app/(game)/api/handlers/preferences-handlers';
import { getServer } from 'app/(game)/api/handlers/server-handlers';
import { getAdventurePoints, getHero } from 'app/(game)/api/handlers/hero-handlers';
import { getReports } from 'app/(game)/api/handlers/report-handlers';
import {
  getPlayerById,
  getPlayers,
  getTroopMovementsByVillage,
  getTroopsByVillage,
  getVillagesByPlayer,
} from 'app/(game)/api/handlers/player-handlers';
import { getQuests } from 'app/(game)/api/handlers/quest-handlers';
import { getEvents } from 'app/(game)/api/handlers/event-handlers';
import { getEffects } from 'app/(game)/api/handlers/effect-handlers';
import { getDeveloperMode, toggleDeveloperMode } from 'app/(game)/api/handlers/developer-mode-handlers';
import { getMapFilters, updateMapFilter } from 'app/(game)/api/handlers/map-filters-handlers';
import { getVillages } from 'app/(game)/api/handlers/village-handlers';
import { getReputations } from 'app/(game)/api/handlers/reputations-handlers';
import { getWorldItems } from 'app/(game)/api/handlers/world-items-handlers';
import { getTroops } from 'app/(game)/api/handlers/troop-handlers';

const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    handler: getServer,
  },
] as const;

const heroRoutes = [
  {
    method: 'GET',
    path: '/hero',
    handler: getHero,
  },
  {
    method: 'GET',
    path: '/hero/adventure-points',
    handler: getAdventurePoints,
  },
] as const;

const reportRoutes = [
  {
    method: 'GET',
    path: '/reports',
    handler: getReports,
  },
] as const;

const questRoutes = [
  {
    method: 'GET',
    path: '/quests',
    handler: getQuests,
  },
] as const;

const mapRoutes = [
  {
    method: 'GET',
    path: '/map',
    handler: getMap,
  },
] as const;

const preferencesRoutes = [
  {
    method: 'GET',
    path: '/preferences',
    handler: getPreferences,
  },
  {
    method: 'PATCH',
    path: '/preferences',
    handler: updatePreference,
  },
] as const;

const eventRoutes = [
  {
    method: 'GET',
    path: '/events',
    handler: getEvents,
  },
] as const;

const effectRoutes = [
  {
    method: 'GET',
    path: '/effects',
    handler: getEffects,
  },
] as const;

const playerRoutes = [
  {
    method: 'GET',
    path: '/players',
    handler: getPlayers,
  },
  {
    method: 'GET',
    path: '/players/:playerId',
    handler: getPlayerById,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages',
    handler: getVillagesByPlayer,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages/:villageId/troops',
    handler: getTroopsByVillage,
  },
  {
    method: 'GET',
    path: '/players/:playerId/villages/:villageId/troop-movements',
    handler: getTroopMovementsByVillage,
  },
] as const;

const villageRoutes = [
  {
    method: 'GET',
    path: '/villages',
    handler: getVillages,
  },
] as const;

const developerModeRoutes = [
  {
    method: 'GET',
    path: '/developer-mode',
    handler: getDeveloperMode,
  },

  {
    method: 'PATCH',
    path: '/developer-mode',
    handler: toggleDeveloperMode,
  },
] as const;

const mapFiltersRoutes = [
  {
    method: 'GET',
    path: '/map-filters',
    handler: getMapFilters,
  },

  {
    method: 'PATCH',
    path: '/map-filters',
    handler: updateMapFilter,
  },
] as const;

const worldItemsRoutes = [
  {
    method: 'GET',
    path: '/world-items',
    handler: getWorldItems,
  },
] as const;

const reputationRoutes = [
  {
    method: 'GET',
    path: '/reputations',
    handler: getReputations,
  },
] as const;

const troopRoutes = [
  {
    method: 'GET',
    path: '/troops',
    handler: getTroops,
  },
] as const;

export const apiRoutes = [
  ...serverRoutes,
  ...heroRoutes,
  ...reportRoutes,
  ...questRoutes,
  ...preferencesRoutes,
  ...mapRoutes,
  ...playerRoutes,
  ...eventRoutes,
  ...effectRoutes,
  ...villageRoutes,
  ...developerModeRoutes,
  ...mapFiltersRoutes,
  ...worldItemsRoutes,
  ...reputationRoutes,
  ...troopRoutes,
] as const;
