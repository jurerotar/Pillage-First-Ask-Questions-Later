import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { items } from '@pillage-first/game-assets/items';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import type { DeveloperSettings } from '@pillage-first/types/models/developer-settings';
import type { Resource } from '@pillage-first/types/models/resource';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useDeveloperActions } from 'app/(game)/(village-slug)/hooks/use-developer-actions';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Input } from 'app/components/ui/input';
import { Label } from 'app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Separator } from 'app/components/ui/separator';
import { Switch } from 'app/components/ui/switch';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useLoyalty } from '../hooks/use-loyalty';

type DevToolsConsoleProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const RESOURCES: Resource[] = ['wood', 'clay', 'iron', 'wheat'];
const AMOUNTS: (100 | 1000 | 10_000)[] = [100, 1000, 10_000];

const STANDALONE_SETTINGS = [
  'isInstantUnitTravelEnabled',
  'isFreeHuntingPartiesEnabled',
] as const;

export const DeveloperToolsConsole = ({
  isOpen,
  onOpenChange,
}: DevToolsConsoleProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { developerSettings } = useDeveloperSettings();
  const {
    updateDeveloperSetting,
    updateVillageResources,
    spawnHeroItem,
    levelUpHero,
    incrementHeroAdventurePoints,
    killHero,
    adjustLoyalty,
  } = useDeveloperActions();
  const { hero, isHeroAlive, isHeroHome } = useHero();
  const { available: adventurePoints } = useHeroAdventures();
  const { loyalty } = useLoyalty();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);

  const { level } = useMemo(() => {
    return calculateHeroLevel(hero.stats.experience);
  }, [hero.stats.experience]);

  const canKillHero = isHeroAlive && isHeroHome;

  const handleUpdateResource = (
    resource: Resource,
    amount: 100 | 1000 | 10_000,
    direction: 'add' | 'subtract',
  ) => {
    updateVillageResources({
      villageId: currentVillage.id,
      resource,
      amount,
      direction,
    });
  };

  const handleUpdateSetting = (
    name: keyof DeveloperSettings,
    value: boolean,
  ) => {
    updateDeveloperSetting({ developerSettingName: name, value });
  };

  const handleSpawnItem = () => {
    if (!selectedItemId) {
      return;
    }

    spawnHeroItem({ itemId: Number(selectedItemId), amount });
  };

  const pairedSettings: {
    label: string;
    description: string;
    freeSetting: keyof DeveloperSettings;
    instantSetting: keyof DeveloperSettings;
  }[] = [
    {
      label: t('Building construction'),
      description: t(
        'Control the resource cost and duration of building construction.',
      ),
      freeSetting: 'isFreeBuildingConstructionEnabled',
      instantSetting: 'isInstantBuildingConstructionEnabled',
    },
    {
      label: t('Unit production'),
      description: t(
        'Control the resource cost and duration of producing units, Trapper cages and animal cages.',
      ),
      freeSetting: 'isFreeUnitTrainingEnabled',
      instantSetting: 'isInstantUnitTrainingEnabled',
    },
    {
      label: t('Unit improvement'),
      description: t(
        'Control the resource cost and duration of improving units in the smithy.',
      ),
      freeSetting: 'isFreeUnitImprovementEnabled',
      instantSetting: 'isInstantUnitImprovementEnabled',
    },
    {
      label: t('Unit research'),
      description: t(
        'Control the resource cost and duration of researching units in the academy.',
      ),
      freeSetting: 'isFreeUnitResearchEnabled',
      instantSetting: 'isInstantUnitResearchEnabled',
    },
    {
      label: t('Hero revives'),
      description: t(
        'Control the resource cost and duration of reviving heroes.',
      ),
      freeSetting: 'isFreeHeroReviveEnabled',
      instantSetting: 'isInstantHeroReviveEnabled',
    },
  ];

  const SETTING_LABELS = {
    isInstantUnitTravelEnabled: t('Instant troop movement'),
    isFreeHuntingPartiesEnabled: t('Free hunting parties'),
  } as const;

  const SETTING_DESCRIPTIONS = {
    isInstantUnitTravelEnabled: t(
      'Troop movements, hunting parties, and gathering expeditions complete instantly.',
    ),
    isFreeHuntingPartiesEnabled: t(
      'Hunting parties do not cost any resources.',
    ),
  } as const;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Developer tools')}</DialogTitle>
          <DialogDescription>
            {t(
              'Developer tools allow you to spawn resources and hero items, and disable or enable specific game functionalities for testing purposes.',
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabList>
            <Tab value="general">{t('General')}</Tab>
            <Tab value="hero">{t('Hero')}</Tab>
            <Tab value="village">{t('Village')}</Tab>
          </TabList>
          <TabPanel value="general">
            <Section>
              <SectionContent>
                <Text as="h3">{t('Cost and duration')}</Text>
                <div className="grid grid-cols-1 gap-4">
                  {pairedSettings.map(
                    ({ label, description, freeSetting, instantSetting }) => {
                      const isFree = developerSettings[freeSetting];
                      const isInstant = developerSettings[instantSetting];
                      const value = isFree
                        ? isInstant
                          ? 'both'
                          : 'free'
                        : isInstant
                          ? 'instant'
                          : 'none';

                      return (
                        <div
                          key={freeSetting}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex flex-col gap-1">
                            <Label
                              htmlFor={freeSetting}
                              className="text-sm font-semibold cursor-pointer"
                            >
                              {label}
                            </Label>
                            <span className="text-sm text-muted-foreground">
                              {description}
                            </span>
                          </div>
                          <Select
                            value={value}
                            onValueChange={(nextValue) => {
                              handleUpdateSetting(
                                freeSetting,
                                nextValue === 'free' || nextValue === 'both',
                              );
                              handleUpdateSetting(
                                instantSetting,
                                nextValue === 'instant' || nextValue === 'both',
                              );
                            }}
                          >
                            <SelectTrigger
                              id={freeSetting}
                              className="w-36 shrink-0"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('None')}</SelectItem>
                              <SelectItem value="free">
                                {t('Only free')}
                              </SelectItem>
                              <SelectItem value="instant">
                                {t('Only instant')}
                              </SelectItem>
                              <SelectItem value="both">{t('Both')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    },
                  )}
                  {STANDALONE_SETTINGS.map((setting) => (
                    <div
                      key={setting}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor={setting}
                          className="text-sm font-semibold cursor-pointer"
                        >
                          {t(SETTING_LABELS[setting])}
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {t(SETTING_DESCRIPTIONS[setting])}
                        </span>
                      </div>
                      <Switch
                        id={setting}
                        checked={developerSettings[setting]}
                        onCheckedChange={(checked) =>
                          handleUpdateSetting(setting, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </SectionContent>
            </Section>
          </TabPanel>
          <TabPanel value="hero">
            <Section>
              <SectionContent>
                <Text as="h3">{t('Hero level')}</Text>
                <Text>
                  {t('Current level')}: {level}
                </Text>
                <Button
                  size="fit"
                  onClick={() => levelUpHero()}
                >
                  {t('Level up to level {{level}}', { level: level + 1 })}
                </Button>
              </SectionContent>

              <Separator orientation="horizontal" />

              <SectionContent>
                <Text as="h3">{t('Hero adventures')}</Text>
                <Text>
                  {t('Current adventure points')}: {adventurePoints}
                </Text>
                <div className="flex items-center gap-4">
                  <Button onClick={() => incrementHeroAdventurePoints()}>
                    {t('Add 1 adventure point')}
                  </Button>
                </div>
              </SectionContent>

              <Separator orientation="horizontal" />

              <SectionContent>
                <Text as="h3">{t('Hero items')}</Text>
                <div className="flex flex-col gap-4">
                  <div className="flex items-end gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                      <Label>{t('Item')}</Label>
                      <Select
                        value={selectedItemId ?? undefined}
                        onValueChange={(value) => setSelectedItemId(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('Select an item to spawn')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={String(item.id)}
                            >
                              {t(`ITEMS.${item.name}.NAME`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2 w-24">
                      <Label htmlFor="item-amount">{t('Amount')}</Label>
                      <Input
                        id="item-amount"
                        type="number"
                        min={1}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSpawnItem}
                    disabled={!selectedItemId}
                    size="fit"
                  >
                    {t('Spawn item')}
                  </Button>
                </div>
              </SectionContent>

              <Separator orientation="horizontal" />

              <SectionContent>
                <Text as="h3">{t('Kill hero')}</Text>
                <div className="flex flex-col gap-1 items-start">
                  <Button
                    variant="destructive"
                    disabled={!canKillHero}
                    onClick={() => killHero()}
                  >
                    {t('Kill hero')}
                  </Button>
                  {!canKillHero && (
                    <ErrorBag
                      errorBag={['Hero must be at home and alive to be killed']}
                    />
                  )}
                </div>
              </SectionContent>
            </Section>
          </TabPanel>
          <TabPanel value="village">
            <Section>
              <SectionContent>
                <Text as="h3">{t('Resources')}</Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {RESOURCES.map((resource) => (
                    <div
                      key={resource}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-4">
                          <Icon type={resource} />
                        </div>
                        <Label className="capitalize">
                          {t(`RESOURCES.${resource.toUpperCase()}`)}
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {AMOUNTS.map((amountToSpawn) => (
                            <Button
                              key={`${resource}-add-${amountToSpawn}`}
                              size="sm"
                              className="h-8 px-2 min-w-[3.5rem] flex-1"
                              onClick={() =>
                                handleUpdateResource(
                                  resource,
                                  amountToSpawn,
                                  'add',
                                )
                              }
                            >
                              <span>
                                +
                                {amountToSpawn >= 1000
                                  ? `${amountToSpawn / 1000}k`
                                  : amountToSpawn}
                              </span>
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {AMOUNTS.map((amountToRemove) => (
                            <Button
                              key={`${resource}-subtract-${amountToRemove}`}
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 min-w-[3.5rem] flex-1"
                              onClick={() =>
                                handleUpdateResource(
                                  resource,
                                  amountToRemove,
                                  'subtract',
                                )
                              }
                            >
                              <span>
                                -
                                {amountToRemove >= 1000
                                  ? `${amountToRemove / 1000}k`
                                  : amountToRemove}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionContent>

              <Separator orientation="horizontal" />

              <SectionContent>
                <Text as="h3">{t('Adjust village loyalty')}</Text>
                <Text>
                  {t('Current loyalty')}: {loyalty}%
                </Text>
                <div className="flex gap-1 items-start">
                  <Button
                    variant="destructive"
                    onClick={() => adjustLoyalty({ amount: -10 })}
                  >
                    -10
                  </Button>
                  <Button onClick={() => adjustLoyalty({ amount: 10 })}>
                    +10
                  </Button>
                </div>
              </SectionContent>
            </Section>
          </TabPanel>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
