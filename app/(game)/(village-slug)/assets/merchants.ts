import type { Tribe } from 'app/interfaces/models/game/tribe';

type Merchant = {
  tribe: Tribe;
  merchantSpeed: number;
  merchantCapacity: number;
};

export const merchants: Merchant[] = [
  {
    tribe: 'gauls',
    merchantSpeed: 24,
    merchantCapacity: 750,
  },
  {
    tribe: 'romans',
    merchantSpeed: 16,
    merchantCapacity: 500,
  },
  {
    tribe: 'teutons',
    merchantSpeed: 12,
    merchantCapacity: 1000,
  },
  {
    tribe: 'huns',
    merchantSpeed: 20,
    merchantCapacity: 500,
  },
  {
    tribe: 'egyptians',
    merchantSpeed: 16,
    merchantCapacity: 750,
  },
  {
    tribe: 'spartans',
    merchantSpeed: 14,
    merchantCapacity: 500,
  },
  {
    tribe: 'nature',
    merchantSpeed: 12,
    merchantCapacity: 1500,
  },
  {
    tribe: 'natars',
    merchantSpeed: 12,
    merchantCapacity: 1500,
  },
];
