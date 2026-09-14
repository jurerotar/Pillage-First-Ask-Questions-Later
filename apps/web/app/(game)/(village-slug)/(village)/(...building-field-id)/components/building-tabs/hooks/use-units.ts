import { units } from '@pillage-first/game-assets/units';
import type { Unit } from '@pillage-first/types/models/unit';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

export const useUnits = () => {
  const tribe = useTribe();

  const getTribeUnitsByCategory = (category: Unit['category']) => {
    return units.filter(
      ({ category: unitCategory, tribe: unitTribe }) =>
        unitCategory === category && unitTribe === tribe,
    );
  };

  return {
    getTribeUnitsByCategory,
  };
};
