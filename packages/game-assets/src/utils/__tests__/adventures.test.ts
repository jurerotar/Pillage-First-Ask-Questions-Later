import { describe, expect, test, vi } from 'vitest';
import { serverMock } from '@pillage-first/mocks/server';
import type { Server } from '@pillage-first/types/models/server';
import {
  calculateAdventurePointIncreaseEventDuration,
  calculateAdventurePointsEarnedBetween,
  calculateNextAdventurePointIncreaseAt,
} from '../adventures';

describe(calculateAdventurePointIncreaseEventDuration, () => {
  test('should return event duration of 8 hours for server younger than 1 week (1x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days old
    } satisfies Server;

    expect(
      calculateAdventurePointIncreaseEventDuration(
        testServer.createdAt,
        testServer.configuration.speed,
      ),
    ).toBe(8 * 60 * 60 * 1000);
  });

  test('should return event duration of 16 hours for server younger than 1 month (1x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days old
    } satisfies Server;

    expect(
      calculateAdventurePointIncreaseEventDuration(
        testServer.createdAt,
        testServer.configuration.speed,
      ),
    ).toBe(16 * 60 * 60 * 1000);
  });

  test('should return event duration of 24 hours for server older than 1 month (1x speed)', () => {
    const testServer = {
      ...serverMock,
      createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000, // 40 days old
    } satisfies Server;

    expect(
      calculateAdventurePointIncreaseEventDuration(
        testServer.createdAt,
        testServer.configuration.speed,
      ),
    ).toBe(24 * 60 * 60 * 1000);
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

    expect(
      calculateAdventurePointIncreaseEventDuration(
        testServer.createdAt,
        testServer.configuration.speed,
      ),
    ).toBe((8 / 2) * 60 * 60 * 1000);
  });

  test('uses game-time age to select the interval on a 10x world', () => {
    const hour = 60 * 60 * 1000;
    const weekAt10x = (7 * 24 * hour) / 10;
    const monthAt10x = (30 * 24 * hour) / 10;
    using clock = vi.spyOn(Date, 'now').mockReturnValue(weekAt10x - 1);

    expect(calculateAdventurePointIncreaseEventDuration(0, 10)).toBe(
      (8 * hour) / 10,
    );
    clock.mockReturnValue(weekAt10x);
    expect(calculateAdventurePointIncreaseEventDuration(0, 10)).toBe(
      (16 * hour) / 10,
    );
    clock.mockReturnValue(monthAt10x);
    expect(calculateAdventurePointIncreaseEventDuration(0, 10)).toBe(
      (24 * hour) / 10,
    );
  });

  test('should count earned points across server age brackets', () => {
    const createdAt = 0;

    expect(
      calculateAdventurePointsEarnedBetween(
        createdAt,
        1,
        createdAt,
        createdAt + 10 * 24 * 60 * 60 * 1000,
      ),
    ).toBe(25);
  });

  test('does not count an interval until it has completed', () => {
    const createdAt = 0;
    const eightHours = 8 * 60 * 60 * 1000;

    expect(
      calculateAdventurePointsEarnedBetween(
        createdAt,
        1,
        createdAt,
        createdAt + eightHours - 1,
      ),
    ).toBe(0);
    expect(
      calculateAdventurePointsEarnedBetween(
        createdAt,
        1,
        createdAt,
        createdAt + eightHours,
      ),
    ).toBe(1);
  });

  test('should calculate next point timestamp inside the mid-game bracket', () => {
    const createdAt = 0;
    const timestamp = createdAt + (7 * 24 + 5) * 60 * 60 * 1000;

    expect(calculateNextAdventurePointIncreaseAt(createdAt, 1, timestamp)).toBe(
      createdAt + (7 * 24 + 16) * 60 * 60 * 1000,
    );
  });

  test('moves to the next interval when queried exactly at an increase', () => {
    const createdAt = 0;
    const eightHours = 8 * 60 * 60 * 1000;

    expect(
      calculateNextAdventurePointIncreaseAt(
        createdAt,
        1,
        createdAt + eightHours,
      ),
    ).toBe(createdAt + 2 * eightHours);
  });
});

test.each([2, 10] as const)(
  'point accrual and countdown use game-time phase boundaries at %ix',
  (speed) => {
    const hour = (60 * 60 * 1000) / speed;
    const createdAt = 1_000_000;
    const weekEnd = createdAt + 7 * 24 * hour;
    const lastMidgamePoint = createdAt + (30 * 24 + 8) * hour;
    const firstLateGamePoint = lastMidgamePoint + 24 * hour;

    expect(
      calculateAdventurePointsEarnedBetween(
        createdAt,
        speed,
        createdAt,
        weekEnd,
      ),
    ).toBe(21);
    expect(
      calculateNextAdventurePointIncreaseAt(createdAt, speed, weekEnd),
    ).toBe(weekEnd + 16 * hour);
    expect(
      calculateNextAdventurePointIncreaseAt(
        createdAt,
        speed,
        lastMidgamePoint - 1,
      ),
    ).toBe(lastMidgamePoint);
    expect(
      calculateNextAdventurePointIncreaseAt(createdAt, speed, lastMidgamePoint),
    ).toBe(firstLateGamePoint);
    expect(
      calculateAdventurePointsEarnedBetween(
        createdAt,
        speed,
        weekEnd,
        firstLateGamePoint,
      ),
    ).toBe(36);
  },
);
