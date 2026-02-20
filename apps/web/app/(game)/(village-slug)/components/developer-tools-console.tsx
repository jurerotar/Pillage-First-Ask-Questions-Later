import { type ComponentProps, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VscTerminal } from 'react-icons/vsc';
import { items } from '@pillage-first/game-assets/items';
import type { DeveloperSettings } from '@pillage-first/types/models/developer-settings';
import type { Resource } from '@pillage-first/types/models/resource';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero.ts';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { calculateHeroLevel } from 'app/(game)/(village-slug)/hooks/utils/hero';
import { Icon } from 'app/components/icon.tsx';
import { Text } from 'app/components/text.tsx';
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

export const DeveloperToolsButton = ({
  className,
  ...props
}: ComponentProps<'span'>) => {
  const { preferences } = usePreferences();

  if (!preferences.isDeveloperToolsConsoleEnabled) {
    return null;
  }

  return (
    <span
      className={className}
      {...props}
    >
      <VscTerminal className="text-inherit size-full" />
    </span>
  );
};

interface DevToolsConsoleProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESOURCES: Resource[] = ['wood', 'clay', 'iron', 'wheat'];
const AMOUNTS: (100 | 1000 | 10000)[] = [100, 1000, 10000];

const INSTANT_SETTINGS: (keyof DeveloperSettings)[] = [
  'isInstantBuildingConstructionEnabled',
  'isInstantUnitTrainingEnabled',
  'isInstantUnitImprovementEnabled',
  'isInstantUnitResearchEnabled',
  'isInstantUnitTravelEnabled',
];

const FREE_SETTINGS: (keyof DeveloperSettings)[] = [
  'isFreeBuildingConstructionEnabled',
  'isFreeUnitTrainingEnabled',
  'isFreeUnitImprovementEnabled',
  'isFreeUnitResearchEnabled',
];

export const DeveloperToolsConsole = ({
  isOpen,
  onOpenChange,
}: DevToolsConsoleProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const {
    developerSettings,
    updateDeveloperSetting,
    updateVillageResources,
    spawnHeroItem,
    levelUpHero,
    incrementHeroAdventurePoints,
  } = useDeveloperSettings();
  const { hero } = useHero();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);

  const { level } = useMemo(
    () => calculateHeroLevel(hero.stats.experience),
    [hero.stats.experience],
  );

  const handleUpdateResource = (
    resource: Resource,
    amount: 100 | 1000 | 10000,
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

  const SETTING_LABELS: Record<keyof DeveloperSettings, string> = {
    isInstantBuildingConstructionEnabled: t('Instant building construction'),
    isInstantUnitTrainingEnabled: t('Instant unit training'),
    isInstantUnitImprovementEnabled: t('Instant unit improvement'),
    isInstantUnitResearchEnabled: t('Instant unit research'),
    isInstantUnitTravelEnabled: t('Instant unit travel'),
    isFreeBuildingConstructionEnabled: t('Free building construction'),
    isFreeUnitTrainingEnabled: t('Free unit training'),
    isFreeUnitImprovementEnabled: t('Free unit improvement'),
    isFreeUnitResearchEnabled: t('Free unit research'),
  };

  const SETTING_DESCRIPTIONS: Record<keyof DeveloperSettings, string> = {
    isInstantBuildingConstructionEnabled: t(
      'Buildings are constructed instantly without waiting.',
    ),
    isInstantUnitTrainingEnabled: t(
      'Units are trained instantly in buildings.',
    ),
    isInstantUnitImprovementEnabled: t(
      'Units are improved instantly in the smithy.',
    ),
    isInstantUnitResearchEnabled: t(
      'Units are researched instantly in the academy.',
    ),
    isInstantUnitTravelEnabled: t('Units reach their destination instantly.'),
    isFreeBuildingConstructionEnabled: t(
      'Buildings do not cost any resources to construct.',
    ),
    isFreeUnitTrainingEnabled: t('Units do not cost any resources to train.'),
    isFreeUnitImprovementEnabled: t(
      'Units do not cost any resources to improve.',
    ),
    isFreeUnitResearchEnabled: t(
      'Units do not cost any resources to research.',
    ),
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Developer tools')}</DialogTitle>
          <DialogDescription>
            {t(
              'Developer tools allow you to spawn resources and hero items, and disable or enable specific game functionalities for testing purposes.',
            )}
          </DialogDescription>
        </DialogHeader>

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
                      {AMOUNTS.map((amount) => (
                        <Button
                          key={`${resource}-add-${amount}`}
                          size="sm"
                          className="h-8 px-2 min-w-[3.5rem] flex-1"
                          onClick={() =>
                            handleUpdateResource(resource, amount, 'add')
                          }
                        >
                          <span>
                            +{amount >= 1000 ? `${amount / 1000}k` : amount}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {AMOUNTS.map((amount) => (
                        <Button
                          key={`${resource}-subtract-${amount}`}
                          size="sm"
                          variant="destructive"
                          className="h-8 px-2 min-w-[3.5rem] flex-1"
                          onClick={() =>
                            handleUpdateResource(resource, amount, 'subtract')
                          }
                        >
                          <span>
                            -{amount >= 1000 ? `${amount / 1000}k` : amount}
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
            <Text as="h3">{t('Duration')}</Text>
            <div className="grid grid-cols-1 gap-4">
              {INSTANT_SETTINGS.map((setting) => (
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

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Cost')}</Text>
            <div className="grid grid-cols-1 gap-4">
              {FREE_SETTINGS.map((setting) => (
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
                      <SelectValue placeholder={t('Select an item to spawn')} />
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
            <Text as="h3">{t('Hero level')}</Text>
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
            <div className="flex items-center gap-4">
              <Button onClick={() => incrementHeroAdventurePoints()}>
                {t('Add 1 adventure point')}
              </Button>
            </div>
          </SectionContent>
        </Section>
      </DialogContent>
    </Dialog>
  );
};
