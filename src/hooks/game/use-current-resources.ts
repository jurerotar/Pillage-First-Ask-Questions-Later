import { useCurrentVillage } from 'hooks/game/use-current-village';

// TODO: Finish this
export const useCurrentResources = () => {
  const { currentVillage: { resources } } = useCurrentVillage();
  return {
    resources
  };
};
