import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import type { ResourceProductionEffectId } from 'app/interfaces/models/game/effect';
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
  isOasisBoosterEffect,
  isOasisEffect,
  isServerEffect,
} from 'app/(game)/(village-slug)/hooks/guards/effect-guards';

const formatBonus = (number: number): number => {
  return Math.trunc(number * 10000) / 100;
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

  // Keep the same “relevant effects” logic
  const relevantEffects = effects.filter(
    ({ id }) => id === effectId || id === `${effectId}OasisBonus`,
  );

  const serverEffectValue = relevantEffects.find(isServerEffect)?.value ?? 1;

  // Waterworks must not appear as a row (it only boosts oasis), and negative base from buildings is excluded here
  const buildingEffects = relevantEffects
    .filter(isBuildingEffect)
    .filter(({ buildingId, type, value }) => {
      if (type === 'base' && value <= 0) {
        return false;
      }
      return buildingId !== 'WATERWORKS';
    });

  const heroEffects = relevantEffects.filter(isHeroEffect);
  const artifactEffects = relevantEffects.filter(isArtifactEffect);
  const oasisEffects = relevantEffects.filter(isOasisEffect);
  const oasisBoosterEffects = relevantEffects.filter(isOasisBoosterEffect);

  const baseBuildingEffects = buildingEffects.filter(
    ({ type }) => type === 'base',
  );
  const bonusBuildingEffects = buildingEffects.filter(
    ({ type }) => type === 'bonus',
  );

  const baseHeroEffects = heroEffects.filter(({ type }) => type === 'base');
  const bonusHeroEffects = heroEffects.filter(({ type }) => type === 'bonus');

  const baseArtifactEffects = artifactEffects.filter(
    ({ type }) => type === 'base',
  );
  const bonusArtifactEffects = artifactEffects.filter(
    ({ type }) => type === 'bonus',
  );

  const baseOasisEffects = oasisEffects.filter(({ type }) => type === 'base');
  const bonusOasisEffects = oasisEffects.filter(({ type }) => type === 'bonus');

  const hasBonuses =
    bonusBuildingEffects.length > 0 ||
    bonusHeroEffects.length > 0 ||
    bonusArtifactEffects.length > 0 ||
    bonusOasisEffects.length > 0;

  const hasBaseProduction =
    baseBuildingEffects.length > 0 ||
    baseHeroEffects.length > 0 ||
    baseArtifactEffects.length > 0 ||
    baseOasisEffects.length > 0;

  // Apply server modifier only to base building effects (exactly like before)
  const baseBuildingEffectsWithServerModifier = baseBuildingEffects.map(
    (effect) => ({
      ...effect,
      value: effect.value * serverEffectValue,
    }),
  );

  // Oasis boosters multiply the oasis bonus percentage
  const summedBonusOasisBoosterEffectValue =
    oasisBoosterEffects.reduce((acc, { value }) => acc + value, 0) || 1;

  const boostedOasisEffects = bonusOasisEffects.map((effect) => ({
    ...effect,
    // keep the same semantics as before: multiply only the (value - 1) part
    value: (effect.value - 1) * summedBonusOasisBoosterEffectValue,
  }));

  // Sum base values (same sources, with server applied to building base)
  const summedBaseEffectValue =
    baseBuildingEffectsWithServerModifier.reduce(
      (acc, { value }) => acc + value,
      0,
    ) +
    baseHeroEffects.reduce((acc, { value }) => acc + value, 0) +
    baseArtifactEffects.reduce((acc, { value }) => acc + value, 0) +
    baseOasisEffects.reduce((acc, { value }) => acc + value, 0);

  // Sum the decimal “bonus” parts exactly like before (using % 1), but with boosted oasis
  const summedBonusEffectValue =
    bonusBuildingEffects.reduce((acc, { value }) => acc + (value % 1), 0) +
    bonusHeroEffects.reduce((acc, { value }) => acc + (value % 1), 0) +
    bonusArtifactEffects.reduce((acc, { value }) => acc + (value % 1), 0) +
    boostedOasisEffects.reduce((acc, { value }) => acc + (value % 1), 0);

  // Bonus that applies on top of base building values
  const summedBaseBuildingEffectWithBonusValue =
    baseBuildingEffectsWithServerModifier.reduce(
      (acc, { value }) => acc + Math.trunc(value * summedBonusEffectValue),
      0,
    );
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
                      <Text>{t('Artifact')}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{assetsT(`ITEMS.${artifactId}.TITLE`)}</Text>
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
                          <Link
                            className="underline"
                            to={`${mapPath}?x=${x}&y=${y}`}
                          >
                            {x}, {y}
                          </Link>
                        </Text>
                      </TableCell>
                      <TableCell>
                        <Text>{formatBonus(value)}%</Text>
                      </TableCell>
                    </TableRow>
                  );
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
                {baseArtifactEffects.map(({ value, artifactId }) => (
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
                })}
                {baseBuildingEffectsWithServerModifier.map(
                  ({ value, buildingFieldId, buildingId }) => (
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
                <Text>{t('Sum')}</Text>
              </TableCell>
              <TableCell>
                <Text>{summedBaseEffectValue}</Text>
              </TableCell>
              <TableCell>
                <Text>{summedBaseBuildingEffectWithBonusValue}</Text>
              </TableCell>
            </TableRow>
            <TableRow className="font-medium">
              <TableCell colSpan={2}>
                <Text>{t('Total')}</Text>
              </TableCell>
              <TableCell colSpan={2}>
                <Text>
                  {summedBaseEffectValue +
                    summedBaseBuildingEffectWithBonusValue}
                </Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionContent>
    </Section>
  );
};
