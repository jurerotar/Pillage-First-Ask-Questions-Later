import { useVillages } from 'app/(game)/hooks/use-villages';
import { useCurrentVillage } from 'app/(game)/hooks/current-village/use-current-village';
import { useHero } from 'app/(game)/hooks/use-hero';

export const useArtifacts = () => {
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
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
