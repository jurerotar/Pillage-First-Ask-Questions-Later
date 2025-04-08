import type { Troop } from 'app/interfaces/models/game/troop';
import type { QueryClient } from '@tanstack/react-query';
import type { Report } from 'app/interfaces/models/game/report';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const addTroops = (existing: Troop[], incoming: Troop[]): Troop[] => {
  for (const inc of incoming) {
    const match = existing.find((troop) => troop.unitId === inc.unitId && troop.tileId === inc.tileId && troop.source === inc.source);

    if (match) {
      match.amount += inc.amount;
      continue;
    }
    existing.push({ ...inc });
  }

  return existing;
};

export const subtractTroops = (base: Troop[], toSubtract: Troop[], differentSourceOnly: boolean): Troop[] => {
  for (const sub of toSubtract) {
    for (let i = 0; i < base.length; i++) {
      const b = base[i];
      const sourceMatch = differentSourceOnly ? b.source !== sub.source : b.source === sub.source;

      if (b.unitId === sub.unitId && b.tileId === sub.tileId && sourceMatch) {
        b.amount -= sub.amount;
        if (b.amount <= 0) {
          base.splice(i, 1);
          i--; // adjust index after removal
        }
        break; // assume only one match per troop
      }
    }
  }

  return base;
};

export const setReport = (queryClient: QueryClient, report: Report): void => {
  queryClient.setQueryData<Report[]>([reportsCacheKey], (existingReports = []) => {
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
  });
};
