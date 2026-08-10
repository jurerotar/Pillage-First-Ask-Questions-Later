import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type {
  Effect,
  ResourceProductionEffectId,
  VillageBuildingEffect,
} from '@pillage-first/types/models/effect';
import type { TroopLike } from '@pillage-first/types/models/troop';
import {
  calculateComputedEffect,
  getEffectBreakdown,
} from '@pillage-first/utils/game/calculate-computed-effect';
import {
  isAdditiveBonusEffect,
  isArtifactEffect,
  isBuildingEffect,
  isHeroEffect,
  isMultiplicativeBonusEffect,
  isOasisEffect,
  isServerEffect,
} from '@pillage-first/utils/guards/effect';
import { tileIdToCoordinates } from '@pillage-first/utils/map';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const formatBonus = (number: number): number => {
  return Math.trunc(number * 10_000) / 100;
};

type EffectBucket<T extends Effect = Effect> = {
  base: T[];
  bonus: T[];
  bonusBooster: T[];
};

type GroupedProductionEffects = {
  serverEffectValue: number;
  building: EffectBucket<VillageBuildingEffect>;
  hero: EffectBucket;
  artifact: EffectBucket;
  oasis: EffectBucket;
  troop: EffectBucket;
};

type StationedTroopLike = TroopLike & {
  tileId: number;
  source: number;
};

const createEffectBucket = <T extends Effect>(): EffectBucket<T> => ({
  base: [],
  bonus: [],
  bonusBooster: [],
});

const addEffectToBucket = <T extends Effect>(
  bucket: EffectBucket<T>,
  effect: T,
) => {
  switch (effect.type) {
    case 'base': {
      bucket.base.push(effect);
      break;
    }
    case 'bonus': {
      bucket.bonus.push(effect);
      break;
    }
    case 'bonus-booster': {
      bucket.bonusBooster.push(effect);
      break;
    }
  }
};

const groupProductionEffects = (
  effects: Effect[],
  effectId: ResourceProductionEffectId,
): GroupedProductionEffects => {
  const groupedEffects: GroupedProductionEffects = {
    serverEffectValue: 1,
    building: createEffectBucket<VillageBuildingEffect>(),
    hero: createEffectBucket(),
    artifact: createEffectBucket(),
    oasis: createEffectBucket(),
    troop: createEffectBucket(),
  };

  for (const effect of effects) {
    if (effect.id !== effectId) {
      continue;
    }

    if (isServerEffect(effect)) {
      groupedEffects.serverEffectValue = effect.value;
      continue;
    }

    if (isBuildingEffect(effect)) {
      addEffectToBucket(groupedEffects.building, effect);
      continue;
    }

    if (isHeroEffect(effect)) {
      addEffectToBucket(groupedEffects.hero, effect);
      continue;
    }

    if (isArtifactEffect(effect)) {
      addEffectToBucket(groupedEffects.artifact, effect);
      continue;
    }

    if (isOasisEffect(effect)) {
      addEffectToBucket(groupedEffects.oasis, effect);
      continue;
    }

    if (effect.source === 'troops') {
      addEffectToBucket(groupedEffects.troop, effect);
    }
  }

  return groupedEffects;
};

const applyServerModifierToBaseEffects = <T extends Effect>(
  effects: T[],
  serverEffectValue: number,
  shouldScaleNegativeValues = true,
): T[] => {
  return effects.map((effect) => ({
    ...effect,
    value:
      shouldScaleNegativeValues || effect.value > 0
        ? effect.value * serverEffectValue
        : effect.value,
  }));
};

const boostBonusEffects = <T extends Effect>(
  effects: T[],
  boosterValue: number,
): T[] => {
  return effects.map((effect) => ({
    ...effect,
    value: 1 + (effect.value - 1) * boosterValue,
  }));
};

const sumBaseEffects = (...effectGroups: Effect[][]): number => {
  let total = 0;

  for (const effects of effectGroups) {
    for (const { value } of effects) {
      total += value;
    }
  }

  return total;
};

const sumNegativeBaseEffectsAsConsumption = (effects: Effect[]): number => {
  let total = 0;

  for (const { value } of effects) {
    if (value < 0) {
      total -= value;
    }
  }

  return total;
};

const sumTroopConsumptionEffects = (effects: Effect[]): number => {
  let total = 0;

  for (const { value } of effects) {
    total -= value;
  }

  return total;
};

const getAbsoluteBonusValue = (baseValue: number, deltas: number[]): number => {
  if (baseValue <= 0) {
    return 0;
  }

  let total = 0;

  for (const delta of deltas) {
    total += Math.trunc(baseValue * delta);
  }

  return total;
};

const getProductionBonusDelta = (
  bonusValue: number,
  bonusBoosterValue: number,
): number => {
  if (bonusValue <= 1) {
    return 0;
  }

  return (bonusValue - 1) * bonusBoosterValue;
};

