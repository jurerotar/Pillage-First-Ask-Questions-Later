import type { Village } from 'app/interfaces/models/game/village';
import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';

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

export type UnitTroopCountQuestRequirement = {
  type: 'unit-troop-count';
  count: number;
};

export type KillCountQuestRequirement = {
  type: 'kill-count';
  count: number;
};

export type UnitKillCountQuestRequirement = {
  type: 'unit-kill-count';
  count: number;
};

export type QuestRequirement =
  | BuildingQuestRequirement
  | AdventureCountQuestRequirement
  | KillCountQuestRequirement
  | UnitKillCountQuestRequirement
  | TroopCountQuestRequirement
  | UnitTroopCountQuestRequirement;

export type VillageQuestDefinition = {
  id:
    | `${Matcher}-${Building['id']}-${number}`
    | `${Matcher}-resourceFields-${number}`;
  scope: 'village';
};

export type GlobalQuestDefinition = {
  id:
    | `adventureCount-${number}`
    | `troopCount-${number}`
    | `unitTroopCount-${Unit['id']}-${number}`
    | `killCount-${number}`
    | `unitKillCount-${Unit['id']}-${number}`;
  scope: 'global';
};

type CollectableQuest = {
  completedAt: number | null;
  collectedAt: number | null;
};

export type VillageQuest = VillageQuestDefinition &
  CollectableQuest & {
    villageId: Village['id'];
  };

type GlobalQuest = GlobalQuestDefinition & CollectableQuest;

export type Quest = VillageQuest | GlobalQuest;
