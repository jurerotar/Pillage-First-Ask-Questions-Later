import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { useUnitImprovement } from 'app/(game)/(village-slug)/hooks/use-unit-improvement';
import { Button } from 'app/components/ui/button';
import { Icon } from 'app/components/icon';
import type { Unit } from 'app/interfaces/models/game/unit';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateUnitUpgradeCostForLevel, getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { unitIdToUnitIconMapper } from 'app/utils/icon';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { Text } from 'app/components/text';

type UnitImprovementCardProps = {
  unitId: Unit['id'];
};

export const UnitImprovementCard: React.FC<UnitImprovementCardProps> = ({ unitId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { isDeveloperModeEnabled } = useDeveloperMode();
  const { unitImprovements, upgradeUnitTier } = useUnitImprovement();
  const { wood, clay, iron, wheat } = use(CurrentVillageStateContext);
  const { currentVillage } = useCurrentVillage();

  const { tier } = getUnitData(unitId)!;

  const { level: upgradeLevel } = unitImprovements.find(({ tier: researchTier }) => researchTier === tier)!;

  const isMaxLevel = upgradeLevel === 20;

  const upgradeCost = calculateUnitUpgradeCostForLevel(unitId, upgradeLevel);

  const hasEnoughResourcesToUpgrade = (() => {
    if (isDeveloperModeEnabled) {
      return true;
    }

    return wood >= upgradeCost[0] && clay >= upgradeCost[1] && iron >= upgradeCost[2] && wheat >= upgradeCost[3];
  })();

  const academyLevel = currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'ACADEMY')?.level ?? 0;
  const isAcademyLevelHigherThanNextUpgradeLevel = academyLevel >= upgradeLevel + 1;

  const canUpgrade = hasEnoughResourcesToUpgrade && isAcademyLevelHigherThanNextUpgradeLevel;

  return (
    <article className="flex flex-col p-2 border border-gray-500">
      {/* TODO: This first section is shared between UnitCard, it should probably be extracted */}
      <section className="pb-2">
        <div className="inline-flex gap-2 items-center font-semibold">
          <Text as="h2">{assetsT(`UNITS.${unitId}.NAME`, { count: 1, unitId })}</Text>
          <span className="text-sm text-orange-500">{t('Level {{level}}', { level: upgradeLevel })}</span>
        </div>
        <div className="flex justify-center items-center mr-1 mb-1 float-left size-10 md:size-14">
          <Icon
            className="size-full"
            type={unitIdToUnitIconMapper(unitId)}
          />
        </div>
        <Text as="p">{assetsT(`UNITS.${unitId}.DESCRIPTION`)}</Text>
      </section>

      <section className="flex flex-col gap-2 py-2 border-t border-gray-200">
        {isMaxLevel && <span className="text-orange-500">{t('Max level reached')}</span>}
        {!isMaxLevel && (
          <>
            <Text as="h3">{t('Upgrade cost for level {{level}}', { level: upgradeLevel + 1 })}</Text>
            <Resources resources={upgradeCost} />
          </>
        )}
      </section>
      {!isMaxLevel && (
        <section className="flex flex-col gap-2 pt-2 border-t border-gray-200">
          <Text as="h3">{t('Available actions')}</Text>
          <Button
            variant="default"
            disabled={canUpgrade}
            onClick={() => upgradeUnitTier(tier)}
          >
            {t('Upgrade to {{level}}', { level: upgradeLevel + 1 })}
          </Button>
        </section>
      )}
    </article>
  );
};
