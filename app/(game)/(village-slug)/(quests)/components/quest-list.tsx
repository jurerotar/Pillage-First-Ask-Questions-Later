import clsx from 'clsx';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  wasQuestCollected,
} from 'app/(game)/workers/guards/quest-guards';
import { Button } from 'app/components/ui/button';
import type React from 'react';
import type { Quest, QuestReward as QuestRewardType } from 'app/interfaces/models/game/quest';
import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { useTranslation } from 'react-i18next';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { getQuestTexts, groupQuestsById } from 'app/(game)/(village-slug)/(quests)/utils/quests';

type QuestRewardProps = {
  reward: QuestRewardType;
};

const QuestReward: React.FC<QuestRewardProps> = ({ reward }) => {
  if (isResourceQuestReward(reward)) {
    const { amount } = reward;
    return <Resources resources={[amount, amount, amount, amount]} />;
  }

  if (isHeroExperienceQuestReward(reward)) {
    return <span>{reward.amount} XP</span>;
  }

  // TODO: Add hero items reward
  return null;
};

type QuestListProps = {
  quests: Quest[];
};

export const QuestList: React.FC<QuestListProps> = ({ quests }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { completeQuest } = useQuests();

  const grouped = groupQuestsById(quests);

  const sortedGroups = [...grouped].sort((a, b) => {
    // Group with collectable quests should come first
    if (a.hasCollectible && !b.hasCollectible) {
      return -1;
    }
    if (!a.hasCollectible && b.hasCollectible) {
      return 1;
    }

    // Group with all quests collected should go last
    if (a.allCollected && !b.allCollected) {
      return 1;
    }
    if (!a.allCollected && b.allCollected) {
      return -1;
    }

    return 0;
  });

  // TODO: Extract QuestGroup and Quest
  return (
    <div className="space-y-2">
      {sortedGroups.map((group) => (
        <details
          key={group.groupKey}
          className={clsx('border rounded-xs shadow-xs')}
        >
          <summary
            className={clsx(
              'flex items-center justify-between cursor-pointer text-lg font-semibold py-2 px-4',
              group.allCollected && 'opacity-50',
              group.hasCollectible && 'bg-yellow-100',
            )}
          >
            <span>{getQuestTexts(group.groupKey, assetsT).group}</span>
          </summary>

          <div className="mt-2 space-y-2 px-2">
            {group.quests.map((quest) => {
              const isCollectable = isQuestCollectable(quest);
              const isCollected = wasQuestCollected(quest);
              const { title, description } = getQuestTexts(quest.id, assetsT);

              return (
                <details
                  key={quest.id}
                  className={clsx('border rounded-xs p-2 px-4 shadow-xs', isCollected && 'opacity-50', isCollectable && 'bg-yellow-100')}
                >
                  <summary className="cursor-pointer text-sm font-semibold">{title}</summary>

                  <div className="mt-3">
                    <p className="text-sm text-gray-700 mb-2">{description}</p>
                    <p className="text-sm font-semibold mb-1">{t('Reward')}</p>

                    <div className="flex flex-col gap-2">
                      {quest.rewards.map((reward) => (
                        <QuestReward
                          key={reward.type}
                          reward={reward}
                        />
                      ))}
                    </div>

                    {isCollectable && (
                      <Button
                        variant="default"
                        onClick={() => completeQuest(quest)}
                        type="button"
                        className="mt-3 w-fit"
                      >
                        {t('Collect reward')}
                      </Button>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
};
