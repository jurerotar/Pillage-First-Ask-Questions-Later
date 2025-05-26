import type { QueryClient } from '@tanstack/react-query';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import { heroCacheKey, playerTroopsCacheKey, playerVillagesCacheKey, questsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Hero } from 'app/interfaces/models/game/hero';
import {
  isAdventureCountQuestRequirement,
  isBuildingQuestRequirement,
  isTroopCountQuestRequirement,
  isVillageQuest,
} from 'app/(game)/guards/quest-guards';

export const evaluateQuestCompletions = (queryClient: QueryClient) => {
  const playerVillages = queryClient.getQueryData<PlayerVillage[]>([playerVillagesCacheKey])!;
  const playerTroops = queryClient.getQueryData<Troop[]>([playerTroopsCacheKey])!;
  const hero = queryClient.getQueryData<Hero>([heroCacheKey])!;
  const playerVillagesMap = new Map<PlayerVillage['id'], PlayerVillage>(playerVillages.map((village) => [village.id, village]));

  const { adventureCount } = hero;
  const troopCount = playerTroops.reduce((total, { amount }) => total + amount, 0);

  queryClient.setQueryData<Quest[]>([questsCacheKey], (quests) => {
    return quests!.map((quest) => {
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
  });
};
