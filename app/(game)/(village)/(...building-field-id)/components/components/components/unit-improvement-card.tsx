import { Resources } from 'app/(game)/components/resources';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useUnitImprovement } from 'app/(game)/hooks/use-unit-improvement';
import { useCurrentResources } from 'app/(game)/providers/current-resources-provider';
import { units, unitsMap } from 'app/assets/units';
import { Button } from 'app/components/buttons/button';
import { Icon, unitIdToUnitIconMapper } from 'app/components/icon';
import type { Unit } from 'app/interfaces/models/game/unit';
import type React from 'react';
import { useTranslation } from 'react-i18next';

type UnitImprovementCardProps = {
  unitId: Unit['id'];
};

export const UnitImprovementCard: React.FC<UnitImprovementCardProps> = ({ unitId }) => {
  const { t } = useTranslation();
  const { tribe } = useTribe();
  const { isDeveloperModeActive } = useDeveloperMode();
  const { unitImprovements, upgradeUnitTier } = useUnitImprovement();
  const { wood, clay, iron, wheat } = useCurrentResources();
  const { currentVillage } = useCurrentVillage();

  const { tier, upgradeCostPerLevel } = unitsMap.get(unitId)!;
  const sameTierMercenaryUnits = units.filter((unit) => tier === unit.tier && tribe !== unit.tribe);

  const { level: upgradeLevel } = unitImprovements.find(({ tier: researchTier }) => researchTier === tier)!;

  const isMaxLevel = upgradeLevel === 20;

  // @ts-expect-error - this error will automatically be resolved when all units have upgradeCostPerLevel filled
  const upgradeCost = isMaxLevel ? [0, 0, 0, 0] : upgradeCostPerLevel[upgradeLevel];

  const hasEnoughResourcesToUpgrade = (() => {
    if (isDeveloperModeActive) {
      return true;
    }

    return wood >= upgradeCost[0] && clay >= upgradeCost[1] && iron >= upgradeCost[2] && wheat >= upgradeCost[3];
  })();

  const academyLevel = currentVillage.buildingFields.find(({ buildingId }) => buildingId === 'ACADEMY')?.level ?? 0;
  const isAcademyLevelHigherThanNextUpgradeLevel = academyLevel >= upgradeLevel + 1;

  const canUpgrade = hasEnoughResourcesToUpgrade && isAcademyLevelHigherThanNextUpgradeLevel;

  return (
    <article className="flex flex-col p-2 border border-gray-500">
      <section className="pb-2">
        <div className="inline-flex gap-2 items-center font-semibold">
          <h2 className="text-xl">{t(`UNITS.${unitId}.NAME`, unitId)}</h2>
          <span className="text-sm text-orange-500">{t('GENERAL.LEVEL', { level: upgradeLevel })}</span>
        </div>
        <div className="flex justify-center items-center mr-1 mb-1 float-left size-10 md:size-14">
          <Icon
            className="size-full"
            type={unitIdToUnitIconMapper(unitId)}
          />
        </div>
        <div className="text-gray-500 text-sm">
          <span>The following mercenary units will also receive an upgrade:</span>
          <ul className="flex flex-wrap gap-1">
            {sameTierMercenaryUnits.map(({ id }, index) => (
              <li key={id}>
                {t(`UNITS.${id}.NAME`, id)}
                {index !== sameTierMercenaryUnits.length - 1 && ','}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-2 py-2 border-t border-gray-200">
        {isMaxLevel && <span className="text-orange-500">Max level reached</span>}
        {!isMaxLevel && (
          <>
            <h2 className="font-medium">Upgrade cost for level {upgradeLevel + 1}</h2>
            <Resources resources={upgradeCost} />
          </>
        )}
      </section>
      {!isMaxLevel && (
        <section className="flex flex-col gap-2 pt-2 border-t border-gray-200">
          <h2 className="font-medium">Available actions</h2>
          <Button
            variant="confirm"
            disabled={!canUpgrade}
            onClick={() => upgradeUnitTier(tier)}
          >
            Upgrade to {upgradeLevel + 1}
          </Button>
        </section>
      )}
    </article>
  );
};