const getTroopWheatConsumption = ({ unitId, amount }: TroopLike): number => {
  const { unitWheatConsumption } = getUnitDefinition(unitId);
  return unitWheatConsumption * amount;
};

const applyUnitWheatConsumptionModifier = (
  wheatConsumption: number,
  unitWheatConsumptionModifier: number,
): number => {
  return Math.trunc(wheatConsumption * unitWheatConsumptionModifier);
};

const applyUnitWheatConsumptionModifierToTroopEffects = (
  effects: Effect[],
  unitWheatConsumptionModifier: number,
): Effect[] => {
  let totalConsumption = 0;

  for (const effect of effects) {
    totalConsumption += effect.value;
  }

  const modifiedTotalConsumption = applyUnitWheatConsumptionModifier(
    totalConsumption,
    unitWheatConsumptionModifier,
  );

  let assignedConsumption = 0;

  return effects.map((effect, index) => {
    const isLastEffect = index === effects.length - 1;
    const consumption = isLastEffect
      ? modifiedTotalConsumption - assignedConsumption
      : applyUnitWheatConsumptionModifier(
          effect.value,
          unitWheatConsumptionModifier,
        );

    assignedConsumption += consumption;

    return {
      ...effect,
      value: -consumption,
    };
  });
};

const getReinforcementConsumption = (
  troops: StationedTroopLike[],
  currentVillageTileId: number,
  unitWheatConsumptionModifier: number,
): number => {
  let total = 0;

  for (const troop of troops) {
    if (troop.tileId !== currentVillageTileId) {
      continue;
    }

    if (troop.source === currentVillageTileId) {
      continue;
    }

    total += getTroopWheatConsumption(troop);
  }

  return applyUnitWheatConsumptionModifier(total, unitWheatConsumptionModifier);
};

const getOasisConsumption = (
  sentReinforcements: {
    targetType: 'village' | 'oasis';
    troops: TroopLike[];
  }[],
  unitWheatConsumptionModifier: number,
): number => {
  let total = 0;

  for (const sentReinforcement of sentReinforcements) {
    if (sentReinforcement.targetType !== 'oasis') {
      continue;
    }

    for (const troop of sentReinforcement.troops) {
      total += getTroopWheatConsumption(troop);
    }
  }

  return applyUnitWheatConsumptionModifier(total, unitWheatConsumptionModifier);
};

const hasAnyEffects = (...effectGroups: Effect[][]): boolean => {
  for (const effects of effectGroups) {
    if (effects.length > 0) {
      return true;
    }
  }

  return false;
};

const sumBonusEffects = (effects: Effect[]): number => {
  let total = 1;

  for (const effect of effects) {
    if (isAdditiveBonusEffect(effect)) {
      total += effect.value - 1;
      continue;
    }

    if (isMultiplicativeBonusEffect(effect)) {
      total *= effect.value;
    }
  }

  return total;
};

const getBuildingBonusBoosterValue = (
  buildingBonusBoosterEffects: VillageBuildingEffect[],
): number => {
  let total = 1;

  for (const effect of buildingBonusBoosterEffects) {
    if (effect.buildingId === 'WATERWORKS') {
      continue;
    }

    total *= effect.value;
  }

  return total;
};

const getOasisBonusBoosterValue = (
  oasisBonusBoosterEffects: Effect[],
  buildingBonusBoosterEffects: VillageBuildingEffect[],
): number => {
  let total = 1;

  for (const effect of oasisBonusBoosterEffects) {
    total *= effect.value;
  }

  for (const effect of buildingBonusBoosterEffects) {
    if (effect.buildingId === 'WATERWORKS') {
      total *= effect.value;
    }
  }

  return total;
};

type WheatConsumptionBreakdownProps = {
  populationConsumption: number;
  troopConsumption: number;
  unitWheatConsumptionModifier: number;
};

const WheatConsumptionBreakdown = ({
  populationConsumption,
  troopConsumption,
  unitWheatConsumptionModifier,
}: WheatConsumptionBreakdownProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { villageTroops, sentReinforcements } = useVillageTroops();

  const reinforcementConsumption = getReinforcementConsumption(
    villageTroops,
    currentVillage.tileId,
    unitWheatConsumptionModifier,
  );

  const oasisTroopConsumption = getOasisConsumption(
    sentReinforcements,
    unitWheatConsumptionModifier,
  );

  const stationedTroopConsumption =
    troopConsumption - reinforcementConsumption - oasisTroopConsumption;

  const rows = [
    {
      label: t('Buildings (population)'),
      amount: populationConsumption,
    },
    {
      label: t('Stationed troops'),
      amount: stationedTroopConsumption,
    },
    {
      label: t('Reinforcements stationed here'),
      amount: reinforcementConsumption,
    },
    {
      label: t('Troops stationed at oases'),
      amount: oasisTroopConsumption,
    },
  ];

  return (
    <SectionContent>
      <Text as="h2">{t('Wheat consumption')}</Text>
      <OverflowContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Source')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Amount')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ label, amount }) => (
              <TableRow key={label}>
                <TableCell>
                  <Text>{label}</Text>
                </TableCell>
                <TableCell>
                  <Text>{amount === 0 ? 0 : -amount}</Text>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell>
                <Text>{t('Total consumption')}</Text>
              </TableCell>
              <TableCell>
                <Text>{-(populationConsumption + troopConsumption)}</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </OverflowContainer>
    </SectionContent>
  );
};

