import type {
  AdventureCountQuestRequirement,
  BuildingQuestRequirement,
  HeroExperienceQuestReward,
  HeroItemQuestReward,
  Quest,
  QuestRequirement,
  QuestReward,
  ResourceQuestReward,
  TroopCountQuestRequirement,
  VillageQuest
} from 'app/interfaces/models/game/quest';

export const isVillageQuest = (quest: Quest): quest is VillageQuest => {
  return quest.scope === 'village';
};

export const isBuildingQuestRequirement = (requirement: QuestRequirement): requirement is BuildingQuestRequirement => {
  return requirement.type === 'building';
};

export const isAdventureCountQuestRequirement = (requirement: QuestRequirement): requirement is AdventureCountQuestRequirement => {
  return requirement.type === 'adventure-count';
};

export const isTroopCountQuestRequirement = (requirement: QuestRequirement): requirement is TroopCountQuestRequirement => {
  return requirement.type === 'troop-count';
};

export const isResourceQuestReward = (
  reward: QuestReward
): reward is ResourceQuestReward => {
  return reward.type === 'resources';
};

export const isHeroExperienceQuestReward = (
  reward: QuestReward
): reward is HeroExperienceQuestReward => {
  return reward.type === 'hero-exp';
};

export const isHeroItemQuestReward = (
  reward: QuestReward
): reward is HeroItemQuestReward => {
  return reward.type === 'hero-item';
};
