import { type DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Village } from 'app/interfaces/models/game/village';
import { heroCacheKey, playerTroopsCacheKey, playerVillagesCacheKey, questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { Troop } from 'app/interfaces/models/game/troop';
import {
  isAdventureCountQuestRequirement,
  isBuildingQuestRequirement,
  isTroopCountQuestRequirement,
  isVillageQuest,
} from 'app/(game)/workers/guards/quest-guards';

type QuestsWorkerPayload = {
  dehydratedState: DehydratedState;
};

export type QuestsWorkerReturn = {
  resolvedQuests: Quest[];
};

self.addEventListener('message', async (event: MessageEvent<QuestsWorkerPayload>) => {
  const { dehydratedState } = event.data;

  const queryClient = new QueryClient();
  hydrate(queryClient, dehydratedState);

  const playerVillages = queryClient.getQueryData<Village[]>([playerVillagesCacheKey])!;
  const playerTroops = queryClient.getQueryData<Troop[]>([playerTroopsCacheKey])!;
  const quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;
  const hero = queryClient.getQueryData<Hero>([heroCacheKey])!;
  const playerVillagesMap = new Map<Village['id'], Village>(playerVillages.map((village) => [village.id, village]));

  const { adventureCount } = hero;
  const troopCount = playerTroops.reduce((total, { amount }) => total + amount, 0);

  const resolvedQuests = quests.map((quest) => {
    if (quest.completedAt !== null) {
      return quest;
    }

    const requirementStatuses: boolean[] = [];

    for (const requirement of quest.requirements) {
      if (isVillageQuest(quest) && isBuildingQuestRequirement(requirement)) {
        const village = playerVillagesMap.get(quest.villageId)!;
        const { matcher, buildingId, level } = requirement;

        if (matcher === 'every') {
          const matchingBuildingFields = village.buildingFields.filter((buildingField) => buildingField.buildingId === buildingId);

          if (matchingBuildingFields.length === 0) {
            requirementStatuses.push(false);
            continue;
          }

          requirementStatuses.push(matchingBuildingFields.every((matchingBuildingField) => matchingBuildingField.level >= level));
          continue;
        }

        requirementStatuses.push(
          village.buildingFields.some((buildingField) => buildingField.buildingId === buildingId && buildingField.level >= level),
        );
      }

      if (isAdventureCountQuestRequirement(requirement)) {
        requirementStatuses.push(requirement.count <= adventureCount);
        continue;
      }

      if (isTroopCountQuestRequirement(requirement)) {
        requirementStatuses.push(requirement.count <= troopCount);
      }
    }

    if (requirementStatuses.every((requirementStatus) => requirementStatus)) {
      quest.completedAt = Date.now();
    }

    return quest;
  });

  self.postMessage({
    resolvedQuests,
  } satisfies QuestsWorkerReturn);
});
