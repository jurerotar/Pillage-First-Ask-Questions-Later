import type { QueryKey } from '@tanstack/react-query';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEventType } from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  currentVillageCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  eventsHistoryCacheKey,
  gatherersHutExpeditionsCacheKey,
  heroCacheKey,
  heroInventoryCacheKey,
  loyaltyCacheKey,
  occupiableOasisInRangeCacheKey,
  questsCacheKey,
  reportListingsCacheKey,
  scheduledBuildingUpgradesCacheKey,
  sentReinforcementsCacheKey,
  tilesCacheKey,
  trapperCagesCacheKey,
  troopMovementsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villageListingCacheKey,
  villageTroopsCacheKey,
  villageUnitCountCacheKey,
} from 'app/(game)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (
  event: EventApiNotificationEvent<K>,
) => QueryKey[];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

const getVillageUnitCountQueryKeys = (
  villageIds: EventApiNotificationEvent['affectedVillageIds'],
) => {
  return villageIds.flatMap((villageId) => {
    return villageId === null ? [] : [[villageUnitCountCacheKey, villageId]];
  });
};

export const cachesToClearOnResolve: Handlers = {
  buildingConstruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'buildingConstruction', villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
  buildingLevelChange: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [effectsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [questsCacheKey, villageId],
        [collectableQuestCountCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
        [scheduledBuildingUpgradesCacheKey, villageId],
      ]),
    ];
  },
  buildingDestruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [effectsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'buildingDestruction', villageId],
      ]),
    ];
  },
  troopTraining: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [effectsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'troopTraining', villageId],
      ]),
    ];
  },
  troopMovementReinforcements: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.flatMap((tileId) => [
        [villageTroopsCacheKey, tileId],
        [sentReinforcementsCacheKey, tileId],
      ]),
    ];
  },
  troopMovementRelocation: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
    ];
  },
  troopMovementReturn: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [heroCacheKey],
      [currentVillageCacheKey],
      [troopMovementsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.flatMap((tileId) => [
        [villageTroopsCacheKey, tileId],
        [sentReinforcementsCacheKey, tileId],
      ]),
    ];
  },
  troopMovementFindNewVillage: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [villageListingCacheKey],
      [tilesCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
    ];
  },
  troopMovementAttack: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [loyaltyCacheKey],
      [tilesCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      [occupiableOasisInRangeCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
    ];
  },
  troopMovementRaid: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
    ];
  },
  troopMovementOasisOccupation: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [reportListingsCacheKey],
      [tilesCacheKey],
      [currentVillageCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
    ];
  },
  troopMovementAdventure: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [adventurePointsCacheKey],
      [heroInventoryCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [questsCacheKey, villageId],
      ]),
    ];
  },
  unitResearch: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.flatMap((villageId) => [
        [unitResearchCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'unitResearch', villageId],
      ]),
    ];
  },
  unitImprovement: ({ affectedVillageIds }) => {
    return [
      [unitImprovementCacheKey],
      [eventsCacheKey, 'unitImprovement'],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  animalCageProduction: ({ affectedVillageIds }) => {
    return [
      [heroInventoryCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'animalCageProduction', villageId],
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  trapperCageProduction: ({ affectedVillageIds }) => {
    return [
      ...affectedVillageIds.flatMap((villageId) => [
        [trapperCagesCacheKey, villageId],
        [eventsCacheKey, 'trapperCageProduction', villageId],
        [eventsHistoryCacheKey, villageId],
      ]),
    ];
  },
  huntersLodgeHunt: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'huntersLodgeHunt', villageId],
      ]),
    ];
  },
  heroRevival: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [heroCacheKey],
      [effectsCacheKey],
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'heroRevival', villageId],
      ]),
    ];
  },
  heroHealthRegeneration: () => {
    return [[heroCacheKey]];
  },
  loyaltyIncrease: () => {
    return [[loyaltyCacheKey]];
  },
  gatherersHutGatheringTrip: ({ affectedVillageIds, affectedTileIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      ...getVillageUnitCountQueryKeys(affectedVillageIds),
      ...affectedTileIds.map((tileId) => [villageTroopsCacheKey, tileId]),
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'gatherersHutGatheringTrip', villageId],
        [gatherersHutExpeditionsCacheKey, villageId],
      ]),
    ];
  },
  resourceTransfer: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'resourceTransfer', villageId],
      ]),
    ];
  },
  tradeRoute: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'resourceTransfer', villageId],
        [eventsCacheKey, 'tradeRoute', villageId],
      ]),
    ];
  },
};
