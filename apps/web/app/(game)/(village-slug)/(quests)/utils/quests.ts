import type { TFunction } from 'i18next';
import { kebabCase } from 'moderndash';
import type { Quest } from '@pillage-first/types/models/quest';

type QuestGroup = {
  groupKey: string;
  quests: Quest[];
  hasCollectible: boolean;
  allCollected: boolean;
  totalQuests: number;
  doneQuests: number;
};

export const groupQuestsById = (quests: Quest[]): QuestGroup[] => {
  const map = new Map<string, { quest: Quest; order: number }[]>();

  for (const quest of quests) {
    const separatorIdx = quest.id.lastIndexOf('-');
    const groupKey =
      separatorIdx === -1 ? quest.id : quest.id.slice(0, separatorIdx);
    const order = Number.parseInt(
      separatorIdx === -1 ? '0' : quest.id.slice(separatorIdx + 1),
      10,
    );

    const bucket = map.get(groupKey);

    if (bucket) {
      bucket.push({ quest, order });
    } else {
      map.set(groupKey, [{ quest, order }]);
    }
  }

  const result: QuestGroup[] = [];

  for (const [groupKey, questsWithOrder] of map.entries()) {
    questsWithOrder.sort((a, b) => a.order - b.order);

    const sorted: Quest[] = new Array(questsWithOrder.length);
    let hasCollectible = false;
    let allCollected = true;
    let doneQuests = 0;

    for (let i = 0; i < questsWithOrder.length; i++) {
      const quest = questsWithOrder[i].quest;

      sorted[i] = quest;

      const completed = quest.completedAt !== null;
      const collected = quest.collectedAt !== null;

      if (completed) {
        doneQuests += 1;
      }

      if (completed && !collected) {
        hasCollectible = true;
      }

      if (!collected) {
        allCollected = false;
      }
    }

    const totalQuests = sorted.length;

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

export const getQuestTexts = (id: Quest['id'], t: TFunction) => {
  // Quests follow {questGroup}-${questSpecifier?}-{amount}
  const [questGroupId, ...rest] = id.split('-');
  const specifier = rest.at(-2);
  const amount = rest.at(-1)!;
  const count = Number.parseInt(amount, 10);

  const capitalizedQuestGroupId = kebabCase(questGroupId).toUpperCase();

  const asset = ['oneOf', 'every'].includes(questGroupId)
    ? t(`BUILDINGS.${specifier}.NAME`, { count })
    : t(`UNITS.${specifier}.NAME`, { count });

  return {
    title: t(`QUESTS.${capitalizedQuestGroupId}.NAME`, {
      count,
      asset,
    }),
    description: t(`QUESTS.${capitalizedQuestGroupId}.DESCRIPTION`, {
      count,
      asset,
    }),
    group: t(`QUESTS.${capitalizedQuestGroupId}.GROUP`, { asset }),
  };
};
