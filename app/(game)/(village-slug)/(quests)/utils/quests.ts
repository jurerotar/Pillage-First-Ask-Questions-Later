import type { Quest } from 'app/interfaces/models/game/quest';
import type { TFunction } from 'i18next';
import { kebabCase } from 'moderndash';

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
      .toSorted((a, b) => a._order - b._order)
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
