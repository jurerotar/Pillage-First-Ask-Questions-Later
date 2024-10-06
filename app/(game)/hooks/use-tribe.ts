import { useCurrentServer } from 'app/(game)/hooks/use-current-server';

export const useTribe = () => {
  const {
    server: {
      playerConfiguration: { tribe },
    },
  } = useCurrentServer();

  return {
    tribe,
  };
};
