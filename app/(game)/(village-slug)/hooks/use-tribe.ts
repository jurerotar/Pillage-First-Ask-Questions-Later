import { usePlayer } from 'app/(game)/(village-slug)/hooks/use-player';

export const useTribe = () => {
  const { player } = usePlayer();

  return player.tribe;
};
