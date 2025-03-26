import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';

export const useTribe = () => {
  const {
    server: {
      playerConfiguration: { tribe },
    },
  } = useServer();

  return {
    tribe,
  };
};
