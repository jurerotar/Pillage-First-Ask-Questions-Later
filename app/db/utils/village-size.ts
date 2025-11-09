import type { VillageSize } from 'app/interfaces/models/game/village';

const buildVillageSizeLookup = (): VillageSize[] => {
  const bands: VillageSize[] = [
    'xxs',
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
  ];

  const widths = [16, 15, 14, 14, 14, 13, 6, 5, 4];

  const result: VillageSize[] = Array.from({ length: 101 });

  let idx = 0;
  for (let bi = 0; bi < bands.length; bi += 1) {
    const band = bands[bi];
    const w = widths[bi];
    for (let j = 0; j < w; j += 1) {
      idx += 1;
      result[idx] = band;
    }
  }

  return result;
};

const villageSizeLookup = buildVillageSizeLookup();

const buildLookupTable = (mapSize: number, tableSize = 2048) => {
  const maxR = mapSize / 2;
  const maxD2 = maxR * maxR;
  const step = maxD2 / tableSize;

  // table maps index -> bucket (0..100)
  const table = new Uint8Array(tableSize);
  for (let i = 0; i < tableSize; i += 1) {
    const d2 = (i + 0.5) * step;
    const rel = Math.floor((Math.sqrt(d2) / maxR) * 100);
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
