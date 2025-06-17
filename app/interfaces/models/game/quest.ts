import type { Village } from 'app/interfaces/models/game/village';
import type { Building } from 'app/interfaces/models/game/building';

type GlobalQuestGroup = 'adventureCount' | 'troopCount';

type VillageQuestGroup = Building['id'] | 'resourceFields';

export type ResourceQuestReward = {
  type: 'resources';
  amount: number;
};

export type HeroExperienceQuestReward = {
  type: 'hero-exp';
  amount: number;
};

export type HeroItemQuestReward = {
  type: 'hero-item';
  amount: number;
};

export type QuestReward =
  | ResourceQuestReward
  | HeroExperienceQuestReward
  | HeroItemQuestReward;

type Matcher = 'oneOf' | 'every';

export type BuildingQuestRequirement = {
  type: 'building';
  buildingId: Building['id'];
  level: number;
  matcher: Matcher;
};

export type AdventureCountQuestRequirement = {
  type: 'adventure-count';
  count: number;
};

export type TroopCountQuestRequirement = {
  type: 'troop-count';
  count: number;
};

export type QuestRequirement =
  | BuildingQuestRequirement
  | AdventureCountQuestRequirement
  | TroopCountQuestRequirement;

type BaseQuest = {
  completedAt: number | null;
  collectedAt: number | null;
  rewards: QuestReward[];
};

export type VillageQuest = BaseQuest & {
  id: `${Village['id']}-${VillageQuestGroup}-${Matcher}-${number}`;
  scope: 'village';
  villageId: Village['id'];
  requirements: BuildingQuestRequirement[];
};

export type GlobalQuest = BaseQuest & {
  id: `${GlobalQuestGroup}-${number}`;
  scope: 'global';
  requirements: (AdventureCountQuestRequirement | TroopCountQuestRequirement)[];
};

export type Quest = VillageQuest | GlobalQuest;
