import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CULTURE_POINTS_CELEBRATION_COSTS,
  CULTURE_POINTS_CELEBRATION_LIMITS,
  type CulturePointsCelebrationType,
  calculateCulturePointsCelebrationDuration,
} from '@pillage-first/game-assets/utils/culture-points';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useCulturePoints } from 'app/(game)/(village-slug)/hooks/use-culture-points';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { InformationPopover } from 'app/(game)/components/information-popover';
import {
  culturePointsCacheKey,
  currentVillageCacheKey,
  playersCacheKey,
} from 'app/(game)/constants/query-keys';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { formatTime } from 'app/utils/time';

const tabs = ['small-celebration', 'large-celebration'];

type CelebrationPanelProps = {
  celebrationType: CulturePointsCelebrationType;
  townHallLevel: number;
};

const CelebrationPanel = ({
  celebrationType,
  townHallLevel,
}: CelebrationPanelProps) => {
  const { t } = useTranslation();
  const { serverSpeed } = useServer();
  const { currentVillage } = useCurrentVillage();
  const { culturePoints } = useCulturePoints();
  const { eventsByType: celebrationEvents } = useEventsByType(
    'culturePointsCelebration',
  );
  const { createEvent } = useCreateEvent('culturePointsCelebration');
  const liveResources = use(CurrentVillageLiveResourcesContext);

  const cost = CULTURE_POINTS_CELEBRATION_COSTS[celebrationType];
  const limit = CULTURE_POINTS_CELEBRATION_LIMITS[celebrationType];
  const reward = Math.min(
    celebrationType === 'small'
      ? culturePoints.currentVillageCulturePointsProduction
      : culturePoints.playerCulturePointsProduction,
    limit,
  );
  const duration = calculateCulturePointsCelebrationDuration({
    celebrationType,
    townHallLevel,
    serverSpeed,
  });
  const { hasEnoughResources, errorBag } = useHasEnoughResources(cost);
  const activeCelebration = celebrationEvents[0];
  const isLargeCelebrationLocked =
    celebrationType === 'large' && townHallLevel < 10;
  const isDisabled =
    !!activeCelebration || isLargeCelebrationLocked || !hasEnoughResources;

  return (
    <SectionContent>
      <Text as="h2">
        {celebrationType === 'small'
          ? t('Small Celebration')
          : t('Large Celebration')}
      </Text>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Text className="text-sm text-muted-foreground">{t('Cost')}</Text>
          <span className="flex flex-wrap gap-2">
            <Resources
              resources={cost}
              availableResources={liveResources}
            />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <Text className="text-sm text-muted-foreground">{t('Reward')}</Text>
          <Text>
            {t('{{amount}} culture points', {
              amount: formatNumber(reward),
            })}
          </Text>
        </div>
        <div className="flex flex-col gap-1">
          <Text className="text-sm text-muted-foreground">{t('Limit')}</Text>
          <Text>
            {t('{{amount}} culture points', {
              amount: formatNumber(limit),
            })}
          </Text>
        </div>
        <div className="flex flex-col gap-1">
          <Text className="text-sm text-muted-foreground">{t('Cooldown')}</Text>
          <Text>{formatTime(duration)}</Text>
        </div>
      </div>

      {activeCelebration && (
        <Text>
          {t('Town Hall ready in {{time}}', {
            time: '',
          })}
          <Countdown endsAt={activeCelebration.resolvesAt} />
        </Text>
      )}

      {isLargeCelebrationLocked && (
        <Text className="text-sm text-muted-foreground">
          {t('Large celebrations require Town Hall level 10.')}
        </Text>
      )}

      {errorBag.map((error) => (
        <Text
          key={error}
          className="text-sm text-destructive"
        >
          {error}
        </Text>
      ))}

      <Button
        size="fit"
        disabled={isDisabled}
        onClick={() => {
          createEvent({
            celebrationType,
            cachesToClearImmediately: [
              [culturePointsCacheKey, currentVillage.id],
              [currentVillageCacheKey, currentVillage.slug],
              [playersCacheKey],
            ],
          });
        }}
      >
        {t('Start celebration')}
      </Button>
    </SectionContent>
  );
};

export const TownHallCelebrations = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'town-hall-celebrations-tab',
  );
  const townHallLevel = Math.max(
    ...currentVillage.buildingFields
      .filter(({ buildingId }) => buildingId === 'TOWN_HALL')
      .map(({ level }) => level),
    0,
  );

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="celebrations" />
        <InformationPopover ariaLabel={t('Celebrations')}>
          <Text>
            {t(
              'The Town Hall allows you to hold celebrations, which instantly grant Culture Points. Upgrading the Town Hall reduces the cooldown time between celebrations, allowing you to generate Culture Points more frequently.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Celebrations')}</Text>
        <Text as="h3">{t('Celebration Limits')}</Text>
        <Text>
          {t(
            'Each celebration type has a maximum number of Culture Points it can generate.',
          )}
        </Text>
        <Text>
          {t(
            'The limit depends on gameworld speed and can be found in the Culture Points table of the game versions overview.',
          )}
        </Text>
        <Text as="h3">{t('Destroyed Town Hall')}</Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>{t('Ongoing celebrations continue normally.')}</Text>
          </li>
          <li>
            <Text>
              {t(
                'Queued celebrations continue and will start after cooldown ends.',
              )}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'You cannot start new celebrations until the Town Hall is rebuilt.',
              )}
            </Text>
          </li>
        </ul>
        <Text as="h3">{t('Celebration Duration')}</Text>
        <Text>
          {t(
            'Each celebration triggers a cooldown before the next one can start.',
          )}
        </Text>
        <Text>
          {t(
            'The exact cooldown duration depends on the Town Hall level and server speed.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Tabs
          value={tabs[tabIndex] ?? tabs[0]}
          onValueChange={(value) => {
            navigateToTab(value);
          }}
        >
          <TabList>
            <Tab value="small-celebration">{t('Small Celebration')}</Tab>
            <Tab value="large-celebration">{t('Large Celebration')}</Tab>
          </TabList>
          <TabPanel value="small-celebration">
            <CelebrationPanel
              celebrationType="small"
              townHallLevel={townHallLevel}
            />
            <SectionContent>
              <ul className="list-disc pl-4">
                <li>
                  <Text>{t('Gives Culture Points immediately.')}</Text>
                </li>
                <li>
                  <Text>
                    {t(
                      'Culture Points gained equals the daily Culture Points production of the village, up to the celebration limit.',
                    )}
                  </Text>
                </li>
              </ul>
            </SectionContent>
          </TabPanel>
          <TabPanel value="large-celebration">
            <CelebrationPanel
              celebrationType="large"
              townHallLevel={townHallLevel}
            />
            <SectionContent>
              <ul className="list-disc pl-4">
                <li>
                  <Text>{t('Gives Culture Points immediately.')}</Text>
                </li>
                <li>
                  <Text>
                    {t(
                      'Culture Points gained equals the daily Culture Points production of all your villages, up to the limit.',
                    )}
                  </Text>
                </li>
                <li>
                  <Text>
                    {t(
                      'Your administrators reduce enemy village loyalty by up to 5% more.',
                    )}
                  </Text>
                </li>
                <li>
                  <Text>
                    {t(
                      'Your own villages lose up to 5% less loyalty when you are attacked.',
                    )}
                  </Text>
                </li>
              </ul>
              <Text>
                {t(
                  'These loyalty effects apply to all battles that take place during the celebration, regardless of when troops were sent.',
                )}
              </Text>
            </SectionContent>
          </TabPanel>
        </Tabs>
      </SectionContent>
    </Section>
  );
};
