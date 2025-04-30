import { useQuests } from 'app/(game)/(village-slug)/hooks/use-quests';
import type { Quest, QuestReward as QuestRewardType } from 'app/interfaces/models/game/quest';
import type React from 'react';
import clsx from 'clsx';
import {
  isHeroExperienceQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  wasQuestCollected,
} from 'app/(game)/workers/guards/quest-guards';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useTranslation } from 'react-i18next';
import { Button } from 'app/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Text } from 'app/components/text';

type QuestGroup = {
  groupKey: string;
  quests: Quest[];
  hasCollectible: boolean;
  allCollected: boolean;
};

const groupQuestsById = (quests: Quest[]): QuestGroup[] => {
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
    const sorted = questsWithOrder.sort((a, b) => a._order - b._order).map(({ _order, ...q }) => q);

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

const QuestsPage = () => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { quests, completeQuest } = useQuests();
  const { resourcesPath } = useGameNavigation();

  const grouped = groupQuestsById(quests);

  const getQuestTexts = (id: Quest['id'] | string) => {
    if (id.includes('every')) {
      const [buildingId, , level] = id.split('-');
      return {
        title: assetsT('QUESTS.EVERY.TITLE', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`), level }),
        description: assetsT('QUESTS.EVERY.DESCRIPTION', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`), level }),
        group: assetsT('QUESTS.EVERY.GROUP', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`) }),
      };
    }

    if (id.includes('oneOf')) {
      const [buildingId, , level] = id.split('-');
      return {
        title: assetsT('QUESTS.ONE-OF.TITLE', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`), level }),
        description: assetsT('QUESTS.ONE-OF.DESCRIPTION', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`), level }),
        group: assetsT('QUESTS.ONE-OF.GROUP', { buildingName: assetsT(`BUILDINGS.${buildingId}.NAME`) }),
      };
    }

    if (id.includes('adventureCount')) {
      const [, amount] = id.split('-');
      const count = Number.parseInt(amount);

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
      title: 'Quest title missing',
      description: 'Quest description missing',
      group: 'Quest group missing',
    };
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Quests')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Quests')}</Text>
      <div className="space-y-2">
        {grouped.map((group) => (
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
              <span>{getQuestTexts(group.groupKey).group}</span>
            </summary>

            <div className="mt-2 space-y-2 px-2">
              {group.quests.map((quest) => {
                const isCollectable = isQuestCollectable(quest);
                const isCollected = wasQuestCollected(quest);
                const { title, description } = getQuestTexts(quest.id);

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
    </>
  );
};

export default QuestsPage;
