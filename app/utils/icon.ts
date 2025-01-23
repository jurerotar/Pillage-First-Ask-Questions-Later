import type { Unit } from 'app/interfaces/models/game/unit';
import { camelCase } from 'moderndash';
import type { UnitIconType } from 'app/components/icons/icon-maps';

export const unitIdToUnitIconMapper = (unitId: Unit['id']): UnitIconType => {
  return camelCase(unitId) as UnitIconType;
};
