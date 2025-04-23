import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import type { Quest, QuestReward as QuestRewardType } from 'app/interfaces/models/game/quest';
import type React from 'react';
import { useState } from 'react';
import clsx from 'clsx';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  wasQuestCollected, wasQuestCompleted
} from 'app/(game)/workers/guards/quest-guards';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useTranslation } from 'react-i18next';

type QuestGroup = {
  groupKey: string;
  quests: Quest[];
  hasCollectible: boolean;
  allCollected: boolean;
};

export const _groupQuestsById = (quests: Quest[]): QuestGroup[] => {
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

    const hasCollectible = sorted.some((q) => q.completedAt !== null && q.collectedAt === null);

    const allCollected = sorted.every((q) => q.collectedAt !== null);

    result.push({
      groupKey,
      quests: sorted,
      hasCollectible,
      allCollected,
    });
  }

  return result;
};

type QuestRewardProps = {
  reward: QuestRewardType;
}

const QuestReward: React.FC<QuestRewardProps> = ({ reward }) => {
  if (isResourceQuestReward(reward)) {
    const { amount } = reward;

    return (
      <Resources resources={[amount, amount, amount, amount]} />
    );
  }

  if (isHeroExperienceQuestReward(reward)) {
    return `${reward.amount} XP`;
  }

  // TODO: Add hero items reward
  return null;
}

const QuestsPage = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { quests } = useQuests();

  const sortedQuests = [...quests].sort((a, b) => {
    const getSortValue = (quest: typeof a) => {
      if (isQuestCollectable(quest)) {
        return 0;
      }
      if (!wasQuestCompleted(quest)) {
        return 1;
      }
      if (wasQuestCollected(quest)) {
        return 2;
      }
      return 3;
    };

    return getSortValue(a) - getSortValue(b);
  });

  const getQuestTexts = (id: Quest['id']) => {
    return {
      title: 'quest title',
      description: 'quest description',
    };
  };

  const [selectedQuest, setSelectedQuest] = useState<Quest>(sortedQuests[0]);

  const { title, description } = getQuestTexts(selectedQuest.id);

  return (
    <>
      <div className="md:hidden space-y-2">
        {sortedQuests.map((quest) => {
          const isCollectable = isQuestCollectable(quest);
          const isCollected = wasQuestCollected(quest);
          const { title, description } = getQuestTexts(quest.id);

          return (
            <details
              key={quest.id}
              className={clsx(
                'border rounded-lg p-3 w-full',
                isCollected && 'opacity-50',
                isCollectable && 'bg-yellow-50'
              )}
            >
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium">
                <span>{title}</span>
                {isCollected ? '✅' : isCollectable ? '🎁' : ''}
              </summary>

              <div className="mt-3">
                <p className="text-sm text-gray-700 mb-2">
                  {description}
                </p>
                <div className="text-sm font-semibold mb-1">{t('Reward')}</div>
                {quest.rewards.map((reward) => (
                  <QuestReward key={reward.type} reward={reward} />
                ))}

                {isCollectable && (
                  <button type="button" className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition">
                    {t('Collect reward')}
                  </button>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="hidden md:flex border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        {/* Left Sidebar */}
        <div className="w-1/3 bg-gray-100 border-r border-gray-300 p-2 overflow-y-auto max-h-[600px]">
          {sortedQuests.map((quest) => {
            const isSelected = selectedQuest.id === quest.id;
            const isCollectable = isQuestCollectable(quest);
            const isCollected = wasQuestCollected(quest);
            const { title } = getQuestTexts(quest.id);

            return (
              <button
                type="button"
                key={quest.id}
                className={clsx(
                  'flex w-full items-center space-x-2 p-2 mb-1 cursor-pointer rounded border',
                  {
                    'bg-green-200 border-green-500': isSelected,
                    'bg-white border-gray-200': !isSelected,
                    'opacity-50': isCollected,
                    'bg-yellow-100': !isCollected && isCollectable,
                  }
                )}
                onClick={() => setSelectedQuest(quest)}
              >
                <span className="text-sm truncate">{title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Panel */}
        <div className="w-2/3 p-6 relative bg-white">
          <h2 className="text-lg font-bold text-center py-1 rounded mb-4">
            {title}
          </h2>

          <p className="text-sm text-gray-700 mb-4">
            {description}
          </p>

          <hr className="my-4" />

          <div className="text-sm font-semibold mb-2">{t('Reward')}</div>
          {selectedQuest.rewards.map((reward) => (
            <QuestReward key={reward.type} reward={reward} />
          ))}

          {selectedQuest.completedAt && !selectedQuest.collectedAt && (
            <button type="button" className="px-6 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition">
              {t('Collect reward')}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default QuestsPage;
