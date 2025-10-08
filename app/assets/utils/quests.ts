import type {
  Quest,
  QuestRequirement,
  QuestReward,
} from 'app/interfaces/models/game/quest';
import type { Building } from 'app/interfaces/models/game/building';

const buildingIdToResourceRewardMap = new Map<Building['id'], number>([
  ['WOODCUTTER', 100],
  ['CLAY_PIT', 150],
  ['IRON_MINE', 120],
  ['WHEAT_FIELD', 80],
  ['MAIN_BUILDING', 150],
  ['WAREHOUSE', 100],
  ['GRANARY', 100],
  ['BARRACKS', 150],
  ['STABLE', 180],
  ['CRANNY', 90],
  ['MARKETPLACE', 110],
  ['SMITHY', 150],
  ['ACADEMY', 140],
  ['HEROS_MANSION', 150],
  ['RALLY_POINT', 120],
  ['SAWMILL', 200],
  ['BRICKYARD', 200],
  ['IRON_FOUNDRY', 200],
  ['GRAIN_MILL', 200],
  ['BAKERY', 200],
  ['CITY_WALL', 150],
  ['EARTH_WALL', 150],
  ['MAKESHIFT_WALL', 150],
  ['STONE_WALL', 150],
  ['PALISADE', 150],
]);

export const getQuestRewards = (questId: Quest['id']): QuestReward[] => {
  if (questId.startsWith('troopCount')) {
    const [, cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'resources',
        amount: count * 10,
      },
    ];
  }

  if (questId.startsWith('unitTroopCount')) {
    const [, , cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'resources',
        amount: count * 100,
      },
    ];
  }

  if (questId.startsWith('adventureCount')) {
    const [, cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'hero-exp',
        amount: count * 10,
      },
    ];
  }

  if (questId.startsWith('killCount')) {
    const [, cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'resources',
        amount: count * 10,
      },
    ];
  }

  if (questId.startsWith('unitKillCount')) {
    const [, , cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'resources',
        amount: count * 100,
      },
    ];
  }

  const [matcher, buildingId, lvl] = questId.split('-') as [
    'oneOf' | 'every',
    Building['id'],
    string,
  ];
  const level = Number.parseInt(lvl, 10);

  const base = buildingIdToResourceRewardMap.get(buildingId);

  if (!base) {
    throw new Error(
      `Base resource reward amount is missing for building "${buildingId}" quests.`,
    );
  }

  const effectiveLevel = level - 1;

  const oneOfMatcherAmount = Math.round(base * effectiveLevel) + base / 2;
  const everyMatcherAmount =
    Math.round(base * effectiveLevel ** 1.3) + base / 2;

  const amount = matcher === 'oneOf' ? oneOfMatcherAmount : everyMatcherAmount;

  return [
    {
      type: 'resources',
      amount,
    },
  ];
};

export const getQuestRequirements = (
  questId: Quest['id'],
): QuestRequirement[] => {
  if (questId.startsWith('troopCount')) {
    const [, cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'troop-count',
        count,
      },
    ];
  }

  if (questId.startsWith('unitTroopCount')) {
    const [, , cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'unit-troop-count',
        count,
      },
    ];
  }

  if (questId.startsWith('adventureCount')) {
    const [, cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'adventure-count',
        count,
      },
    ];
  }

  if (questId.startsWith('killCount')) {
    const [, cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'kill-count',
        count,
      },
    ];
  }

  if (questId.startsWith('unitKillCount')) {
    const [, , cnt] = questId.split('-');
    const count = Number.parseInt(cnt, 10);

    return [
      {
        type: 'unit-kill-count',
        count,
      },
    ];
  }

  const [matcher, buildingId, lvl] = questId.split('-') as [
    'oneOf' | 'every',
    Building['id'],
    string,
  ];
  const level = Number.parseInt(lvl, 10);

  return [
    {
      type: 'building',
      buildingId,
      level,
      matcher,
    },
  ];
};
