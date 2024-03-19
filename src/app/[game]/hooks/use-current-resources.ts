import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { Resource } from 'interfaces/models/game/resource';
import { useEffect } from 'react';
import { useEffects } from 'app/[game]/hooks/use-effects';

// TODO: Finish this
export const useCurrentResources = (resource: Resource) => {
  const {} = useEffects();
  const { currentVillage: { resources, lastUpdatedAt } } = useCurrentVillage();

  useEffect(() => {

  }, []);

  console.log(resources, lastUpdatedAt);

  return {
    resources,
  };
};
