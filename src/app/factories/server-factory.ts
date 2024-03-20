import { Server } from 'interfaces/models/game/server';

type ServerFactoryProps = Pick<Server, 'name' | 'seed' | 'configuration' | 'playerConfiguration'>;

export const serverFactory = ({ name, seed, configuration, playerConfiguration }: ServerFactoryProps): Server => {
  const id = crypto.randomUUID();
  const slug = `s-${id.substring(0, 4)}`;

  return {
    id,
    name,
    seed,
    slug,
    createdAt: Date.now(),
    configuration,
    playerConfiguration,
    statistics: {
      lastLoggedInTime: null,
    },
  };
};
