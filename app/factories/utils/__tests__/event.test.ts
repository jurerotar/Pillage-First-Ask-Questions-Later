import { serverMock } from 'app/tests/mocks/game/server-mock';
import { describe, expect, test } from 'vitest';
import { calculateAdventurePointIncreaseEventDuration } from 'app/factories/utils/event';
import type { Server } from 'app/interfaces/models/game/server';

describe('calculateAdventurePointIncreaseFrequency', () => {
  test('should return event duration of 8 hours for server younger than 1 week (1x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days old
    } satisfies Server;

    expect(calculateAdventurePointIncreaseEventDuration(testServer)).toBe(
      8 * 60 * 60 * 1000,
    );
  });

  test('should return event duration of 16 hours for server younger than 1 month (1x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days old
    } satisfies Server;

    expect(calculateAdventurePointIncreaseEventDuration(testServer)).toBe(
      16 * 60 * 60 * 1000,
    );
  });

  test('should return event duration of 24 hours for server older than 1 month (1x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000, // 40 days old
    } satisfies Server;

    expect(calculateAdventurePointIncreaseEventDuration(testServer)).toBe(
      24 * 60 * 60 * 1000,
    );
  });

  test('should return event duration of 4 hours for server younger than 1 week (2x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days old
      configuration: {
        ...serverMock.configuration,
        speed: 2,
      },
    } satisfies Server;

    expect(calculateAdventurePointIncreaseEventDuration(testServer)).toBe(
      (8 / 2) * 60 * 60 * 1000,
    );
  });
});
