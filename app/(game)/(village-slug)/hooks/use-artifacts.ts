import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import type { ArtifactId } from 'app/interfaces/models/game/hero';

export const useArtifacts = () => {
  const { hero } = useHero();

  // const assignedArtifacts = playerVillages
  //   .map(({ artifactId }) => artifactId)
  //   .filter(Boolean);

  const assignedArtifacts: ArtifactId[] = [];

  const isGreatBuildingsArtifactActive = assignedArtifacts.includes(
    'EPIC_ARTIFACT_CIVIL_ENABLE_GREAT_BUILDINGS',
  );
  const availableArtifacts = hero.inventory.filter(
    ({ category }) => category === 'artifact',
  );

  const currentVillageArtifactId = null;
  const hasCurrentVillageArtifact = !!currentVillageArtifactId;

  return {
    assignedArtifacts,
    isGreatBuildingsArtifactActive,
    currentVillageArtifactId,
    availableArtifacts,
    hasCurrentVillageArtifact,
  };
};
