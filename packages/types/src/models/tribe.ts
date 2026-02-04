import { z } from 'zod';

export type Tribe =
  | 'gauls'
  | 'romans'
  | 'teutons'
  | 'egyptians'
  | 'huns'
  | 'spartans'
  | 'nature'
  | 'natars';

export const tribeSchema = z.enum([
  'gauls',
  'romans',
  'teutons',
  'egyptians',
  'huns',
]).meta({ id: 'Tribe' });

export type PlayableTribe = z.infer<typeof tribeSchema>;
