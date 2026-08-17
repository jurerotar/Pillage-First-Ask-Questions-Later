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
} from 'app/(game)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (
  event: EventApiNotificationEvent<K>,
) => QueryKey[];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

export const cachesToClearOnResolve: Handlers = {
  buildingScheduledConstruction: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'buildingScheduledConstruction', villageId],
        [eventsCacheKey, 'buildingLevelChange', villageId],
      ]),
    ];
  },
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
  troopTraining: ({ affectedVillageIds }) => {
    return [
      [effectsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
        [eventsHistoryCacheKey, villageId],
        [eventsCacheKey, 'troopTraining', villageId],
      ]),
    ];
  },
  troopMovementReinforcements: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
        [sentReinforcementsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementRelocation: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementReturn: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [currentVillageCacheKey],
      [troopMovementsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementFindNewVillage: () => {
    return [
      [currentVillageCacheKey],
      [villageListingCacheKey],
      [tilesCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
    ];
  },
  troopMovementAttack: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [loyaltyCacheKey],
      [tilesCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      [occupiableOasisInRangeCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementRaid: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
      ]),
    ];
  },
  troopMovementOasisOccupation: () => {
    return [
      [heroCacheKey],
      [reportListingsCacheKey],
      [tilesCacheKey],
      [currentVillageCacheKey],
      [effectsCacheKey],
      [troopMovementsCacheKey],
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
  huntersLodgeHunt: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
        [eventsCacheKey, 'huntersLodgeHunt', villageId],
      ]),
    ];
  },
  heroRevival: ({ affectedVillageIds }) => {
    return [
      [heroCacheKey],
      [effectsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [eventsCacheKey, 'heroRevival', villageId],
        [villageTroopsCacheKey, villageId],
      ]),
    ];
  },
  heroHealthRegeneration: () => {
    return [[heroCacheKey]];
  },
  loyaltyIncrease: () => {
    return [[loyaltyCacheKey]];
  },
  gatherersHutGatheringTrip: ({ affectedVillageIds }) => {
    return [
      [currentVillageCacheKey],
      [reportListingsCacheKey],
      ...affectedVillageIds.flatMap((villageId) => [
        [villageTroopsCacheKey, villageId],
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
