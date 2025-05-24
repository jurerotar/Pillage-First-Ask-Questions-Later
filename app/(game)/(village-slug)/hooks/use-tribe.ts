import { usePlayers } from 'app/(game)/(village-slug)/hooks/use-players';

export const useTribe = () => {
  const { currentPlayer } = usePlayers();

  const tribe = currentPlayer.tribe;

  return {
    tribe,
  };
};
