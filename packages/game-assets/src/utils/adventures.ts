import type { Server } from '@pillage-first/types/models/server';

const HOUR_IN_MS = 60 * 60 * 1000;
const WEEK_IN_MS = 7 * 24 * HOUR_IN_MS;
const MONTH_IN_MS = 30 * 24 * HOUR_IN_MS;

const getAdventurePointBaseFrequencyHours = (serverAgeMs: number): number => {
  if (serverAgeMs < WEEK_IN_MS) {
    return 8;
  }

  if (serverAgeMs < MONTH_IN_MS) {
    return 16;
  }

  return 24;
};

/**
 * Calculates adventure point increase frequency based on server duration and speed.
 *
 * - If server duration is less than 1 week: 1 point every 8 hours
 * - If server duration is between 1 week and 1 month: 1 point every 16 hours
 * - From 1 month onwards: 1 point every 24 hours
 *
 * All values are for 1x servers and scale with server speed.
 * The result is returned in milliseconds.
 */
export const calculateAdventurePointIncreaseEventDuration = (
  createdAt: number,
  serverSpeed: Server['configuration']['speed'],
): number => {
  const serverAgeMs = Date.now() - new Date(createdAt).getTime();
  const baseFrequencyHours = getAdventurePointBaseFrequencyHours(serverAgeMs);

  return Math.trunc((baseFrequencyHours / serverSpeed) * HOUR_IN_MS);
};

const countCompletedIntervalsInSegment = (
  segmentStartAt: number,
  segmentEndAt: number,
  intervalDuration: number,
  fromTimestamp: number,
  toTimestamp: number,
): number => {
  const effectiveFrom = Math.max(fromTimestamp, segmentStartAt);
  const effectiveTo = Math.min(toTimestamp, segmentEndAt);

  if (effectiveTo <= effectiveFrom) {
    return 0;
  }

  const firstCompletedIntervalIndex =
    Math.floor((effectiveFrom - segmentStartAt) / intervalDuration) + 1;
  const lastCompletedIntervalIndex = Math.floor(
    (effectiveTo - segmentStartAt) / intervalDuration,
  );

  return Math.max(
    0,
    lastCompletedIntervalIndex - firstCompletedIntervalIndex + 1,
  );
};

const getAdventurePointIncreaseSchedule = (
  createdAt: number,
  serverSpeed: Server['configuration']['speed'],
) => {
  const firstPhaseDuration = Math.trunc((8 / serverSpeed) * HOUR_IN_MS);
  const secondPhaseDuration = Math.trunc((16 / serverSpeed) * HOUR_IN_MS);
  const thirdPhaseDuration = Math.trunc((24 / serverSpeed) * HOUR_IN_MS);
  const secondPhaseStartAt = createdAt + WEEK_IN_MS;
  const thirdPhaseStartAt =
    secondPhaseStartAt +
    Math.ceil((MONTH_IN_MS - WEEK_IN_MS) / secondPhaseDuration) *
      secondPhaseDuration;

  return {
    firstPhaseDuration,
    secondPhaseDuration,
    thirdPhaseDuration,
    secondPhaseStartAt,
    thirdPhaseStartAt,
  };
};

export const calculateAdventurePointsEarnedBetween = (
  createdAt: number,
  serverSpeed: Server['configuration']['speed'],
  fromTimestamp: number,
  toTimestamp: number,
): number => {
  if (toTimestamp <= fromTimestamp) {
    return 0;
  }

  const {
    firstPhaseDuration,
    secondPhaseDuration,
    thirdPhaseDuration,
    secondPhaseStartAt,
    thirdPhaseStartAt,
  } = getAdventurePointIncreaseSchedule(createdAt, serverSpeed);

  return (
    countCompletedIntervalsInSegment(
      createdAt,
      secondPhaseStartAt,
      firstPhaseDuration,
      fromTimestamp,
      toTimestamp,
    ) +
    countCompletedIntervalsInSegment(
      secondPhaseStartAt,
      thirdPhaseStartAt,
      secondPhaseDuration,
      fromTimestamp,
      toTimestamp,
    ) +
    countCompletedIntervalsInSegment(
      thirdPhaseStartAt,
      Number.POSITIVE_INFINITY,
      thirdPhaseDuration,
      fromTimestamp,
      toTimestamp,
    )
  );
};

const getSegmentForTimestamp = (
  createdAt: number,
  timestamp: number,
  serverSpeed: Server['configuration']['speed'],
) => {
  const {
    firstPhaseDuration,
    secondPhaseDuration,
    thirdPhaseDuration,
    secondPhaseStartAt,
    thirdPhaseStartAt,
  } = getAdventurePointIncreaseSchedule(createdAt, serverSpeed);

  if (timestamp < secondPhaseStartAt) {
    return {
      segmentStartAt: createdAt,
      intervalDuration: firstPhaseDuration,
    };
  }

  if (timestamp < thirdPhaseStartAt) {
    return {
      segmentStartAt: secondPhaseStartAt,
      intervalDuration: secondPhaseDuration,
    };
  }

  return {
    segmentStartAt: thirdPhaseStartAt,
    intervalDuration: thirdPhaseDuration,
  };
};

export const calculateNextAdventurePointIncreaseAt = (
  createdAt: number,
  serverSpeed: Server['configuration']['speed'],
  timestamp: number,
): number => {
  const { intervalDuration, segmentStartAt } = getSegmentForTimestamp(
    createdAt,
    timestamp,
    serverSpeed,
  );

  return (
    segmentStartAt +
    (Math.floor((timestamp - segmentStartAt) / intervalDuration) + 1) *
      intervalDuration
  );
};
