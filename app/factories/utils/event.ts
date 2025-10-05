import type { Server } from 'app/interfaces/models/game/server';

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
) => {
  const serverDurationHours =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  let baseFrequency = 24;

  if (serverDurationHours < 7 * 24) {
    baseFrequency = 8;
  }

  if (serverDurationHours >= 7 * 24 && serverDurationHours < 30 * 24) {
    baseFrequency = 16;
  }

  return Math.trunc((baseFrequency / serverSpeed) * 60 * 60 * 1000);
};
