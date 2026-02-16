import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuMinus, LuPlus } from 'react-icons/lu';
import type { HeroResourceToProduce } from '@pillage-first/types/models/hero';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from 'app/(game)/(village-slug)/hooks/utils/hero';
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
  const tribe = useTribe();

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

  const [attributes, setAttributes] = useState(selectableAttributes);

  const totalSpentPoints = useMemo(() => {
    return Object.values(attributes).reduce((total, curr) => total + curr, 0);
  }, [attributes]);

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

  const revivalCost = calculateHeroRevivalCost(
    server.playerConfiguration.tribe,
    level,
  );
  const revivalTime = calculateHeroRevivalTime(level);

  const attributeLabels = {
    attackPower: t('Attack power'),
    resourceProduction: t('Resource production'),
    attackBonus: t('Attack bonus'),
    defenceBonus: t('Defence bonus'),
  };

  return (
    <div className="flex flex-col gap-4">
      <Section>
        <SectionContent>
          <Text as="h2">{t('Attributes')}</Text>
          <Text>
            {t(
              'Your hero can be used to attack or defend your villages and also to help you with the production of resources. You can improve your hero by gaining experience and leveling up, which will give you ability points to spend on different attributes.',
            )}
          </Text>
        </SectionContent>
        <SectionContent>
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
                <Text className="font-medium text-sm">
                  {percentToNextLevel}%
                </Text>
              </div>
              <Progress
                value={percentToNextLevel}
                className="border border-[#0d648e] [&>div]:bg-[linear-gradient(#b1e4ff,#24b4fd_60%,_#1271a2)] h-2.5"
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
                {healthRegeneration}% / {t('day')}
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
              <Text className="font-medium">
                {(attackBonus / 5).toFixed(1)}%
              </Text>
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
            disabled={
              totalSpentPoints ===
              Object.values(selectableAttributes).reduce((a, b) => a + b, 0)
            }
            onClick={() => updateHeroAttributes(attributes)}
          >
            {t('Save changes')}
          </Button>
        </SectionContent>
        <SectionContent>
          <Text as="h2">{t('Resource production')}</Text>
          <Text>
            {t(
              'Your hero can produce a specific resource or a shared amount of all resources. Shared production means your hero will produce an equal amount of wood, clay, iron, and wheat.',
            )}
          </Text>
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
                    server.configuration.speed}{' '}
                  / h
                </SelectItem>
                <SelectItem value="wood">
                  <Icon type="wood" /> +
                  {selectableAttributes.resourceProduction *
                    focusedProductionPerPoint *
                    server.configuration.speed}{' '}
                  / h
                </SelectItem>
                <SelectItem value="clay">
                  <Icon type="clay" /> +
                  {selectableAttributes.resourceProduction *
                    focusedProductionPerPoint *
                    server.configuration.speed}{' '}
                  / h
                </SelectItem>
                <SelectItem value="iron">
                  <Icon type="iron" /> +
                  {selectableAttributes.resourceProduction *
                    focusedProductionPerPoint *
                    server.configuration.speed}{' '}
                  / h
                </SelectItem>
                <SelectItem value="wheat">
                  <Icon type="wheat" /> +
                  {selectableAttributes.resourceProduction *
                    focusedProductionPerPoint *
                    server.configuration.speed}{' '}
                  / h
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionContent>
        {!isHeroAlive && (
          <SectionContent>
            <Text as="h2">{t('Revive hero')}</Text>
            <div className="flex flex-col gap-2">
              <Resources resources={revivalCost} />
              <div className="flex items-center gap-1">
                <Icon type="buildingDuration" />
                <Text>
                  {Math.floor(revivalTime / 1000 / 60 / 60)}h{' '}
                  {Math.floor((revivalTime / 1000 / 60) % 60)}m
                </Text>
              </div>
              <Button size="fit">{t('Revive')}</Button>
            </div>
          </SectionContent>
        )}
      </Section>
    </div>
  );
};
