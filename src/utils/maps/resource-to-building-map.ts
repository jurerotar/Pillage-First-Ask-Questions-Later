import { Resource } from 'interfaces/models/game/resource';

export const resourceToBuildingMap: { [key in Resource]: 'WOODCUTTER' | 'CLAY_PIT' | 'IRON_MINE' | 'CROPLAND' } = {
  wood: 'WOODCUTTER',
  clay: 'CLAY_PIT',
  iron: 'IRON_MINE',
  wheat: 'CROPLAND'
};
