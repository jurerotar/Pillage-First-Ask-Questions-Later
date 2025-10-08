import type { QueryClient } from '@tanstack/react-query';
import type { Village } from 'app/interfaces/models/game/village';
import {
  heroCacheKey,
  questsCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Hero } from 'app/interfaces/models/game/hero';
import {
  isAdventureCountQuestRequirement,
  isBuildingQuestRequirement,
  isTroopCountQuestRequirement,
  isVillageQuest,
} from 'app/(game)/guards/quest-guards';
import { PLAYER_ID } from 'app/constants/player';
import { getQuestRequirements } from 'app/assets/utils/quests';
import type { DbFacade } from 'app/(game)/api/database-facade';

export const assessAdventureCountQuestCompletion = (
  database: DbFacade,
  timestamp: number,
): void => {
  database.exec(
    `
      UPDATE quests
      SET completed_at = $completed_at
      WHERE completed_at IS NULL
        AND quest_id LIKE 'adventureCount-%'
        AND substr(quest_id, length('adventureCount-') + 1) GLOB '[0-9]*'
        AND village_id IS NOT NULL
        AND village_id IN (
          SELECT id FROM villages WHERE player_id = $player_id
        )
        AND CAST(substr(quest_id, length('adventureCount-') + 1) AS INTEGER) <= (
        SELECT COALESCE(MAX(ha.completed), 0)
        FROM hero_adventures ha
               JOIN heroes h ON ha.hero_id = h.id
        WHERE h.player_id = $player_id
      );
    `,
    {
      $completed_at: timestamp,
      $player_id: PLAYER_ID,
    },
  );
};

export const assessTroopCountQuestCompletion = (
  _database: DbFacade,
): void => {};

export const assessBuildingQuestCompletion = (_database: DbFacade): void => {};

export const evaluateQuestCompletions = (queryClient: QueryClient) => {
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey])!;
  const hero = queryClient.getQueryData<Hero>([heroCacheKey])!;

  const playerVillages = villages.filter(
    ({ playerId }) => playerId === PLAYER_ID,
  );
  const playerVillagesTileIds = playerVillages.map(({ tileId }) => tileId);

  // TODO: This does not count troops in transit
  const playerTroops = troops.filter(({ tileId }) =>
    playerVillagesTileIds.includes(tileId),
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
