import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';

export const useTribe = () => {
  const { player } = useMe();

  return player.tribe;
};
