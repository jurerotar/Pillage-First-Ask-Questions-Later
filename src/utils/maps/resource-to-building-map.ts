import { Resource } from 'interfaces/models/game/resource';

const resourceToBuildingMap: { [key in Resource]: 'WOODCUTTER' | 'CLAY_PIT' | 'IRON_MINE' | 'CROPLAND' } = {
  wood: 'WOODCUTTER',
  clay: 'CLAY_PIT',
  iron: 'IRON_MINE',
  wheat: 'CROPLAND'
};

export default resourceToBuildingMap;
