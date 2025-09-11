import type { Database } from 'app/interfaces/db';
import { z } from 'zod';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { PLAYER_ID } from 'app/constants/player';

const getCurrentPlayerSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: z.enum([
    'romans',
    'teutons',
    'gauls',
    'huns',
    'egyptians',
  ] satisfies PlayableTribe[]),
});

export const getCurrentPlayer = (
  database: Database,
): z.infer<typeof getCurrentPlayerSchema> => {
  const row = database.selectObject(
    'SELECT tribe FROM players WHERE id = $player_id',
    {
      $player_id: PLAYER_ID,
    },
  );

  return getCurrentPlayerSchema.parse(row);
};
