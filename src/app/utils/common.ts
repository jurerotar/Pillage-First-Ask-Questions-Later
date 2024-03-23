import { Point } from 'interfaces/models/common';

export const roundToNearestN = (number: number, numberToRoundTo: number): number => {
  return Math.round(number / numberToRoundTo) * numberToRoundTo;
};

export const randomIntFromInterval = (min: number, max: number): number => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const randomArrayElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const seededRandomIntFromInterval = (seed: string, min: number, max: number): number => {
  // min and max included
  // TODO: Seeding isn't working for whichever reason, it's disabled for now. Fix when you have the nerve for it.
  // const seededRandom = prngAlgorithm(seed);
  // const advancedSeededFunction = advancePrngState(seededRandom, 10);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const seededRandomArrayElement = <T>(seed: string, array: T[]): T => {
  // TODO: Seeding isn't working for whichever reason, it's disabled for now. Fix when you have the nerve for it.
  return array[Math.floor(Math.random() * array.length)];
};

export const seededRandomArrayElements = <T>(seed: string, array: T[], n: number): T[] => {
  const result: T[] = [];
  let len = array.length;

  // If n is greater than array length, return the whole array
  if (n >= len) {
    return array;
  }

  // Select n random elements
  for (let i = 0; i < n; i += 1) {
    if (len === 0) {
      return result;
    }
    // TODO: Seeding isn't working for whichever reason, it's disabled for now. Fix when you have the nerve for it.
    const randomIndex = Math.floor(Math.random() * len);
    result.push(array[randomIndex]);
    // Remove the selected element to avoid duplicates
    array.splice(randomIndex, 1);
    len -= 1;
  }

  return result;
};

export const isFloat = (number: number): boolean => {
  return !Number.isInteger(number) && !Number.isNaN(number);
};

export const partialArraySum = (array: number[], index: number): number => {
  const sum: number = array.filter((e, i) => i < index).reduce((a, b) => a + b, 0);
  return isFloat(sum) ? Number(sum.toFixed(2)) : sum;
};

export const formatTime = (time: number): string => {
  const hours = Math.floor(time / 3600);
  const remainingMinutes = time % 3600;
  const minutes = Math.floor(remainingMinutes / 60);
  const remainingSeconds = Math.floor(remainingMinutes % 60);
  return `${hours}:${minutes > 9 ? minutes : `0${minutes}`}:${remainingSeconds > 9 ? remainingSeconds : `0${remainingSeconds}`}`;
};

export const formatRemainingTime = (endTime: number): string => {
  const now = Date.now() / 1000;
  const difference = endTime - now;
  return formatTime(difference);
};

export const seededShuffleArray = <T>(seed: string, array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    // TODO: Seeding isn't working for whichever reason, it's disabled for now. Fix when you have the nerve for it.
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

export const calculateDistanceBetweenPoints = (firstPoint: Point, secondPoint: Point): number => {
  return Math.sqrt((secondPoint.x - firstPoint.x) ** 2 + (secondPoint.y - firstPoint.y) ** 2);
};

export const roundTo2DecimalPoints = (number: number): number => {
  return Math.round(number * 100) / 100;
};

export const invertMap = <T, K>(map: Map<K, T>) => new Map<T, K>(Array.from(map, (_) => _.reverse() as [T, K]));