type ResourceBoosterBenefitsProps = {
  effectId: ResourceProductionEffectId;
};

export const ProductionOverview = ({
  effectId,
}: ResourceBoosterBenefitsProps) => {
  const { t } = useTranslation();
  const { mapSize } = useServer();
  const { currentVillage } = useCurrentVillage();
  const { effects } = useEffects();
  const computedProductionEffect = calculateComputedEffect(
    effectId,
    effects,
    currentVillage.id,
  );

  const groupedEffects = groupProductionEffects(effects, effectId);
  const { serverEffectValue } = groupedEffects;

  const {
    base: buildingBaseEffects,
    bonus: buildingBonusEffects,
    bonusBooster: buildingBonusBoosterEffects,
  } = groupedEffects.building;
  const {
    base: heroBaseEffects,
    bonus: heroBonusEffects,
    bonusBooster: heroBonusBoosterEffects,
  } = groupedEffects.hero;
  const {
    base: artifactBaseEffects,
    bonus: artifactBonusEffects,
    bonusBooster: artifactBonusBoosterEffects,
  } = groupedEffects.artifact;
  const {
    base: oasisBaseEffects,
    bonus: oasisBonusEffects,
    bonusBooster: oasisBonusBoosterEffects,
  } = groupedEffects.oasis;
  const { base: troopBaseEffects } = groupedEffects.troop;

  const summedBuildingBonusEffectValue = sumBonusEffects(buildingBonusEffects);
  const summedBuildingBonusBoosterEffectValue = getBuildingBonusBoosterValue(
    buildingBonusBoosterEffects,
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
  const summedOasisBonusBoosterEffectValue = getOasisBonusBoosterValue(
    oasisBonusBoosterEffects,
    buildingBonusBoosterEffects,
  );

  const boostedBuildingBonusEffects: VillageBuildingEffect[] =
    boostBonusEffects(
      buildingBonusEffects,
      summedBuildingBonusBoosterEffectValue,
    );

  const boostedOasisBonusEffects = boostBonusEffects(
    oasisBonusEffects,
    summedOasisBonusBoosterEffectValue,
  );

  const boostedArtifactBonusEffects = boostBonusEffects(
    artifactBonusEffects,
    summedArtifactBonusBoosterEffectValue,
  );

  const boostedHeroBonusEffects = boostBonusEffects(
    heroBonusEffects,
    summedHeroBonusBoosterEffectValue,
  );

  const baseBuildingEffectsWithServerModifier =
    applyServerModifierToBaseEffects(
      buildingBaseEffects,
      serverEffectValue,
      false,
    );

  const baseOasisEffectsWithServerModifier = applyServerModifierToBaseEffects(
    oasisBaseEffects,
    serverEffectValue,
  );

  const baseArtifactsEffectsWithServerModifier =
    applyServerModifierToBaseEffects(artifactBaseEffects, serverEffectValue);

  const baseHeroEffectsWithServerModifier = applyServerModifierToBaseEffects(
    heroBaseEffects,
    serverEffectValue,
  );

  const productionBonusDeltas = [
    getProductionBonusDelta(
      summedBuildingBonusEffectValue,
      summedBuildingBonusBoosterEffectValue,
    ),
    getProductionBonusDelta(
      summedHeroBonusEffectValue,
      summedHeroBonusBoosterEffectValue,
    ),
    getProductionBonusDelta(
      summedArtifactBonusEffectValue,
      summedArtifactBonusBoosterEffectValue,
    ),
    getProductionBonusDelta(
      summedOasisBonusEffectValue,
      summedOasisBonusBoosterEffectValue,
    ),
  ];

  const absoluteBonusBuildingEffectValues =
    baseBuildingEffectsWithServerModifier.map(({ value }) => {
      return getAbsoluteBonusValue(value, productionBonusDeltas);
    });

  const unitWheatConsumptionModifier =
    effectId === 'wheatProduction'
      ? getEffectBreakdown('unitWheatConsumption', effects, currentVillage.id)
          .combinedBonusEffectValue
      : 1;

  const baseTroopEffectsWithConsumptionModifier =
    applyUnitWheatConsumptionModifierToTroopEffects(
      troopBaseEffects,
      unitWheatConsumptionModifier,
    );

  const summedBaseEffects = sumBaseEffects(
    baseBuildingEffectsWithServerModifier,
    baseOasisEffectsWithServerModifier,
    baseArtifactsEffectsWithServerModifier,
    baseHeroEffectsWithServerModifier,
    baseTroopEffectsWithConsumptionModifier,
  );
  const total = computedProductionEffect.total;
  const summedAbsoluteBonusEffects = total - summedBaseEffects;

  const hasBonuses = hasAnyEffects(
    buildingBonusEffects,
    heroBonusEffects,
    artifactBonusEffects,
    oasisBonusEffects,
  );

  const hasBaseProduction = hasAnyEffects(
    buildingBaseEffects,
    heroBaseEffects,
    artifactBaseEffects,
    oasisBaseEffects,
    troopBaseEffects,
  );

  const populationConsumption = sumNegativeBaseEffectsAsConsumption(
    baseBuildingEffectsWithServerModifier,
  );
  const troopConsumption = sumTroopConsumptionEffects(
    baseTroopEffectsWithConsumptionModifier,
  );

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Production bonuses')}</Text>
        <OverflowContainer>
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
                  {boostedArtifactBonusEffects.map(
                    ({ value, sourceSpecifier }) => {
                      const { name } = getItemDefinition(sourceSpecifier!);

                      return (
                        <TableRow key={sourceSpecifier}>
                          <TableCell>
                            <Text>{t('Artifact')}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{t(`ITEMS.${name}.NAME`)}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{formatBonus(value - 1)}%</Text>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                  {boostedOasisBonusEffects.map(
                    ({ value, sourceSpecifier }) => {
                      const { x, y } = tileIdToCoordinates(
                        sourceSpecifier!,
                        mapSize,
                      );
                      return (
                        <TableRow key={sourceSpecifier}>
                          <TableCell>
                            <Text>{t('Oasis')}</Text>
                          </TableCell>
                          <TableCell>
                            <Text variant="link">
                              <Link to={`../map?x=${x}&y=${y}`}>
                                ({x} | {y})
                              </Link>
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text>{formatBonus(value - 1)}%</Text>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                  {boostedBuildingBonusEffects.map(
                    ({ value, sourceSpecifier, buildingId }) => (
                      <TableRow key={sourceSpecifier}>
                        <TableCell>
                          <Text>{t('Building')}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>{t(`BUILDINGS.${buildingId}.NAME`)}</Text>
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
        </OverflowContainer>
      </SectionContent>

      <SectionContent>
        <Text as="h2">{t('Base production')}</Text>
        <OverflowContainer>
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
                    ({ value, sourceSpecifier }) => {
                      const { name } = getItemDefinition(sourceSpecifier!);

                      return (
                        <TableRow key={sourceSpecifier}>
                          <TableCell>
                            <Text>{t('Artifact')}</Text>
                          </TableCell>
                          <TableCell>
                            <Text>{t(`ITEMS.${name}.NAME`)}</Text>
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
                  {baseOasisEffectsWithServerModifier.map(
                    ({ value, sourceSpecifier }) => {
                      // Source specifier in oasis effects is actually id of the oasis. Ids are calculated from coordinates,
                      // so we can reverse engineer coordinates without having to manually fetch them
                      const { x, y } = tileIdToCoordinates(
                        sourceSpecifier!,
                        mapSize,
                      );
                      return (
                        <TableRow key={sourceSpecifier}>
                          <TableCell>
                            <Text>{t('Oasis')}</Text>
                          </TableCell>
                          <TableCell>
                            <Text variant="link">
                              <Link to={`../map?x=${x}&y=${y}`}>
                                ({x} | {y})
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
                    ({ value, sourceSpecifier, buildingId }, index) => (
                      <TableRow key={sourceSpecifier}>
                        <TableCell>
                          <Text>{t('Building')}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>
                            {buildingId
                              ? t(`BUILDINGS.${buildingId}.NAME`)
                              : t('Population')}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text>{value}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>
                            {absoluteBonusBuildingEffectValues[index]}
                          </Text>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                  {baseTroopEffectsWithConsumptionModifier.map(
                    ({ value, sourceSpecifier }) => (
                      <TableRow key={`troops-${sourceSpecifier}`}>
                        <TableCell>
                          <Text>{t('Troops')}</Text>
                        </TableCell>
                        <TableCell>
                          <Text>{t('Troop upkeep')}</Text>
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
        </OverflowContainer>
      </SectionContent>

      {effectId === 'wheatProduction' && (
        <WheatConsumptionBreakdown
          populationConsumption={populationConsumption}
          troopConsumption={troopConsumption}
          unitWheatConsumptionModifier={unitWheatConsumptionModifier}
        />
      )}
    </Section>
  );
};
