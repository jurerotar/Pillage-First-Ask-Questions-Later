import { useTranslation } from 'react-i18next';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { Unit } from '@pillage-first/types/models/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useUnitResearch } from 'app/(game)/(village-slug)/hooks/use-unit-research.ts';

export const useUnitRecruitmentErrorBag = (unitId: Unit['id']) => {
  const { t } = useTranslation();
  const { isUnitResearched } = useUnitResearch();
  const { id, recruitmentRequirements } = getUnitDefinition(unitId);
  const { currentVillage } = useCurrentVillage();

  const errorBag: string[] = [];

  if (!isUnitResearched(id)) {
    errorBag.push(
      t(
        'You need to research {{unitName}} at the {{academyName}} before you can begin training.',
        {
          unitName: t(`UNITS.${id}.NAME`),
          academyName: t('BUILDINGS.ACADEMY.NAME'),
        },
      ),
    );
  }

  for (const { buildingId, level } of recruitmentRequirements) {
    const hasSatisfiedBuildingRequirement = currentVillage.buildingFields.some(
      (buildingField) => {
        return (
          buildingField.buildingId === buildingId &&
          buildingField.level >= level
        );
      },
    );

    if (!hasSatisfiedBuildingRequirement) {
      errorBag.push(
        t(
          '{{unitName}} requires {{buildingName}} of level {{level}} or higher to train.',
          {
            unitName: t(`UNITS.${id}.NAME`),
            buildingName: t(`BUILDINGS.${buildingId}.NAME`),
            level,
          },
        ),
      );
    }
  }

  return {
    errorBag,
  };
};
