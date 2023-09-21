import { useCurrentServer } from 'hooks/game/use-current-server';
import { Tribe } from 'interfaces/models/game/tribe';

export const useTribe = () => {
  const { server } = useCurrentServer();
  const tribe: Tribe | undefined = server?.configuration?.tribe;

  return {
    tribe
  };
};
