import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';

export const formatTroopAmount = (tribe: Tribe, troops: Troop[]) => {
  const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

  return tribeUnits.map((unitDef) => {
    const troop = troops.find((t) => t.unitId === unitDef.id);
    return troop?.amount ?? 0;
  });
};
