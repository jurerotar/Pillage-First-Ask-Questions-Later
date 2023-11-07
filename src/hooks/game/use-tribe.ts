import { useCurrentServer } from 'hooks/game/use-current-server';

export const useTribe = () => {
  const { server } = useCurrentServer();
  const { tribe } = server!.playerConfiguration;

  return {
    tribe
  };
};
