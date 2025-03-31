import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Report } from 'app/interfaces/models/game/report';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { reportsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { QueryClient } from '@tanstack/react-query';

const setReport = (queryClient: QueryClient, report: Report): void => {
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

const reinforcement: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;

  const reinforcementReport = generateTroopMovementReport({
    originatingVillageId,
    targetVillageId,
    movementType: 'reinforcement',
    troops,
  });

  setReport(queryClient, reinforcementReport);
};

const relocation: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;

  const relocationReport = generateTroopMovementReport({
    originatingVillageId,
    targetVillageId,
    movementType: 'relocation',
    troops,
  });

  setReport(queryClient, relocationReport);
};

const returnReinforcements: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;
};

const raid: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
};

const attack: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
};

export const troopMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { movementType } = args;

  switch (movementType) {
    case 'attack': {
      await attack(queryClient, args);
      break;
    }
    case 'raid': {
      await raid(queryClient, args);
      break;
    }
    case 'reinforcement': {
      await reinforcement(queryClient, args);
      break;
    }
    case 'relocation': {
      await relocation(queryClient, args);
      break;
    }
    case 'return': {
      await returnReinforcements(queryClient, args);
      break;
    }
  }
};
