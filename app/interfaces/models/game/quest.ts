import type { Village } from 'app/interfaces/models/game/village';
import type { Building } from 'app/interfaces/models/game/building';

type QuestGroup =
  | ''
  | ''
  | ''
  | ''
  | '';

type QuestId = `global-${QuestGroup}-${number}` | `village-${Village['id']}-${QuestGroup}-${number}`;

type ResourceQuestReward = {
  type: 'resources',
  amount: number[];
};

type HeroExpQuestReward = {
  type: 'hero-exp';
  amount: number;
};

export type BaseQuest = {
  id: QuestId;
  isCompleted: boolean;
};

type VillageQuestRequirement = {
  buildingId: Building['id'];
  level: number;
  matcher: 'oneOf' | 'every';
};

export type VillageQuest = BaseQuest & {
  scope: 'village';
  villageId: Village['id'];
  requirements: VillageQuestRequirement[];
  reward: ResourceQuestReward;
};

export type GlobalQuest = BaseQuest & {
  scope: 'village';
  reward: HeroExpQuestReward;
};

export type Quest = VillageQuest | GlobalQuest;

export type QuestWithStatus = {
  id: QuestId;
  isCompleted: boolean;
};
