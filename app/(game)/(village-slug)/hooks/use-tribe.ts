import { useCurrentPlayer } from 'app/(game)/(village-slug)/hooks/use-current-player';

export const useTribe = () => {
  const { currentPlayer } = useCurrentPlayer();

  const tribe = currentPlayer.tribe;

  return {
    tribe,
  };
};
