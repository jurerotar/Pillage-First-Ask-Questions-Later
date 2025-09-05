import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import type { Unit } from 'app/interfaces/models/game/unit';
import { units } from 'app/assets/units';

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
