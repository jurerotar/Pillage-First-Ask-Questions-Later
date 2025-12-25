import type { QueryClient } from '@tanstack/react-query';
import {
  heroCacheKey,
  questsCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import {
  isAdventureCountQuestRequirement,
  isBuildingQuestRequirement,
  isTroopCountQuestRequirement,
  isVillageQuest,
} from 'app/(game)/guards/quest-guards';
import { getQuestRequirements } from 'app/assets/utils/quests';
import { PLAYER_ID } from 'app/constants/player';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';

export const evaluateQuestCompletions = (queryClient: QueryClient) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey])!;
  const hero = queryClient.getQueryData<Hero>([heroCacheKey])!;

  const playerVillages = villages.filter(
    ({ playerId }) => playerId === PLAYER_ID,
  );

  const playerVillagesTileIds = new Set(
    playerVillages.map(({ tileId }) => tileId),
  );
  // TODO: This does not count troops in transit
  const playerTroops = troops.filter(({ tileId }) =>
    playerVillagesTileIds.has(tileId),
  );

  const playerVillagesMap = new Map<Village['id'], Village>(
    playerVillages.map((village) => [village.id, village]),
  );

  const { adventureCount } = hero;
  const troopCount = playerTroops.reduce(
    (total, { amount }) => total + amount,
    0,
  );

  queryClient.setQueryData<Quest[]>([questsCacheKey], (quests) => {
    return quests!.map((quest) => {
      if (quest.completedAt !== null) {
        return quest;
      }

      const requirementStatuses: boolean[] = [];
      const questRequirements = getQuestRequirements(quest.id);

      for (const requirement of questRequirements) {
        if (isVillageQuest(quest) && isBuildingQuestRequirement(requirement)) {
          const village = playerVillagesMap.get(quest.villageId)!;
          const { matcher, buildingId, level } = requirement;

          if (matcher === 'every') {
            const matchingBuildingFields = village.buildingFields.filter(
              (buildingField) => buildingField.buildingId === buildingId,
            );

            if (matchingBuildingFields.length === 0) {
              requirementStatuses.push(false);
              continue;
            }

            requirementStatuses.push(
              matchingBuildingFields.every(
                (matchingBuildingField) => matchingBuildingField.level >= level,
              ),
            );
            continue;
          }

          requirementStatuses.push(
            village.buildingFields.some(
              (buildingField) =>
                buildingField.buildingId === buildingId &&
                buildingField.level >= level,
            ),
          );
        }

        if (isAdventureCountQuestRequirement(requirement)) {
          requirementStatuses.push(requirement.count <= adventureCount);
          continue;
        }

        // TODO: This is only evaluated once another quest is done, not when troops are constructed.
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
