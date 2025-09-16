import { clsx } from 'clsx';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  wasQuestCollected,
} from 'app/(game)/guards/quest-guards';
import { Button } from 'app/components/ui/button';
import type {
  Quest,
  QuestReward as QuestRewardType,
} from 'app/interfaces/models/game/quest';
import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import { useTranslation } from 'react-i18next';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import {
  getQuestTexts,
  groupQuestsById,
} from 'app/(game)/(village-slug)/(quests)/utils/quests';
import { Text } from 'app/components/text';
import { useEffect, useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from 'app/components/ui/pagination';

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

type QuestListProps = {
  quests: Quest[];
};

const PAGE_SIZE = 10;

export const QuestList = ({ quests }: QuestListProps) => {
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

  const questsToShow: Quest[] = [];

  for (const sortedGroup of sortedGroups) {
    for (const quest of sortedGroup.quests) {
      if (quest.collectedAt !== null) {
        continue;
      }

      questsToShow.push(quest);
      break;
    }
  }

  const [page, setPage] = useState<number>(1);
  const pageCount = Math.max(1, Math.ceil(questsToShow.length / PAGE_SIZE));

  const start = (page - 1) * PAGE_SIZE;
  const currentPageItems = questsToShow.slice(start, start + PAGE_SIZE);

  const pagesToRender: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];

  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) {
      pagesToRender.push(i);
    }
  } else {
    pagesToRender.push(1);
    if (page > 3) {
      pagesToRender.push('ellipsis-left');
    }
    const midStart = Math.max(2, page - 1);
    const midEnd = Math.min(pageCount - 1, page + 1);
    for (let i = midStart; i <= midEnd; i++) {
      pagesToRender.push(i);
    }
    if (page < pageCount - 2) {
      pagesToRender.push('ellipsis-right');
    }
    pagesToRender.push(pageCount);
  }

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return (
    <>
      {currentPageItems.map((quest) => {
        const isCollectable = isQuestCollectable(quest);
        const isCollected = wasQuestCollected(quest);
        const { title, description } = getQuestTexts(quest.id, assetsT);

        return (
          <div
            key={quest.id}
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
                    {quest.rewards.map((reward) => (
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
                  onClick={() => completeQuest({ questId: quest.id })}
                  type="button"
                  size="fit"
                >
                  {t('Collect reward')}
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {pageCount > 1 && (
        <div className="flex w-full justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-label={t('Previous')}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>

              {pagesToRender.map((p) =>
                typeof p === 'number' ? (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      aria-label={t('Page {{n}}', { n: p })}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  aria-label={t('Next')}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};
