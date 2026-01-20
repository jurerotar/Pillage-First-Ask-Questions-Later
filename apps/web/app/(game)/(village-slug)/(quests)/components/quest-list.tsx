import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getQuestRewards } from '@pillage-first/game-assets/quests/utils';
import type {
  Quest,
  QuestReward as QuestRewardType,
} from '@pillage-first/types/models/quest';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  wasQuestCollected,
} from '@pillage-first/utils/guards/quest';
import {
  getQuestTexts,
  groupQuestsById,
} from 'app/(game)/(village-slug)/(quests)/utils/quests';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Pagination } from 'app/components/ui/pagination';

type QuestRewardProps = {
  reward: QuestRewardType;
};

const QuestReward = ({ reward }: QuestRewardProps) => {
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

type QuestListItemProps = {
  quest: Quest;
  onComplete: (questId: Quest['id']) => void;
};

const QuestListItem = ({ quest, onComplete }: QuestListItemProps) => {
  const { t } = useTranslation();
  const isCollectable = isQuestCollectable(quest);
  const isCollected = wasQuestCollected(quest);
  const { title, description } = getQuestTexts(quest.id, t);

  const rewards = getQuestRewards(quest.id);

  return (
    <div
      className={clsx(
        'border rounded-xs p-2 shadow-xs',
        isCollected && 'opacity-50',
        isCollectable && 'bg-yellow-100',
      )}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div className="flex flex-col gap-2">
          <Text className="font-semibold">{title}</Text>
          <Text>{description}</Text>
          <div className="inline-flex gap-2">
            <Text className="font-medium">{t('Reward')}:</Text>

            <div className="flex flex-col gap-2">
              {rewards.map((reward) => (
                <QuestReward
                  key={reward.type}
                  reward={reward}
                />
              ))}
            </div>
          </div>
        </div>

        {isCollectable && (
          <Button
            variant="default"
            onClick={() => onComplete(quest.id)}
            type="button"
            size="fit"
          >
            {t('Collect reward')}
          </Button>
        )}
      </div>
    </div>
  );
};

type QuestListProps = {
  quests: Quest[];
};

export const QuestList = ({ quests }: QuestListProps) => {
  const { completeQuest } = useQuests();

  const questsToShow = useMemo(() => {
    const grouped = groupQuestsById(quests);

    const sortedGroups = [...grouped].toSorted((a, b) => {
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

    const result: Quest[] = [];

    for (const sortedGroup of sortedGroups) {
      for (const quest of sortedGroup.quests) {
        if (quest.collectedAt !== null) {
          continue;
        }

        result.push(quest);
        break;
      }
    }

    return result;
  }, [quests]);

  const pagination = usePagination<Quest>(questsToShow, 10);

  return (
    <>
      {pagination.currentPageItems.map((quest) => (
        <QuestListItem
          key={quest.id}
          quest={quest}
          onComplete={(questId) => completeQuest({ questId })}
        />
      ))}
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </>
  );
};
