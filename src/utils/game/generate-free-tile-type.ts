import { randomIntFromInterval } from 'utils/common';
import { ResourceFieldType } from 'interfaces/models/game/village';

export const generateFreeTileType = (): ResourceFieldType => {
  const randomInt: number = randomIntFromInterval(1, 91);
  const weightedResourceFieldType: { [key in number]: ResourceFieldType } = {
    1: '00018',
    2: '11115',
    3: '3339',
    6: '4437',
    9: '4347',
    12: '3447',
    20: '3456',
    28: '4356',
    36: '3546',
    44: '4536',
    52: '5346',
    60: '5436'
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const weight in weightedResourceFieldType) {
    if (randomInt <= Number(weight)) {
      return weightedResourceFieldType[weight];
    }
  }

  return '4446';
};
