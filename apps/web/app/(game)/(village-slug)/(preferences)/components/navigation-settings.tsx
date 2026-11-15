import { useTranslation } from 'react-i18next';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

export const NavigationSettings = () => {
  const { t } = useTranslation();
  const { preferences, updatePreference } = usePreferences();

  const navigationSettings = [
    {
      preferenceName: 'isAutomaticNavigationAfterBuildingLevelChangeEnabled',
      label: t('Navigation after building upgrade'),
      description: t(
        'Enable automatic navigation to resources or village views after starting a building upgrade or downgrade',
      ),
    },
    {
      preferenceName: 'isAutomaticNavigationAfterUnitResearchEnabled',
      label: t('Navigation after unit research'),
      description: t(
        'Enable automatic navigation to village view after starting a unit research',
      ),
    },
    {
      preferenceName: 'isAutomaticNavigationAfterUnitUpgradeEnabled',
      label: t('Navigation after unit improvement'),
      description: t(
        'Enable automatic navigation to village view after starting a unit improvement',
      ),
    },
    {
      preferenceName: 'isAutomaticNavigationAfterSendUnitsEnabled',
      label: t('Navigation after send units'),
      description: t(
        'Enable automatic navigation to village view after sending units',
      ),
    },
  ] as const;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
          >
            {t('Navigation settings')}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        className="w-96 max-w-[calc(100vw-2rem)] p-3"
      >
        <div className="flex flex-col gap-4">
          <Text
            as="h3"
            className="font-medium"
          >
            {t('Navigation settings')}
          </Text>
          {navigationSettings.map(({ preferenceName, label, description }) => (
            <div
              key={preferenceName}
              className="flex items-start gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent"
            >
              <Checkbox
                id={preferenceName}
                className="mt-0.5"
                aria-describedby={`${preferenceName}-description`}
                checked={preferences[preferenceName]}
                onCheckedChange={(value) =>
                  updatePreference({ preferenceName, value })
                }
              />
              <div className="flex flex-col gap-1">
                <Label
                  className="cursor-pointer"
                  htmlFor={preferenceName}
                >
                  {label}
                </Label>
                <Text
                  id={`${preferenceName}-description`}
                  className="text-sm text-muted-foreground"
                >
                  {description}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
