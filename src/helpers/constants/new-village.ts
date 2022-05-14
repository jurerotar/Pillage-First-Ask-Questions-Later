import { Village } from 'interfaces/models/game/village';
import { v4 as uuidv4 } from 'uuid';
import effects from 'helpers/constants/effects';

// This is default new (4-4-4-6) village. Some properties need to be changed on creation based on the type of village
const newVillage: Village = {
  id: uuidv4(),
  name: 'New village',
  lastUpdatedAt: Date.now(),
  position: {
    x: 0,
    y: 0
  },
  resources: {
    wood: 500,
    clay: 500,
    iron: 500,
    wheat: 750
  },
  storageCapacity: {
    wood: 800,
    clay: 800,
    iron: 800,
    wheat: 800
  },
  hourlyProduction: {
    wood: 16,
    clay: 16,
    iron: 16,
    wheat: 24
  },
  effects
};

export default newVillage;
