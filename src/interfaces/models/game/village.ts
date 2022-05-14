import { Point } from 'interfaces/models/common/point';
import { VillageResources } from 'interfaces/models/game/resources';
import { Effects } from 'interfaces/models/game/effect';

export type Village = {
  id: string;
  name: string;
  lastUpdatedAt: number;
  position: Point;
  resources: VillageResources;
  storageCapacity: VillageResources;
  hourlyProduction: VillageResources;
  effects: Effects;
};
