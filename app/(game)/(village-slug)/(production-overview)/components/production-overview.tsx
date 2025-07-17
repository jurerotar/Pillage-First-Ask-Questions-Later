import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type {
  ArtifactEffect,
  HeroEffect,
  OasisEffect,
  ResourceProductionEffectId,
  VillageBuildingEffect
} from 'app/interfaces/models/game/effect';
import type React from 'react';
import {
  isArtifactEffect,
  isBuildingEffect,
  isHeroEffect,
  isOasisBoosterEffect,
  isOasisEffect,
  isServerEffect,
} from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
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
import { normalizeForcedFloatValue, partition } from 'app/utils/common';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Link } from 'react-router';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { parseCoordinatesFromTileId } from 'app/utils/map';

const formatBonus = (number: number): number => {
  return Math.trunc(normalizeForcedFloatValue(number) * 10000) / 100;
};

type ResourceBoosterBenefitsProps = {
  effectId: ResourceProductionEffectId;
};

export const ProductionOverview: React.FC<ResourceBoosterBenefitsProps> = ({
                                                                             effectId,
                                                                           }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { effects } = useEffects();
  const { mapPath } = useGameNavigation();

  // TODO: There's 10 array loops in a row here. It's not really an issue, because we usually loop through only a couple of objects, but you still might want to clean this up sometime

  const relevantEffects = effects.filter(({ id }) => id === effectId || id === `${effectId}OasisBonus`);

  const serverEffectValue = relevantEffects.find(isServerEffect)?.value ?? 1;

  // Waterworks needs to be excluded, because it does not provide a value by itself, but rather enhances oasis
  const buildingEffects = relevantEffects.filter(isBuildingEffect).filter(({ buildingId }) => buildingId !== 'WATERWORKS');
  const heroEffects = relevantEffects.filter(isHeroEffect);
  const artifactEffects = relevantEffects.filter(isArtifactEffect);
  const oasisEffects = relevantEffects.filter(isOasisEffect);
  const oasisBoosterEffects = relevantEffects.filter(isOasisBoosterEffect);

  const [baseBuildingEffects, bonusBuildingEffects] = partition<VillageBuildingEffect>(buildingEffects, ({ value }) => Number.isInteger(value));
  const [baseHeroEffects, bonusHeroEffects] = partition<HeroEffect>(heroEffects, ({ value }) => Number.isInteger(value));
  const [baseArtifactEffects, bonusArtifactEffects] = partition<ArtifactEffect>(artifactEffects, ({ value }) => Number.isInteger(value));
  const [baseOasisEffects, bonusOasisEffects] = partition<OasisEffect>(oasisEffects, ({ value }) => Number.isInteger(value));
  const [, bonusOasisBoosterEffects] = partition<VillageBuildingEffect>(oasisBoosterEffects, ({ value }) => Number.isInteger(value));

  const hasBonuses = bonusBuildingEffects.length > 0
  || bonusHeroEffects.length > 0
  || bonusArtifactEffects.length > 0
  || bonusOasisEffects.length > 0
  || bonusOasisBoosterEffects.length > 0;

  const hasBaseProduction = baseBuildingEffects.length > 0
    || baseHeroEffects.length > 0
    || baseArtifactEffects.length > 0
    || baseOasisEffects.length > 0;

  const summerBonusOasisBoosterEffectValue = bonusOasisBoosterEffects.reduce((acc, { value }) => acc + (value % 1), 1);

  const boostedOasisEffects = bonusOasisEffects.map((effect) => {
    return {
      ...effect,
      value: effect.value * summerBonusOasisBoosterEffectValue,
    };
  });

  const summedBaseEffectValue = [
    ...baseBuildingEffects,
    ...baseHeroEffects,
    ...baseArtifactEffects,
    ...baseOasisEffects,
  ].reduce((acc, { value }) => acc + value, 0);

  const summedBonusEffectValue = [
    ...bonusBuildingEffects,
    ...bonusHeroEffects,
    ...bonusArtifactEffects,
    ...boostedOasisEffects,
  ].reduce((acc, { value }) => acc + (value % 1), 0);

  const summedBaseBuildingEffectWithBonusValue = baseBuildingEffects.reduce((acc, { value }) => acc + Math.trunc(value * summedBonusEffectValue), 0);

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Production bonuses')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Type')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Source')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Amount')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasBonuses && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Text>{t('No production bonuses')}</Text>
                </TableCell>
              </TableRow>
            )}
            {hasBonuses && (
              <>
                {bonusHeroEffects.map(({ id, value }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <Text>{t('Hero')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>-</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatBonus(value - 1)}%</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {bonusArtifactEffects.map(({ value, artifactId }) => (
                  <TableRow key={artifactId}>
                    <TableCell>
                      <Text>
                        {t('Artifact')}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text>
                        {assetsT(`ITEMS.${artifactId}.TITLE`)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text>{value - 1}%</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {boostedOasisEffects.map(({ oasisId, value }) => {
                  const { x, y } = parseCoordinatesFromTileId(oasisId);

                  return (
                    <TableRow key={oasisId}>
                      <TableCell>
                        <Text>{t('Oasis')}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>
                          <Link className="underline" to={`${mapPath}?x=${x}&y=${y}`}>
                            {x}, {y}
                          </Link>
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text>{formatBonus(value - 1)}%</Text>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {bonusBuildingEffects.map(
                  ({ value, buildingFieldId, buildingId }) => (
                    <TableRow key={buildingFieldId}>
                      <TableCell>
                        <Text>{t('Building')}</Text>
                      </TableCell>
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
              <TableCell colSpan={2}>
                <Text>{t('Total')}</Text>
              </TableCell>
              <TableCell>
                <Text>{formatBonus(summedBonusEffectValue)}%</Text>
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
                <Text>{t('Type')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Source')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Amount')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Bonus')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasBaseProduction && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Text>{t('No resource production')}</Text>
                </TableCell>
              </TableRow>
            )}
            {hasBaseProduction && (
              <>
                {baseHeroEffects.map(({ id, value }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <Text>{t('Hero')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>-</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{value * serverEffectValue}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>0</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {baseArtifactEffects.map(({ value, artifactId }) => (
                  <TableRow key={artifactId}>
                    <TableCell>
                      <Text>{t('Artifact')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>
                        {assetsT(`ITEMS.${artifactId}.TITLE`)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text>{value * serverEffectValue}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>0</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {baseOasisEffects.map(({ value, oasisId }) => {
                  const { x, y } = parseCoordinatesFromTileId(oasisId);

                  return (
                    <TableRow key={oasisId}>
                      <TableCell>
                        <Text>{t('Oasis')}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>
                          <Link className="underline" to={`${mapPath}?x=${x}&y=${y}`}>
                            {x}, {y}
                          </Link>
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text>{value}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>0</Text>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {baseBuildingEffects.map(
                  ({ value, buildingFieldId, buildingId }) => (
                    <TableRow key={buildingFieldId}>
                      <TableCell>
                        <Text>{t('Building')}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{value * serverEffectValue}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>
                          {Math.trunc(value * summedBonusEffectValue)}
                        </Text>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </>
            )}
            <TableRow className="font-medium">
              <TableCell colSpan={2}>
                <Text>{t('Total')}</Text>
              </TableCell>
              <TableCell>
                <Text>
                  {summedBaseEffectValue}
                </Text>
              </TableCell>
              <TableCell>
                <Text>
                  {summedBaseBuildingEffectWithBonusValue}
                </Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
