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

export const getQuestTexts = (id: Quest['id'] | string, t: TFunction) => {
  if (id.includes('every')) {
    const [buildingId, , level] = id.split('-');
    return {
      title: t('QUESTS.EVERY.NAME', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`, { count: 2 }),
        level,
      }),
      description: t('QUESTS.EVERY.DESCRIPTION', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`, { count: 2 }),
        level,
      }),
      group: t('QUESTS.EVERY.GROUP', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`, { count: 2 }),
      }),
    };
  }

  if (id.includes('oneOf')) {
    const [buildingId, , level] = id.split('-');
    return {
      title: t('QUESTS.ONE-OF.NAME', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`),
        level,
      }),
      description: t('QUESTS.ONE-OF.DESCRIPTION', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`),
        level,
      }),
      group: t('QUESTS.ONE-OF.GROUP', {
        buildingName: t(`BUILDINGS.${buildingId}.NAME`),
      }),
    };
  }

  if (id.includes('adventureCount')) {
    const [, amount] = id.split('-');
    const count = Number.parseInt(amount, 10);

    return {
      title: t('QUESTS.ADVENTURE-COUNT.NAME', { count }),
      description: t('QUESTS.ADVENTURE-COUNT.DESCRIPTION', { count }),
      group: t('QUESTS.ADVENTURE-COUNT.GROUP'),
    };
  }

  if (id.includes('troopCount')) {
    const [, amount] = id.split('-');
    return {
      title: t('QUESTS.TROOP-COUNT.NAME', { amount }),
      description: t('QUESTS.TROOP-COUNT.DESCRIPTION', { amount }),
      group: t('QUESTS.TROOP-COUNT.GROUP'),
    };
  }

  return {
    title: 'QUEST NAME MISSING',
    description: 'QUEST DESCRIPTION MISSING',
    group: 'QUEST GROUP MISSING',
  };
};
