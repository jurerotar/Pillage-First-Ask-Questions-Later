import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type { Effect } from 'app/interfaces/models/game/effect';
import type React from 'react';
import { isArtifactEffect, isBuildingEffect, isHeroEffect, isVillageEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Text } from 'app/components/text';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { useTranslation } from 'react-i18next';
import { normalizeForcedFloatValue } from 'app/utils/common';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';

const formatBonus = (number: number) => {
  return Math.trunc(normalizeForcedFloatValue(number) * 100);
};

type ResourceBoosterBenefitsProps = {
  effectId: Effect['id'];
};

export const ProductionOverview: React.FC<ResourceBoosterBenefitsProps> = ({ effectId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { effects } = useEffects();

  const { value: serverValue } = effects.find(({ scope, id }) => scope === 'server' && id === effectId)!;

  const effectsAffectingCurrentVillage = effects.filter(
    (effect) =>
      effect.id === effectId && (effect.scope === 'global' || (isVillageEffect(effect) && effect.villageId === currentVillage.id)),
  );
  const buildingEffects = effectsAffectingCurrentVillage.filter(isBuildingEffect);
  const artifactBonuses = effectsAffectingCurrentVillage.filter(isArtifactEffect);
  const heroEffects = effectsAffectingCurrentVillage.filter(isHeroEffect);

  const baseProductionEffects = buildingEffects.filter(({ value }) => Number.isInteger(value) && value > 0);
  const bonusProductionEffects = buildingEffects.filter(({ value }) => !Number.isInteger(value));

  const heroResourceProductionEffect = heroEffects.find(({ id }) => id === effectId)!;

  const hasHeroProductionBonus = normalizeForcedFloatValue(heroResourceProductionEffect.value) > 1;

  const summedBonusProductionValues = [...bonusProductionEffects, ...artifactBonuses].reduce(
    (accumulator, effect) => accumulator + normalizeForcedFloatValue(effect.value) - 1,
    0,
  );
  const summedBaseProductionValues = baseProductionEffects.reduce((accumulator, effect) => accumulator + effect.value * serverValue, 0);

  const hasBonusValues = summedBonusProductionValues > 0;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Production bonuses')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Source')}</TableHeaderCell>
              <TableHeaderCell>{t('Value')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasBonusValues && (
              <TableRow>
                <TableCell colSpan={2}>{t('No production bonuses')}</TableCell>
              </TableRow>
            )}
            {hasBonusValues && (
              <>
                {hasHeroProductionBonus && (
                  <TableRow>
                    <TableCell>{t('Hero production bonus')}</TableCell>
                    <TableCell>{formatBonus(heroResourceProductionEffect.value - 1)}%</TableCell>
                  </TableRow>
                )}
                {artifactBonuses.map(({ value, artifactId }) => (
                  <TableRow key={artifactId}>
                    <TableCell>
                      {t('Artifact')} - {assetsT(`ITEMS.${artifactId}.TITLE`)}
                    </TableCell>
                    <TableCell>{value - 1}%</TableCell>
                  </TableRow>
                ))}
                {bonusProductionEffects.map(({ value, buildingFieldId, buildingId }) => (
                  <TableRow key={buildingFieldId}>
                    <TableCell>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</TableCell>
                    <TableCell>{formatBonus(value - 1)}%</TableCell>
                  </TableRow>
                ))}
              </>
            )}
            <TableRow className="font-medium">
              <TableCell>{t('Total')}</TableCell>
              <TableCell>{formatBonus(summedBonusProductionValues)}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>

      <SectionContent>
        <Text as="h2">{t('Base production')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Source')}</TableHeaderCell>
              <TableHeaderCell>{t('Production')}</TableHeaderCell>
              <TableHeaderCell>{t('Bonus')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasHeroProductionBonus && (
              <TableRow>
                <TableCell>{t('Hero')}</TableCell>
                <TableCell>{heroResourceProductionEffect.value}</TableCell>
                <TableCell>0</TableCell>
              </TableRow>
            )}
            {baseProductionEffects.map(({ value, buildingFieldId, buildingId }) => (
              <TableRow key={buildingFieldId}>
                <TableCell>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</TableCell>
                <TableCell>{value}</TableCell>
                <TableCell>{Math.trunc(value * summedBonusProductionValues)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell>{t('Total')}</TableCell>
              <TableCell>{summedBaseProductionValues + (heroResourceProductionEffect?.value ?? 0)}</TableCell>
              <TableCell>
                {baseProductionEffects.reduce((acc, effect) => acc + Math.trunc(effect.value * summedBonusProductionValues), 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
