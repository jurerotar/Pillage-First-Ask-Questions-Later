import { describe, expect, test } from 'vitest';
import {
  heroExperienceQuestRewardMock,
  heroItemQuestRewardMock,
  questMock,
  resourceQuestRewardMock,
} from '@pillage-first/mocks/quest';
import {
  isHeroExperienceQuestReward,
  isHeroItemQuestReward,
  isQuestCollectable,
  isResourceQuestReward,
  wasQuestCollected,
} from '../quest-guards';

describe('quest guards', () => {
  test('should identify resource quest rewards', () => {
    expect(isResourceQuestReward(resourceQuestRewardMock)).toBe(true);
    expect(isResourceQuestReward(heroExperienceQuestRewardMock)).toBe(false);
  });

  test('should identify hero experience quest rewards', () => {
    expect(isHeroExperienceQuestReward(heroExperienceQuestRewardMock)).toBe(
      true,
    );
    expect(isHeroExperienceQuestReward(resourceQuestRewardMock)).toBe(false);
  });

  test('should identify hero item quest rewards', () => {
    expect(isHeroItemQuestReward(heroItemQuestRewardMock)).toBe(true);
    expect(isHeroItemQuestReward(resourceQuestRewardMock)).toBe(false);
  });

  test('should identify if quest was collected', () => {
    expect(wasQuestCollected({ ...questMock, collectedAt: Date.now() })).toBe(
      true,
    );
    expect(wasQuestCollected({ ...questMock, collectedAt: null })).toBe(false);
  });

  test('should identify if quest is collectable', () => {
    const completedNotCollected = {
      ...questMock,
      completedAt: Date.now(),
      collectedAt: null,
    };
    const notCompletedNotCollected = {
      ...questMock,
      completedAt: null,
      collectedAt: null,
    };
    const completedAndCollected = {
      ...questMock,
      completedAt: Date.now(),
      collectedAt: Date.now(),
    };

    expect(isQuestCollectable(completedNotCollected)).toBe(true);
    expect(isQuestCollectable(notCompletedNotCollected)).toBe(false);
    expect(isQuestCollectable(completedAndCollected)).toBe(false);
  });
});
