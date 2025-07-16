import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type { Effect } from 'app/interfaces/models/game/effect';
import type React from 'react';
import {
  isArtifactEffect,
  isBuildingEffect,
  isHeroEffect,
  isOasisEffect,
  isServerEffect,
  isVillageEffect,
} from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useTranslation } from 'react-i18next';
import { normalizeForcedFloatValue } from 'app/utils/common';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';

const formatBonus = (number: number): number => {
  return Math.trunc(normalizeForcedFloatValue(number) * 100);
};

type ResourceBoosterBenefitsProps = {
  effectId: Effect['id'];
};

export const ProductionOverview: React.FC<ResourceBoosterBenefitsProps> = ({
  effectId,
}) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { effects } = useEffects();

  const relevantEffects = effects.filter(({ id }) => id === effectId);

  const { value: serverValue } = relevantEffects.find(isServerEffect)!;

  const effectsAffectingCurrentVillage = relevantEffects.filter(
    (effect) =>
      effect.scope === 'global' ||
      (isVillageEffect(effect) && effect.villageId === currentVillage.id),
  );

  const baseProductionEffects = effectsAffectingCurrentVillage.filter(
    ({ value }) => Number.isInteger(value) && value > 0,
  );
  const bonusProductionEffects = effectsAffectingCurrentVillage.filter(
    ({ value }) => !Number.isInteger(value),
  );

  const buildingBaseProductionEffects =
    baseProductionEffects.filter(isBuildingEffect);
  const heroBaseProductionEffects = baseProductionEffects.filter(isHeroEffect);

  const oasisBonusProductionEffects =
    bonusProductionEffects.filter(isOasisEffect);
  const buildingBonusProductionEffects =
    bonusProductionEffects.filter(isBuildingEffect);
  const heroBonusProductionEffects =
    bonusProductionEffects.filter(isHeroEffect);
  const artifactBonusProductionEffects =
    effectsAffectingCurrentVillage.filter(isArtifactEffect);

  const summedBonusProductionValues = [
    ...oasisBonusProductionEffects,
    ...buildingBonusProductionEffects,
    ...heroBonusProductionEffects,
    ...artifactBonusProductionEffects,
  ].reduce(
    (accumulator, effect) =>
      accumulator + normalizeForcedFloatValue(effect.value) - 1,
    0,
  );

  const summedBaseProductionValues = [
    ...heroBaseProductionEffects,
    ...buildingBaseProductionEffects,
  ].reduce(
    (accumulator, effect) => accumulator + effect.value * serverValue,
    0,
  );

  const hasBonusValues = summedBonusProductionValues > 0;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Production bonuses')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Source')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Value')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasBonusValues && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Text>{t('No production bonuses')}</Text>
                </TableCell>
              </TableRow>
            )}
            {hasBonusValues && (
              <>
                {heroBonusProductionEffects.map(({ id, value }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <Text>{t('Hero production bonus')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatBonus(value - 1)}%</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {artifactBonusProductionEffects.map(({ value, artifactId }) => (
                  <TableRow key={artifactId}>
                    <TableCell>
                      <Text>
                        {t('Artifact')} - {assetsT(`ITEMS.${artifactId}.TITLE`)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text>{value - 1}%</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {oasisBonusProductionEffects.map(({ oasisId, value }) => (
                  <TableRow key={oasisId}>
                    <TableCell>
                      <Text>{t('Oasis')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatBonus(value - 1)}%</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {buildingBonusProductionEffects.map(
                  ({ value, buildingFieldId, buildingId }) => (
                    <TableRow key={buildingFieldId}>
                      <TableCell>
                        <Text>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{formatBonus(value - 1)}%</Text>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </>
            )}
            <TableRow className="font-medium">
              <TableCell>
                <Text>{t('Total')}</Text>
              </TableCell>
              <TableCell>
                <Text>{formatBonus(summedBonusProductionValues)}%</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>

      <SectionContent>
        <Text as="h2">{t('Base production')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Source')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Production')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Bonus')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heroBaseProductionEffects.map(({ id, value }) => (
              <TableRow key={id}>
                <TableCell>
                  <Text>{t('Hero')}</Text>
                </TableCell>
                <TableCell>
                  <Text>{value}</Text>
                </TableCell>
                <TableCell>
                  <Text>{Math.trunc(value * summedBonusProductionValues)}</Text>
                </TableCell>
              </TableRow>
            ))}
            {buildingBaseProductionEffects.map(
              ({ value, buildingFieldId, buildingId }) => (
                <TableRow key={buildingFieldId}>
                  <TableCell>
                    <Text>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{value}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>
                      {Math.trunc(value * summedBonusProductionValues)}
                    </Text>
                  </TableCell>
                </TableRow>
              ),
            )}
            <TableRow className="font-medium">
              <TableCell>
                <Text>{t('Total')}</Text>
              </TableCell>
              <TableCell>
                <Text>
                  {summedBaseProductionValues +
                    (heroBaseProductionEffects[0]?.value ?? 0)}
                </Text>
              </TableCell>
              <TableCell>
                <Text>
                  {baseProductionEffects.reduce(
                    (acc, effect) =>
                      acc +
                      Math.trunc(effect.value * summedBonusProductionValues),
                    0,
                  )}
                </Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
