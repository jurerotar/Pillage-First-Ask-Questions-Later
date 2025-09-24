import type { Server } from 'app/interfaces/models/game/server';
import { env } from 'app/env';

type ServerFactoryProps = Pick<
  Server,
  'name' | 'seed' | 'configuration' | 'playerConfiguration'
>;

export const serverFactory = ({
  name,
  seed,
  configuration,
  playerConfiguration,
}: ServerFactoryProps): Server => {
  const id = crypto.randomUUID();
  const slug = `s-${id.substring(0, 4)}`;

  return {
    id,
    version: env.VERSION,
    name,
    seed,
    slug,
    createdAt: Date.now(),
    configuration,
    playerConfiguration,
  };
};
