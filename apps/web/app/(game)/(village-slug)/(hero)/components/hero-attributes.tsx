import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FaHome } from 'react-icons/fa';
import { FaStar } from 'react-icons/fa6';
import { LuMinus, LuPlus } from 'react-icons/lu';
import { Link } from 'react-router';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import type { HeroResourceToProduce } from '@pillage-first/types/models/hero';
import { HeroRevival } from 'app/(game)/(village-slug)/(hero)/components/hero-revival';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Progress } from 'app/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Slider } from 'app/components/ui/slider';

export const HeroAttributes = () => {
  const { t } = useTranslation();
  const {
    hero,
    isHeroAlive,
    updateHeroAttributes,
    updateHeroResourceToProduce,
  } = useHero();
  const { server } = useServer();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { playerVillages } = usePlayerVillageListing();
  const { getNewVillageUrl } = useGameNavigation();

  const heroHomeVillage = playerVillages.find(({ id }) => {
    return hero.villageId === id;
  })!;
  const isHeroHomeVillageCurrent = currentVillage.id === hero.villageId;

  const isEgyptian = tribe === 'egyptians';
  const sharedProductionPerPoint = isEgyptian ? 12 : 9;
  const focusedProductionPerPoint = isEgyptian ? 40 : 30;

  const { stats, selectableAttributes, resourceToProduce } = hero;
  const {
    experience,
    health,
    attackPower: baseAttackPower,
    experienceModifier,
    healthRegeneration,
    damageReduction,
    speed,
    natarianAttackBonus,
    attackBonus,
    defenceBonus,
  } = stats;

  const { level, percentToNextLevel } = calculateHeroLevel(experience);
  const gameWorldSpeed = server.configuration.speed;
  const effectiveHealthRegeneration = healthRegeneration * gameWorldSpeed;

  const [attributes, setAttributes] = useState(selectableAttributes);

  const totalSpentPoints = useMemo(() => {
    let total = 0;

    for (const attribute of Object.values(attributes)) {
      total += attribute;
    }

    return total;
  }, [attributes]);

  const initialSpentPoints = useMemo(() => {
    let total = 0;

    for (const attribute of Object.values(selectableAttributes)) {
      total += attribute;
    }

    return total;
  }, [selectableAttributes]);

  const isLevelUpAvailable = (level + 1) * 4 > totalSpentPoints;
  const freePoints = (level + 1) * 4 - totalSpentPoints;

  const heroStrength = baseAttackPower;

  const handleAttributeChange = (
    key: keyof typeof selectableAttributes,
    delta: number,
  ) => {
    setAttributes((prev) => {
      const newValue = prev[key] + delta;
      if (newValue < selectableAttributes[key] || newValue > 100) {
        return prev;
      }
      if (delta > 0 && !isLevelUpAvailable) {
        return prev;
      }
      return { ...prev, [key]: newValue };
    });
  };

  const attributeLabels = {
    attackPower: t('Attack power'),
    resourceProduction: t('Resource production'),
    attackBonus: t('Attack bonus'),
    defenceBonus: t('Defence bonus'),
  };

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Attributes')}>
          <Text>
            {t(
              'You can improve your hero by gaining experience and leveling up, which will give you ability points to spend on different attributes.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Attributes')}</Text>
      </SectionContent>
      <SectionContent>
        <div className="inline-flex gap-2 items-center font-medium">
          <FaStar className="size-5" />
          <Text>{t('Your hero is level {{level}}.', { level })}</Text>
        </div>
        <div className="inline-flex gap-2 items-center font-medium">
          <FaHome className="size-6 min-w-6" />
          <span>
            {isHeroHomeVillageCurrent &&
              t(
                "Your hero's home village is set to the current village. Should your hero die, it can only be revived from here.",
              )}
            {!isHeroHomeVillageCurrent && (
              <Trans>
                Your hero's home village is set to{' '}
                <Text
                  as="span"
                  variant="link"
                >
                  <Link to={getNewVillageUrl(heroHomeVillage.slug)}>
                    {heroHomeVillage.name}
                  </Link>
                </Text>
                . Should your hero die, it can only be revived from its home
                village.
              </Trans>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Text className="text-xs font-medium text-muted-foreground uppercase">
                {t('Health')}
              </Text>
              <Text className="font-medium text-sm">{health}%</Text>
            </div>
            <Progress
              value={health}
              className="border border-[#506d00] [&>div]:bg-[linear-gradient(#c7e94f,#c7e94f_40%,#506d00)] h-2.5"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Text className="text-xs font-medium text-muted-foreground uppercase">
                {t('Experience')}
              </Text>
              <Text className="font-medium text-sm">{percentToNextLevel}%</Text>
            </div>
            <Progress
              value={percentToNextLevel}
              className="border border-[#0d648e] [&>div]:bg-[linear-gradient(#b1e4ff,#24b4fd_60%,#1271a2)] h-2.5"
            />
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Strength')}
            </Text>
            <Text className="font-medium">{heroStrength}</Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Experience modifier')}
            </Text>
            <Text className="font-medium">{experienceModifier}%</Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Health regeneration')}
            </Text>
            <Text className="font-medium">
              {effectiveHealthRegeneration}% / {t('day')}
            </Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Damage reduction')}
            </Text>
            <Text className="font-medium">
              {damageReduction} / {t('battle')}
            </Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Speed')}
            </Text>
            <Text className="font-medium">
              {speed} / {t('fields per hour')}
            </Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Attack bonus against Natarians')}
            </Text>
            <Text className="font-medium">{natarianAttackBonus}%</Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Attack bonus')}
            </Text>
            <Text className="font-medium">{(attackBonus / 5).toFixed(1)}%</Text>
          </div>
          <div className="flex flex-col">
            <Text className="text-xs font-medium text-muted-foreground uppercase">
              {t('Defence bonus')}
            </Text>
            <Text className="font-medium">
              {(defenceBonus / 5).toFixed(1)}%
            </Text>
          </div>
        </div>
      </SectionContent>
      {!isHeroAlive && <HeroRevival />}
      {isHeroAlive && (
        <>
          <SectionContent>
            <div className="flex justify-between items-center">
              <Text as="h2">{t('Ability points')}</Text>
              {isLevelUpAvailable && (
                <Text className="text-primary font-bold">
                  {t('Free ability points')}: {freePoints}
                </Text>
              )}
            </div>
            <Text>
              {t(
                'Ability points can be used to improve your hero. Hero starts their journey with 4 ability points. Each time a hero gains a level they earn 4 additional ability points that can be used to increase any of the four abilities. Each ability can only be increased a hundred times.',
              )}
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-2">
              {(
                Object.keys(selectableAttributes) as Array<
                  keyof typeof selectableAttributes
                >
              ).map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <Text className="text-xs font-medium text-muted-foreground uppercase">
                      {attributeLabels[key]}
                    </Text>
                    <Text className="font-bold text-sm">
                      {attributes[key]} / 100
                    </Text>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleAttributeChange(key, -1)}
                      disabled={attributes[key] <= selectableAttributes[key]}
                    >
                      <LuMinus />
                    </Button>
                    <Slider
                      value={[attributes[key]]}
                      max={100}
                      disabled={
                        !isLevelUpAvailable &&
                        attributes[key] === selectableAttributes[key]
                      }
                      onValueChange={([val]) => {
                        const delta = val - attributes[key];
                        if (delta > 0 && freePoints < delta) {
                          handleAttributeChange(key, freePoints);
                        } else {
                          handleAttributeChange(key, delta);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleAttributeChange(key, 1)}
                      disabled={!isLevelUpAvailable || attributes[key] >= 100}
                    >
                      <LuPlus />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="fit"
              className="mt-4"
              disabled={totalSpentPoints === initialSpentPoints}
              onClick={() => updateHeroAttributes(attributes)}
            >
              {t('Save changes')}
            </Button>
          </SectionContent>
          <SectionContent>
            <InformationPopover ariaLabel={t('Resource production')}>
              <Text>
                {t(
                  'Your hero can produce a specific resource or a shared amount of all resources. Shared production means your hero will produce an equal amount of wood, clay, iron, and wheat.',
                )}
              </Text>
            </InformationPopover>
            <Text as="h2">{t('Resource production')}</Text>
            <div className="flex flex-col gap-2 mt-2">
              <Text className="text-xs font-medium text-muted-foreground uppercase">
                {t('Select resource to produce')}
              </Text>
              <Select
                value={resourceToProduce}
                onValueChange={(value: HeroResourceToProduce) =>
                  updateHeroResourceToProduce(value)
                }
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">
                    <Icon type="wood" />
                    <Icon type="clay" />
                    <Icon type="iron" />
                    <Icon type="wheat" /> +
                    {selectableAttributes.resourceProduction *
                      sharedProductionPerPoint *
                      gameWorldSpeed}{' '}
                    / h
                  </SelectItem>
                  <SelectItem value="wood">
                    <Icon type="wood" /> +
                    {selectableAttributes.resourceProduction *
                      focusedProductionPerPoint *
                      gameWorldSpeed}{' '}
                    / h
                  </SelectItem>
                  <SelectItem value="clay">
                    <Icon type="clay" /> +
                    {selectableAttributes.resourceProduction *
                      focusedProductionPerPoint *
                      gameWorldSpeed}{' '}
                    / h
                  </SelectItem>
                  <SelectItem value="iron">
                    <Icon type="iron" /> +
                    {selectableAttributes.resourceProduction *
                      focusedProductionPerPoint *
                      gameWorldSpeed}{' '}
                    / h
                  </SelectItem>
                  <SelectItem value="wheat">
                    <Icon type="wheat" /> +
                    {selectableAttributes.resourceProduction *
                      focusedProductionPerPoint *
                      gameWorldSpeed}{' '}
                    / h
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionContent>
        </>
      )}
    </Section>
  );
};
