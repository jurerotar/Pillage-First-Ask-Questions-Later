import { useTranslation } from 'react-i18next';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/hero/utils';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources.ts';
import { useHasEnoughStorageCapacity } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-storage-capacity.ts';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings.ts';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type.ts';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useReviveHero } from 'app/(game)/(village-slug)/hooks/use-revive-hero';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { formatTime } from 'app/utils/time.ts';

export const HeroRevival = () => {
  const { t } = useTranslation();
  const { developerSettings } = useDeveloperSettings();
  const { hero } = useHero();
  const { reviveHero } = useReviveHero();
  const { server } = useServer();
  const { eventsByType: heroRevivalEvents } = useEventsByType('heroRevival');

  const { isInstantHeroReviveEnabled, isFreeHeroReviveEnabled } =
    developerSettings;

  const isReviving = heroRevivalEvents.length > 0;
  const { experience } = hero.stats;
  const { level } = calculateHeroLevel(experience);

  const revivalCost = isFreeHeroReviveEnabled
    ? [0, 0, 0, 0]
    : calculateHeroRevivalCost(server.playerConfiguration.tribe, level);

  const revivalTime = isInstantHeroReviveEnabled
    ? 0
    : calculateHeroRevivalTime(level) / server.configuration.speed;

  const { errorBag: hasEnoughResourcesErrorBag } =
    useHasEnoughResources(revivalCost);
  const { errorBag: hasEnoughWarehouseCapacityErrorBag } =
    useHasEnoughStorageCapacity('warehouseCapacity', revivalCost);
  const { errorBag: hasEnoughGranaryCapacityErrorBag } =
    useHasEnoughStorageCapacity('granaryCapacity', revivalCost);

  const errorBag = [
    ...hasEnoughResourcesErrorBag,
    ...hasEnoughWarehouseCapacityErrorBag,
    ...hasEnoughGranaryCapacityErrorBag,
  ];

  const canRevive = errorBag.length === 0 && !isReviving;

  return (
    <SectionContent>
      <Text as="h2">{t('Revive hero')}</Text>
      <Text>
        {t(
          "Your hero is dead. While the hero is dead, it can not produce resources, give bonuses or start adventures. Revival cost and duration increases with your hero's level.",
        )}
      </Text>
      {isReviving && (
        <Text className="font-medium">
          {t('Your hero is currently being healed and will be ready in ')}
          <Countdown endsAt={heroRevivalEvents[0].resolvesAt} />
        </Text>
      )}
      {!isReviving && (
        <div className="flex flex-col gap-2">
          <Resources resources={revivalCost} />
          <div className="flex items-center gap-1">
            <Icon type="heroRevivalDuration" />
            <Text>{formatTime(revivalTime)}</Text>
          </div>
          <ErrorBag errorBag={errorBag} />
          <Button
            size="fit"
            onClick={() => reviveHero()}
            disabled={!canRevive}
          >
            {t('Revive')}
          </Button>
        </div>
      )}
    </SectionContent>
  );
};
