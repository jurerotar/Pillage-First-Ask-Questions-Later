import type { GlobalQuest, Quest, VillageQuest } from 'app/interfaces/models/game/quest';

export const globalQuests: (Omit<GlobalQuest, 'id' | 'isCompleted'>)[] = [];

export const villageQuests: (Omit<VillageQuest, 'id' | 'villageId' | 'isCompleted'>)[] = [
  {
    scope: 'village',
    requirements: [
      {
        buildingId: 'CLAY_PIT',
        level: 1,
        matcher: 'oneOf',
      }
    ],
    reward: {
      type: 'resources',
      amount: [],
    },
  },
  {
    scope: 'village',
    requirements: [
      {
        buildingId: 'CLAY_PIT',
        level: 1,
        matcher: 'every',
      }
    ],
    reward: {
      type: 'resources',
      amount: [],
    },
  }
];

export const quests: (Omit<Quest, 'id' | 'isCompleted'>)[] = [...villageQuests, ...globalQuests];
