import { useVillages } from 'app/(game)/hooks/use-villages';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useHero } from 'app/(game)/hooks/use-hero';
import { use } from 'react';

export const useArtifacts = () => {
  const { playerVillages } = useVillages();
  const { currentVillage } = use(CurrentVillageContext);
  const { hero } = useHero();

  const assignedArtifacts = playerVillages.map(({ artifactId }) => artifactId).filter(Boolean);
  const isGreatBuildingsArtifactActive = assignedArtifacts.includes('EPIC_ARTIFACT_CIVIL_ENABLE_GREAT_BUILDINGS');
  const availableArtifacts = hero.inventory.filter(({ category }) => category === 'artifact');

  const currentVillageArtifactId = currentVillage.artifactId;
  const hasCurrentVillageArtifact = !!currentVillageArtifactId;

  return {
    assignedArtifacts,
    isGreatBuildingsArtifactActive,
    currentVillageArtifactId,
    availableArtifacts,
    hasCurrentVillageArtifact,
  };
};
