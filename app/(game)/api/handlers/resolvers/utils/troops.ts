import type { Troop } from 'app/interfaces/models/game/troop';
import type { QueryClient } from '@tanstack/react-query';
import type { Report } from 'app/interfaces/models/game/report';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

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

export const setReport = (queryClient: QueryClient, report: Report): void => {
  queryClient.setQueryData<Report[]>(
    [reportsCacheKey],
    (existingReports = []) => {
      // Insert new report at the top
      const updatedReports = [report, ...existingReports];

      // Count non-archived reports
      let nonArchivedCount = 0;

      // Filter reports while keeping original order and respecting max limit
      const filteredReports = [];
      for (const r of updatedReports) {
        const isArchived = r.tags.includes('archived');
        if (!isArchived) {
          if (nonArchivedCount < 1000) {
            filteredReports.push(r);
            nonArchivedCount++;
          }
          continue;
        }

        // Always keep archived reports
        filteredReports.push(r);
      }

      return filteredReports;
    },
  );
};
