import type {
  HeroExperienceQuestReward,
  HeroItemQuestReward,
  Quest,
  QuestReward,
  ResourceQuestReward,
} from 'app/interfaces/models/game/quest';

export const isResourceQuestReward = (
  reward: QuestReward,
): reward is ResourceQuestReward => {
  return reward.type === 'resources';
};

export const isHeroExperienceQuestReward = (
  reward: QuestReward,
): reward is HeroExperienceQuestReward => {
  return reward.type === 'hero-exp';
};

export const isHeroItemQuestReward = (
  reward: QuestReward,
): reward is HeroItemQuestReward => {
  return reward.type === 'hero-item';
};

const wasQuestCompleted = (quest: Quest) => {
  return quest.completedAt !== null;
};

export const wasQuestCollected = (quest: Quest) => {
  return quest.collectedAt !== null;
};

export const isQuestCollectable = (quest: Quest) => {
  return wasQuestCompleted(quest) && !wasQuestCollected(quest);
};
