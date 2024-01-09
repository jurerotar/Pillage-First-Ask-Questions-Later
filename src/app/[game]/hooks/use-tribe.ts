import { useCurrentServer } from 'app/[game]/hooks/use-current-server';

export const useTribe = () => {
  const { server } = useCurrentServer();
  const { tribe } = server!.playerConfiguration;

  return {
    tribe,
  };
};
