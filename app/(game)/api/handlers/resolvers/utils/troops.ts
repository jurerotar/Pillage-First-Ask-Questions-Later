import type { Troop } from 'app/interfaces/models/game/troop';

type UnitMapKey = `${Troop['unitId']}-${Troop['tileId']}-${Troop['source']}`;

const createTroopMap = (troops: Troop[]): Map<UnitMapKey, Troop> => {
  return new Map<UnitMapKey, Troop>(
    troops.map((troop) => [
      `${troop.unitId}-${troop.tileId}-${troop.source}`,
      troop,
    ]),
  );
};

export const canSendTroops = (troops: Troop[], toSend: Troop[]): boolean => {
  const troopMap = createTroopMap(troops);

  for (const troopChange of toSend) {
    const key =
      `${troopChange.unitId}-${troopChange.tileId}-${troopChange.source}` satisfies UnitMapKey;
    const troop = troopMap.get(key)!;
    if (troopChange.amount > troop.amount) {
      return false;
    }
  }

  return true;
};

export const modifyTroops = (
  troops: Troop[],
  change: Troop[],
  mode: 'add' | 'subtract',
): Troop[] => {
  const troopMap = createTroopMap(troops);

  for (const troopChange of change) {
    const key =
      `${troopChange.unitId}-${troopChange.tileId}-${troopChange.source}` satisfies UnitMapKey;

    if (!troopMap.has(key)) {
      troopMap.set(key, { ...troopChange, amount: 0 });
    }

    const troop = troopMap.get(key)!;

    if (mode === 'add') {
      troop.amount += troopChange.amount;
    } else {
      troop.amount -= troopChange.amount;

      if (troop.amount === 0) {
        troopMap.delete(key);
      }
    }
  }

  return Array.from(troopMap.values());
};
