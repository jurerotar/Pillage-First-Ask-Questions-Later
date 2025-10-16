import type { VillageSize } from 'app/interfaces/models/game/village';

const buildVillageSizeLookup = (): VillageSize[] => {
  const bands: VillageSize[] = [
    'xxs', // 0–9
    'xs', // 10–19
    'sm', // 20–29
    'md', // 30–39
    'lg', // 40–49
    'xl', // 50–59
    '2xl', // 60–69
    '3xl', // 70–79
    '4xl', // 80–89
    '4xl', // 90–100 (larger outer band)
  ];

  const result: VillageSize[] = [];

  for (let i = 0; i <= 100; i += 1) {
    const bandIndex = Math.min(Math.floor(i / 10), bands.length - 1);
    result[i] = bands[bandIndex];
  }

  return result;
};

const villageSizeLookup = buildVillageSizeLookup();

const buildLookupTable = (mapSize: number, tableSize = 2048) => {
  const maxR = mapSize;
  const maxD2 = maxR * maxR;
  const step = maxD2 / tableSize;

  // table maps index -> bucket (0..100)
  const table = new Uint8Array(tableSize);
  for (let i = 0; i < tableSize; i += 1) {
    const d2 = (i + 0.5) * step;
    const rel = Math.floor((Math.sqrt(d2) / mapSize) * 100);
    table[i] = Math.min(100, Math.max(0, rel));
  }
  return {
    table,
    step,
    maxD2,
  };
};

const lookupCache = new Map<number, ReturnType<typeof buildLookupTable>>();

export const getVillageSize = (
  mapSize: number,
  x: number,
  y: number,
): VillageSize => {
  const key = Math.round(mapSize);
  let entry = lookupCache.get(key);
  if (!entry) {
    entry = buildLookupTable(mapSize, 4096);
    lookupCache.set(key, entry);
  }
  const { table, step, maxD2 } = entry;
  const d2 = x * x + y * y;
  if (d2 >= maxD2) {
    return villageSizeLookup[100];
  }

  const idx = Math.floor(d2 / step);
  const rel = table[idx];
  return villageSizeLookup[rel];
};
