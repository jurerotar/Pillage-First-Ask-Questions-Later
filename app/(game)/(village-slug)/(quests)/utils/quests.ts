import type { Quest } from 'app/interfaces/models/game/quest';
import type { TFunction } from 'i18next';

type QuestGroup = {
  groupKey: string;
  quests: Quest[];
  hasCollectible: boolean;
  allCollected: boolean;
  totalQuests: number;
  doneQuests: number;
};

export const groupQuestsById = (quests: Quest[]): QuestGroup[] => {
  const map = new Map<string, (Quest & { _order: number })[]>();

  for (const quest of quests) {
    const parts = quest.id.split('-');
    const groupKey = parts.slice(0, -1).join('-');
    const order = Number.parseInt(parts[parts.length - 1], 10);

    if (!map.has(groupKey)) {
      map.set(groupKey, []);
    }

    map.get(groupKey)!.push({ ...quest, _order: order });
  }

  const result: QuestGroup[] = [];

  for (const [groupKey, questsWithOrder] of map.entries()) {
    const sorted = questsWithOrder
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...q }) => q);

    const hasCollectible = sorted.some(
      (q) => q.completedAt !== null && q.collectedAt === null,
    );
    const allCollected = sorted.every((q) => q.collectedAt !== null);

    const totalQuests = sorted.length;
    const doneQuests = sorted.filter((q) => q.completedAt !== null).length;

    result.push({
      groupKey,
      quests: sorted,
      hasCollectible,
      allCollected,
      totalQuests,
      doneQuests,
    });
  }

  return result;
};

export const getQuestTexts = (id: Quest['id'] | string, assetsT: TFunction) => {
  if (id.includes('every')) {
    const [, buildingId, , level] = id.split('-');
    return {
      title: assetsT('QUESTS.EVERY.TITLE', {
        buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
        level,
      }),
      description: assetsT('QUESTS.EVERY.DESCRIPTION', {
        buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
        level,
      }),
      group: assetsT('QUESTS.EVERY.GROUP', {
        buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
      }),
    };
  }

  if (id.includes('oneOf')) {
    const [, buildingId, , level] = id.split('-');
    return {
      title: assetsT('QUESTS.ONE-OF.TITLE', {
        buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
        level,
      }),
      description: assetsT('QUESTS.ONE-OF.DESCRIPTION', {
        buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
        level,
      }),
      group: assetsT('QUESTS.ONE-OF.GROUP', {
        buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`),
      }),
    };
  }

  if (id.includes('adventureCount')) {
    const [, amount] = id.split('-');
    const count = Number.parseInt(amount, 10);

    return {
      title: assetsT('QUESTS.ADVENTURE-COUNT.TITLE', { count }),
      description: assetsT('QUESTS.ADVENTURE-COUNT.DESCRIPTION', { count }),
      group: assetsT('QUESTS.ADVENTURE-COUNT.GROUP'),
    };
  }

  if (id.includes('troopCount')) {
    const [, amount] = id.split('-');
    return {
      title: assetsT('QUESTS.TROOP-COUNT.TITLE', { amount }),
      description: assetsT('QUESTS.TROOP-COUNT.DESCRIPTION', { amount }),
      group: assetsT('QUESTS.TROOP-COUNT.GROUP'),
    };
  }

  return {
    title: 'QUEST TITLE MISSING',
    description: 'QUEST DESCRIPTION MISSING',
    group: 'QUEST GROUP MISSING',
  };
};
