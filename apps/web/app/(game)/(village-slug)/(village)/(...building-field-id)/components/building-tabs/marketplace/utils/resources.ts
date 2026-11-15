import type {
  Resource,
  Resources as ResourcesType,
} from '@pillage-first/types/models/resource';
import { calculateDistanceBetweenTiles } from '@pillage-first/utils/map';

export const resourceTypes = [
  'wood',
  'clay',
  'iron',
  'wheat',
] as const satisfies Resource[];

export const emptyResources: ResourcesType = {
  wood: 0,
  clay: 0,
  iron: 0,
  wheat: 0,
};

export const getTotalResources = (resources: ResourcesType) => {
  let totalResources = 0;

  for (const resource of resourceTypes) {
    totalResources += resources[resource];
  }

  return totalResources;
};

export const getResourceInputMax = ({
  availableResources,
  selectedResources,
  resource,
  totalCapacity,
}: {
  availableResources: ResourcesType;
  selectedResources: ResourcesType;
  resource: Resource;
  totalCapacity: number;
}) => {
  const selectedOtherResources =
    getTotalResources(selectedResources) - selectedResources[resource];
  const remainingCapacity = Math.max(0, totalCapacity - selectedOtherResources);

  return Math.min(availableResources[resource], remainingCapacity);
};

export const clampResourceAmount = (value: string, maxAmount: number) => {
  if (value === '') {
    return 0;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return Math.min(Math.max(parsedValue, 0), maxAmount);
};

export const getMerchantAmount = (
  resources: ResourcesType,
  merchantCapacity: number,
) => {
  return Math.ceil(getTotalResources(resources) / merchantCapacity);
};

export const getMerchantMovementDuration = ({
  originTileId,
  targetTileId,
  mapSize,
  merchantSpeed,
  serverSpeed,
}: {
  originTileId: number;
  targetTileId: number;
  mapSize: number;
  merchantSpeed: number;
  serverSpeed: number;
}) => {
  const distance = calculateDistanceBetweenTiles(
    originTileId,
    targetTileId,
    mapSize,
  );

  return (distance / (merchantSpeed * serverSpeed)) * 3_600_000;
};
