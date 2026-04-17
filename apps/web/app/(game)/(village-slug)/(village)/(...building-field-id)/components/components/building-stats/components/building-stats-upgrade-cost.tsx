import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type CalculatedCumulativeEffect,
  calculateBuildingCostForLevel,
  calculateBuildingEffectValues,
  calculateTotalCulturePointsForLevel,
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
  getBuildingFieldByBuildingFieldId,
} from '@pillage-first/game-assets/utils/buildings';
import type { Effect } from '@pillage-first/types/models/effect';
import { formatNumber, formatPercentage } from '@pillage-first/utils/format';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffectServerValue } from 'app/(game)/(village-slug)/hooks/use-effect-server-value.ts';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const increasingPercentageBuildingEffects = new Set<Effect['id']>([
  'merchantCapacity',
  'unitSpeedAfter20Fields',
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
  'defenceBonus',
  'defence',
]);

export const BuildingStatsUpgradeCost = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = use(BuildingFieldContext);

  const { buildingId, level } = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  )!;
  const building = getBuildingDefinition(buildingId);

  const cumulativeEffectsAtLevel1 = calculateBuildingEffectValues(building, 1);

  // In case we have both infantry and cavalry defence, we show combined defence icon instead
  const shouldCombineEffects =
    cumulativeEffectsAtLevel1.length > 0 &&
    cumulativeEffectsAtLevel1.every(
      ({ effectId }) =>
        effectId === 'infantryDefence' || effectId === 'cavalryDefence',
    );

  const effectsToShow = useMemo(() => {
    if (shouldCombineEffects) {
      const staticDefenceEffect = cumulativeEffectsAtLevel1.find(
        ({ effectId, type }) =>
          type === 'base' &&
          (effectId === 'infantryDefence' || effectId === 'cavalryDefence'),
      );
      const staticDefenceBonusEffect = cumulativeEffectsAtLevel1.find(
        ({ effectId, type }) =>
          type === 'bonus' &&
          (effectId === 'infantryDefence' || effectId === 'cavalryDefence'),
      );

      const effects: CalculatedCumulativeEffect[] = [];

      if (staticDefenceEffect) {
        effects.push({
          ...staticDefenceEffect,
          effectId: 'defence',
        } satisfies CalculatedCumulativeEffect);
      }

      if (staticDefenceBonusEffect) {
        effects.push({
          ...staticDefenceBonusEffect,
          effectId: 'defenceBonus',
        } satisfies CalculatedCumulativeEffect);
      }

      return effects;
    }

    return cumulativeEffectsAtLevel1;
  }, [shouldCombineEffects, cumulativeEffectsAtLevel1]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <Text as="h2">{t('Upgrade cost')}</Text>
        <Text>
          {t(
            'This section displays the resource costs required to upgrade a building at each level. It includes a breakdown of wood, clay, iron, and wheat needed for each level from 1 upward.',
          )}
        </Text>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Level')}</TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="wood"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="clay"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="iron"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="wheat"
                  />
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: building.maxLevel }, (_, index) => {
                const buildingLevel = index + 1;

                const cost = calculateBuildingCostForLevel(
                  building.id,
                  buildingLevel,
                );

                return (
                  <TableRow
                    // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                    key={index}
                    {...(buildingLevel === level && {
                      className: 'bg-muted',
                    })}
                  >
                    <TableHeaderCell>{buildingLevel}</TableHeaderCell>
                    <TableCell>{formatNumber(cost[0])}</TableCell>
                    <TableCell>{formatNumber(cost[1])}</TableCell>
                    <TableCell>{formatNumber(cost[2])}</TableCell>
                    <TableCell>{formatNumber(cost[3])}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text as="h2">{t('Upgrade benefits')}</Text>
        <Text>
          {t(
            'This section displays the benefits gained from upgrading a building at each level. It includes a breakdown of population, culture points, and other effects needed for each level from 1 upward.',
          )}
        </Text>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Level')}</TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="population"
                  />
                </TableHeaderCell>
                <TableHeaderCell>
                  <Icon
                    className="inline-flex size-6"
                    type="culturePoints"
                  />
                </TableHeaderCell>
                {effectsToShow.map((effect) => (
                  <TableHeaderCell key={effect.effectId}>
                    <Icon
                      className="inline-flex size-6"
                      type={effect.effectId}
                    />
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: building.maxLevel }, (_, index) => {
                const buildingLevel = index + 1;

                const totalPopulation = calculateTotalPopulationForLevel(
                  buildingId,
                  buildingLevel,
                );
                const totalCulturePoints = calculateTotalCulturePointsForLevel(
                  buildingId,
                  buildingLevel,
                );

                const cumulativeEffects = calculateBuildingEffectValues(
                  building,
                  buildingLevel,
                );

                const currentEffectsToShow = shouldCombineEffects
                  ? [
                      ...(cumulativeEffects.some(
                        ({ effectId, type }) =>
                          type === 'base' &&
                          (effectId === 'infantryDefence' ||
                            effectId === 'cavalryDefence'),
                      )
                        ? [
                            {
                              ...cumulativeEffects.find(
                                ({ effectId, type }) =>
                                  type === 'base' &&
                                  (effectId === 'infantryDefence' ||
                                    effectId === 'cavalryDefence'),
                              )!,
                              effectId: 'defence',
                            } as CalculatedCumulativeEffect,
                          ]
                        : []),
                      ...(cumulativeEffects.some(
                        ({ effectId, type }) =>
                          type === 'bonus' &&
                          (effectId === 'infantryDefence' ||
                            effectId === 'cavalryDefence'),
                      )
                        ? [
                            {
                              ...cumulativeEffects.find(
                                ({ effectId, type }) =>
                                  type === 'bonus' &&
                                  (effectId === 'infantryDefence' ||
                                    effectId === 'cavalryDefence'),
                              )!,
                              effectId: 'defenceBonus',
                            } as CalculatedCumulativeEffect,
                          ]
                        : []),
                    ]
                  : cumulativeEffects;

                return (
                  <TableRow
                    // biome-ignore lint/suspicious/noArrayIndexKey: It's a static list, it's fine
                    key={index}
                    {...(buildingLevel === level && {
                      className: 'bg-muted',
                    })}
                  >
                    <TableHeaderCell>{buildingLevel}</TableHeaderCell>
                    <TableCell>{formatNumber(totalPopulation)}</TableCell>
                    <TableCell>{formatNumber(totalCulturePoints)}</TableCell>
                    {currentEffectsToShow.map((effect) => (
                      <BenefitCell
                        key={effect.effectId}
                        effect={effect}
                      />
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

type BenefitCellProps = {
  effect: ReturnType<typeof calculateBuildingEffectValues>[number];
};

const BenefitCell = ({ effect }: BenefitCellProps) => {
  const { hasEffect, serverEffectValue } = useEffectServerValue(
    effect.effectId,
  );

  const formattingFn = effect.type === 'base' ? formatNumber : formatPercentage;
  const isIncreasing = increasingPercentageBuildingEffects.has(effect.effectId);
  const effectModifier =
    effect.type === 'base' && hasEffect ? serverEffectValue : 1;

  return (
    <TableCell>
      {formattingFn(
        Math.abs(effect.currentLevelValue * effectModifier),
        isIncreasing,
      )}
    </TableCell>
  );
};
