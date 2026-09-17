import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCheck } from 'react-icons/lu';
import { getQuestRewards } from '@pillage-first/game-assets/utils/quests';
import type {
  Quest,
  QuestReward as QuestRewardType,
} from '@pillage-first/types/models/quest';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
} from '@pillage-first/utils/guards/quest';
import {
  getQuestTexts,
  groupQuestsById,
  type QuestGroup,
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

type QuestProgressMeterProps = {
  stages: QuestProgressStage[];
  label: string;
};

type QuestProgressStage = 'completed' | 'current' | 'upcoming';

const getQuestProgressStages = (quests: Quest[]): QuestProgressStage[] => {
  const currentQuestIndex = quests.findIndex(
    (quest) => quest.collectedAt === null,
  );

  return quests.map((quest, index) => {
    if (quest.collectedAt !== null) {
      return 'completed';
    }

    if (index === currentQuestIndex) {
      return 'current';
    }

    return 'upcoming';
  });
};

const questProgressStageStyles: Record<QuestProgressStage, string> = {
  completed: 'bg-success',
  current: 'bg-warning',
  upcoming: 'bg-muted',
};

const QuestProgressMeter = ({ stages, label }: QuestProgressMeterProps) => {
  const totalQuests = stages.length;

  if (totalQuests === 0) {
    return null;
  }

  const completedQuests = stages.filter(
    (stage) => stage === 'completed',
  ).length;

  const segmentIds = Array.from(
    { length: totalQuests },
    (_, index) => `quest-progress-segment-${index + 1}`,
  );

  return (
    <div className="flex w-full items-center gap-2">
      <div
        aria-label={label}
        aria-valuemax={totalQuests}
        aria-valuemin={0}
        aria-valuenow={completedQuests}
        className="grid h-2 w-full flex-1 gap-0.5 overflow-hidden rounded-full"
        role="progressbar"
        style={{
          gridTemplateColumns: `repeat(${totalQuests}, minmax(0, 1fr))`,
        }}
      >
        {stages.map((stage, index) => (
          <div
            className={clsx('flex flex-1', questProgressStageStyles[stage])}
            key={segmentIds[index]}
          />
        ))}
      </div>
      <Text className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {completedQuests}/{totalQuests}
      </Text>
    </div>
  );
};

type QuestListItemProps = {
  quest: Quest;
  questGroup: QuestGroup;
  showRewards: boolean;
  onComplete: (questId: Quest['id']) => void;
};

const QuestListItem = ({
  quest,
  questGroup,
  showRewards,
  onComplete,
}: QuestListItemProps) => {
  const { t } = useTranslation();
  const isCollectable = isQuestCollectable(quest);
  const isDone = isCollectable || questGroup.allCollected;
  const { title, description } = getQuestTexts(quest.id, t);

  const rewards = getQuestRewards(quest.id);

  return (
    <div className="border rounded-xs p-2 shadow-xs">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div className="flex flex-col gap-2 w-full md:w-4/6">
          <div className="flex items-center gap-1.5">
            <Text className="font-semibold">{title}</Text>
            {isDone && (
              <LuCheck
                aria-label={t('Quest completed')}
                className="size-4 text-success"
              />
            )}
          </div>
          <Text>{description}</Text>
          <QuestProgressMeter
            label={t('Quest progress')}
            stages={getQuestProgressStages(questGroup.quests)}
          />
          {showRewards && (
            <div className="inline-flex gap-2 flex-wrap">
              <Text className="font-medium">{t('Reward')}:</Text>

              {rewards.map((reward) => (
                <QuestReward
                  key={reward.type}
                  reward={reward}
                />
              ))}
            </div>
          )}
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

  const questGroupsToShow = useMemo(() => {
    const grouped = groupQuestsById(quests);

    const sortedGroups = grouped.sort((a, b) => {
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

    const questGroupsToShow: { quest: Quest; questGroup: QuestGroup }[] = [];

    for (const sortedGroup of sortedGroups) {
      const firstUncollectedQuest = sortedGroup.quests.find(
        (quest) => quest.collectedAt === null,
      );
      const quest = firstUncollectedQuest ?? sortedGroup.quests.at(-1);

      if (!quest) {
        continue;
      }

      questGroupsToShow.push({ quest, questGroup: sortedGroup });
    }

    return questGroupsToShow;
  }, [quests]);

  const pagination = usePagination<{ quest: Quest; questGroup: QuestGroup }>(
    questGroupsToShow,
    10,
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        {pagination.currentPageItems.map(({ quest, questGroup }) => (
          <QuestListItem
            key={quest.id}
            quest={quest}
            questGroup={questGroup}
            showRewards={!questGroup.allCollected}
            onComplete={(questId) => completeQuest({ questId })}
          />
        ))}
      </div>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </>
  );
};
