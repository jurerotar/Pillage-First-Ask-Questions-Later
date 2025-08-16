import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type {
  ArtifactEffect,
  Effect,
  HeroEffect,
  OasisEffect,
  ResourceProductionEffectId,
  VillageBuildingEffect,
} from 'app/interfaces/models/game/effect';
import type React from 'react';
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
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Link } from 'react-router';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { parseCoordinatesFromTileId } from 'app/utils/map';
import {
  isArtifactEffect,
  isBuildingEffect,
  isHeroEffect,
  isOasisEffect,
  isServerEffect,
} from 'app/(game)/(village-slug)/hooks/guards/effect-guards';

const formatBonus = (number: number): number => {
  return Math.trunc(number * 10000) / 100;
};

const partitionEffectsByType = <T extends Effect>(
  effects: T[],
): [T[], T[], T[]] => {
  const base: T[] = [];
  const bonus: T[] = [];
  const booster: T[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'base':
        base.push(effect);
        break;
      case 'bonus':
        bonus.push(effect);
        break;
      case 'bonus-booster':
        booster.push(effect);
        break;
    }
  }

  return [base, bonus, booster];
};

const sumBonusEffects = (effects: Effect[]): number => {
  return effects.reduce((acc, effect) => acc + effect.value - 1, 1);
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

  const relevantEffects = effects.filter(({ id }) => id === effectId);

  const serverEffectValue = relevantEffects.find(isServerEffect)?.value ?? 1;

  // Waterworks must not appear as a row (it only boosts oasis), and negative base from buildings is excluded here
  const buildingEffects = relevantEffects
    .filter(isBuildingEffect)
    .filter(({ type, value }) => {
      // Remove negative effects (typically population increase)
      return !(type === 'base' && value <= 0);
    });

  const heroEffects = relevantEffects.filter(isHeroEffect);
  const artifactEffects = relevantEffects.filter(isArtifactEffect);
  const oasisEffects = relevantEffects.filter(isOasisEffect);

  const [
    buildingBaseEffects,
    buildingBonusEffects,
    buildingBonusBoosterEffects,
  ] = partitionEffectsByType<VillageBuildingEffect>(buildingEffects);
  const [heroBaseEffects, heroBonusEffects, heroBonusBoosterEffects] =
    partitionEffectsByType<HeroEffect>(heroEffects);
  const [
    artifactBaseEffects,
    artifactBonusEffects,
    artifactBonusBoosterEffects,
  ] = partitionEffectsByType<ArtifactEffect>(artifactEffects);
  const [oasisBaseEffects, oasisBonusEffects, oasisBonusBoosterEffects] =
    partitionEffectsByType<OasisEffect>(oasisEffects);

  const summedBuildingBonusEffectValue = sumBonusEffects(buildingBonusEffects);
  const summedBuildingBonusBoosterEffectValue = sumBonusEffects(
    buildingBonusBoosterEffects.filter(
      ({ buildingId }) => buildingId !== 'WATERWORKS',
    ),
  );

  const summedHeroBonusEffectValue = sumBonusEffects(heroBonusEffects);
  const summedHeroBonusBoosterEffectValue = sumBonusEffects(
    heroBonusBoosterEffects,
  );

  const summedArtifactBonusEffectValue = sumBonusEffects(artifactBonusEffects);
  const summedArtifactBonusBoosterEffectValue = sumBonusEffects(
    artifactBonusBoosterEffects,
  );

  const summedOasisBonusEffectValue = sumBonusEffects(oasisBonusEffects);
  const summedOasisBonusBoosterEffectValue = sumBonusEffects([
    ...oasisBonusBoosterEffects,
    ...buildingBonusBoosterEffects,
  ]);

  const boostedBuildingBonusEffects: VillageBuildingEffect[] =
    buildingBonusEffects.map((effect) => {
      return {
        ...effect,
        value: 1 + (effect.value - 1) * summedBuildingBonusBoosterEffectValue,
      };
    });

  const boostedOasisBonusEffects: OasisEffect[] = oasisBonusEffects.map(
    (effect) => {
      return {
        ...effect,
        value: 1 + (effect.value - 1) * summedOasisBonusBoosterEffectValue,
      };
    },
  );

  const boostedArtifactBonusEffects: ArtifactEffect[] =
    artifactBonusEffects.map((effect) => {
      return {
        ...effect,
        value: 1 + (effect.value - 1) * summedArtifactBonusBoosterEffectValue,
      };
    });

  const boostedHeroBonusEffects: HeroEffect[] = heroBonusEffects.map(
    (effect) => {
      return {
        ...effect,
        value: 1 + (effect.value - 1) * summedHeroBonusBoosterEffectValue,
      };
    },
  );

  const baseBuildingEffectsWithServerModifier = buildingBaseEffects.map(
    (effect) => ({
      ...effect,
      value: effect.value * serverEffectValue,
    }),
  );

  const buildingDelta =
    (summedBuildingBonusEffectValue - 1) *
    summedBuildingBonusBoosterEffectValue;
  const heroDelta =
    (summedHeroBonusEffectValue - 1) * summedHeroBonusBoosterEffectValue;
  const artifactDelta =
    (summedArtifactBonusEffectValue - 1) *
    summedArtifactBonusBoosterEffectValue;
  const oasisDelta =
    (summedOasisBonusEffectValue - 1) * summedOasisBonusBoosterEffectValue;

  const absoluteBonusBuildingEffectValues =
    baseBuildingEffectsWithServerModifier.map(({ value }) => {
      const b = Math.trunc(value * buildingDelta);
      const h = Math.trunc(value * heroDelta);
      const a = Math.trunc(value * artifactDelta);
      const o = Math.trunc(value * oasisDelta);
      return b + h + a + o;
    });

  const baseOasisEffectsWithServerModifier = oasisBaseEffects.map((effect) => ({
    ...effect,
    value: effect.value * serverEffectValue,
  }));

  const baseArtifactsEffectsWithServerModifier = artifactBaseEffects.map(
    (effect) => ({
      ...effect,
      value: effect.value * serverEffectValue,
    }),
  );

  const baseHeroEffectsWithServerModifier = heroBaseEffects.map((effect) => ({
    ...effect,
    value: effect.value * serverEffectValue,
  }));

  const summedBaseEffects = [
    ...baseBuildingEffectsWithServerModifier,
    ...baseOasisEffectsWithServerModifier,
    ...baseArtifactsEffectsWithServerModifier,
    ...baseHeroEffectsWithServerModifier,
  ].reduce((acc, effect) => acc + effect.value, 0);

  const summedAbsoluteBonusEffects = absoluteBonusBuildingEffectValues.reduce(
    (acc, value) => acc + value,
    0,
  );

  const total = summedBaseEffects + summedAbsoluteBonusEffects;

  const hasBonuses =
    buildingBonusEffects.length > 0 ||
    heroBonusEffects.length > 0 ||
    artifactBonusEffects.length > 0 ||
    oasisBonusEffects.length > 0;

  const hasBaseProduction =
    buildingBaseEffects.length > 0 ||
    heroBaseEffects.length > 0 ||
    artifactBaseEffects.length > 0 ||
    oasisBaseEffects.length > 0;

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
                {boostedHeroBonusEffects.map(({ id, value }) => (
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
                {boostedArtifactBonusEffects.map(({ value, artifactId }) => (
                  <TableRow key={artifactId}>
                    <TableCell>
                      <Text>{t('Artifact')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{assetsT(`ITEMS.${artifactId}.TITLE`)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatBonus(value - 1)}%</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {boostedOasisBonusEffects.map(({ oasisId, value }) => {
                  const { x, y } = parseCoordinatesFromTileId(oasisId);

                  return (
                    <TableRow key={oasisId}>
                      <TableCell>
                        <Text>{t('Oasis')}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>
                          <Link
                            className="underline"
                            to={`${mapPath}?x=${x}&y=${y}`}
                          >
                            {x}, {y}
                          </Link>
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text>{formatBonus(value - 1)}%</Text>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {boostedBuildingBonusEffects.map(
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
                {baseHeroEffectsWithServerModifier.map(({ id, value }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <Text>{t('Hero')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{t('Hero')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{value}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>-</Text>
                    </TableCell>
                  </TableRow>
                ))}
                {baseArtifactsEffectsWithServerModifier.map(
                  ({ value, artifactId }) => (
                    <TableRow key={artifactId}>
                      <TableCell>
                        <Text>{t('Artifact')}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{assetsT(`ITEMS.${artifactId}.TITLE`)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{value}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>0</Text>
                      </TableCell>
                    </TableRow>
                  ),
                )}
                {baseOasisEffectsWithServerModifier.map(
                  ({ value, oasisId }) => {
                    const { x, y } = parseCoordinatesFromTileId(oasisId);

                    return (
                      <TableRow key={oasisId}>
                        <TableCell>
                          <Text>{t('Oasis')}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>
                            <Link
                              className="underline"
                              to={`${mapPath}?x=${x}&y=${y}`}
                            >
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
                    );
                  },
                )}
                {baseBuildingEffectsWithServerModifier.map(
                  ({ value, buildingId, buildingFieldId }, index) => (
                    <TableRow key={buildingFieldId}>
                      <TableCell>
                        <Text>{t('Building')}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{assetsT(`BUILDINGS.${buildingId}.NAME`)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{value}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{absoluteBonusBuildingEffectValues[index]}</Text>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </>
            )}
            <TableRow className="font-medium">
              <TableCell colSpan={2}>
                <Text>{t('Sum')}</Text>
              </TableCell>
              <TableCell>
                <Text>{summedBaseEffects}</Text>
              </TableCell>
              <TableCell>
                <Text>{summedAbsoluteBonusEffects}</Text>
              </TableCell>
            </TableRow>
            <TableRow className="font-medium">
              <TableCell colSpan={2}>
                <Text>{t('Total')}</Text>
              </TableCell>
              <TableCell colSpan={2}>
                <Text>{total}</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
