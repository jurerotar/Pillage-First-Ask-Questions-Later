import { useVillages } from 'app/(game)/hooks/use-villages';

export const useArtifacts = () => {
  const { playerVillages } = useVillages();
  const artifacts = playerVillages.map(({ artifactId }) => artifactId).filter(Boolean);

  const hasGreatBuildingsArtifact = artifacts.includes('CIVIL_ENABLE_GREAT_BUILDINGS');

  return {
    artifacts,
    hasGreatBuildingsArtifact,
  };
};
