import { calculateGatherersHutGatheringResources } from '@pillage-first/game-assets/utils/gatherers-hut';
import type { VillageStorageResourceDto } from '@pillage-first/types/dtos/village';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  type Resource,
  resourceSchema,
} from '@pillage-first/types/models/resource';
import { calculateCurrentAmount } from '@pillage-first/utils/game/calculate-current-resources';

export type StorageDelivery = {
  source: keyof VillageStorageResourceDto['incoming'];
  arrivesAt: number;
  resources: number[];
};

export type StorageDeliveryEvent = GameEvent<
  'gatherersHutGatheringTrip' | 'resourceTransfer' | 'troopMovementReturn'
>;

// Events are scoped to the village and destination by the storage query.
export const getStorageDeliveries = (
  events: StorageDeliveryEvent[],
): StorageDelivery[] => {
  const deliveries: StorageDelivery[] = [];

  for (const event of events) {
    let source: StorageDelivery['source'];
    let resources: number[];

    switch (event.type) {
      case 'gatherersHutGatheringTrip': {
        let troopAmount = 0;
        for (const troop of event.troops) {
          troopAmount += troop.amount;
        }
        source = 'gathering';
        resources = calculateGatherersHutGatheringResources(troopAmount);
        break;
      }
      case 'resourceTransfer': {
        const { wood, clay, iron, wheat } = event.resources;
        source = 'marketplace';
        resources = [wood, clay, iron, wheat];
        break;
      }
      case 'troopMovementReturn':
        source = 'troops';
        resources = event.loot ?? [];
        break;
    }

    if (!resources.some((amount) => amount > 0)) {
      continue;
    }

    deliveries.push({
      source,
      arrivesAt: event.resolvesAt,
      resources,
    });
  }

  return deliveries;
};

// Follow production between deliveries so late arrivals cannot prevent an
// earlier depletion, and surplus deliveries cannot exceed storage capacity.
export const getStorageBoundaryTime = (
  resource: Resource,
  stored: number,
  capacity: number,
  hourlyProduction: number,
  deliveries: StorageDelivery[],
  now: number,
): number | null => {
  const rate = hourlyProduction / 3_600_000;
  const isDepleting = rate < 0;
  const resourceIndex = resourceSchema.options.indexOf(resource);
  let amount = Math.min(capacity, Math.max(0, stored));
  let time = now;

  const boundaryTime = () => {
    if (isDepleting) {
      return time + amount / -rate;
    }

    if (amount >= capacity) {
      return time;
    }

    return rate > 0 ? time + (capacity - amount) / rate : null;
  };

  const upcoming = deliveries
    .filter((delivery) => delivery.arrivesAt > now)
    .toSorted((a, b) => a.arrivesAt - b.arrivesAt);

  for (const delivery of upcoming) {
    const boundary = boundaryTime();

    if (boundary !== null && boundary <= delivery.arrivesAt) {
      return boundary;
    }

    const { currentAmount } = calculateCurrentAmount({
      lastKnownResourceAmount: amount,
      lastUpdatedAt: time,
      hourlyProduction,
      storageCapacity: capacity,
      timestamp: delivery.arrivesAt,
    });

    amount = Math.min(
      capacity,
      currentAmount + delivery.resources[resourceIndex],
    );

    // Deliveries save whole units and restart production at their arrival time.
    time = delivery.arrivesAt;
  }

  return boundaryTime();
};
