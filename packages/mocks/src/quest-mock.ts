import type {
  HeroExperienceQuestReward,
  HeroItemQuestReward,
  Quest,
  ResourceQuestReward,
} from '@pillage-first/types/models/quest';
import { villageMock } from './village-mock';

export const resourceQuestRewardMock: ResourceQuestReward = {
  type: 'resources',
  amount: 100,
};

export const heroExperienceQuestRewardMock: HeroExperienceQuestReward = {
  type: 'hero-exp',
  amount: 10,
};

export const heroItemQuestRewardMock: HeroItemQuestReward = {
  type: 'hero-item',
  amount: 1,
};

export const questMock: Quest = {
  id: 'oneOf-WOODCUTTER-1',
  scope: 'village',
  villageId: villageMock.id,
  completedAt: null,
  collectedAt: null,
};
