import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';

// TODO: Finish this
export const useCurrentResources = () => {
  const {
    currentVillage: { resources },
  } = useCurrentVillage();
  return {
    resources,
  };
};
