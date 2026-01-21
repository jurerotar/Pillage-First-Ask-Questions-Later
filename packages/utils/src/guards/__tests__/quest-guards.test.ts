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
    expect(isResourceQuestReward(resourceQuestRewardMock)).toBeTruthy();
    expect(isResourceQuestReward(heroExperienceQuestRewardMock)).toBeFalsy();
  });

  test('should identify hero experience quest rewards', () => {
    expect(isHeroExperienceQuestReward(heroExperienceQuestRewardMock)).toBe(
      true,
    );
    expect(isHeroExperienceQuestReward(resourceQuestRewardMock)).toBeFalsy();
  });

  test('should identify hero item quest rewards', () => {
    expect(isHeroItemQuestReward(heroItemQuestRewardMock)).toBeTruthy();
    expect(isHeroItemQuestReward(resourceQuestRewardMock)).toBeFalsy();
  });

  test('should identify if quest was collected', () => {
    expect(wasQuestCollected({ ...questMock, collectedAt: Date.now() })).toBe(
      true,
    );
    expect(wasQuestCollected({ ...questMock, collectedAt: null })).toBeFalsy();
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

    expect(isQuestCollectable(completedNotCollected)).toBeTruthy();
    expect(isQuestCollectable(notCompletedNotCollected)).toBeFalsy();
    expect(isQuestCollectable(completedAndCollected)).toBeFalsy();
  });
});
