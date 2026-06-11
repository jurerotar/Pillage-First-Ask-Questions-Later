import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import {
  coordinatesToTileId,
  tileIdToCoordinates,
} from '@pillage-first/utils/map';
import type { BaseTroopFormValues, UnitSelection } from './schema';

type UnitAmount = {
  unitId: Unit['id'];
  amount: number;
};

type TroopFormTarget = Partial<BaseTroopFormValues['target']>;

const getTroopFormUnitDefinitions = (tribe: Tribe) => [
  ...getUnitsByTribe(tribe),
  getUnitDefinition('HERO'),
];

export const createTroopFormTargetFromTileId = (
  targetTileId: Tile['id'] | undefined,
  mapSize: number,
): TroopFormTarget => {
  if (targetTileId === undefined) {
    return {};
  }

  return {
    tileId: targetTileId,
    ...tileIdToCoordinates(targetTileId, mapSize),
  };
};

export const createTroopFormTargetFromCoordinates = (
  target: { x?: number; y?: number },
  mapSize: number,
): TroopFormTarget => {
  const { x, y } = target;

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !Number.isInteger(x) ||
    !Number.isInteger(y)
  ) {
    return {};
  }

  return {
    tileId: coordinatesToTileId({ x, y }, mapSize),
    x,
    y,
  };
};

export const parseOptionalInteger = (
  value: string | null,
): number | undefined => {
  if (value === null || value.trim() === '') {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : undefined;
};

export const createUnitSelections = ({
  defaultUnits = [],
  tribe,
  troops,
}: {
  defaultUnits?: UnitAmount[];
  tribe: Tribe;
  troops: UnitAmount[];
}): UnitSelection[] => {
  const availableAmountByUnitId = new Map(
    troops.map(({ unitId, amount }) => [unitId, amount] as const),
  );
  const defaultAmountByUnitId = new Map(
    defaultUnits.map(({ unitId, amount }) => [unitId, amount] as const),
  );

  return getTroopFormUnitDefinitions(tribe).map((unitDef) => {
    const available = availableAmountByUnitId.get(unitDef.id) ?? 0;
    const selected = Math.min(
      defaultAmountByUnitId.get(unitDef.id) ?? 0,
      available,
    );

    return {
      unitId: unitDef.id,
      available,
      selected,
      tier: unitDef.tier,
      category: unitDef.category,
    };
  });
};
