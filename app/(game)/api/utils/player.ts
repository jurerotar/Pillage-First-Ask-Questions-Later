import { z } from 'zod';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { PLAYER_ID } from 'app/constants/player';
import type { DbFacade } from 'app/(game)/api/database-facade';

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
  database: DbFacade,
): z.infer<typeof getCurrentPlayerSchema> => {
  const row = database.selectObject(
    'SELECT id, name, slug, tribe FROM players WHERE id = $player_id',
    {
      $player_id: PLAYER_ID,
    },
  );

  return getCurrentPlayerSchema.parse(row);
};
