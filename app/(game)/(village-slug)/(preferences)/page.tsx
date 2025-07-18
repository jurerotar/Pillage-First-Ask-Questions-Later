import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Switch } from 'app/components/ui/switch';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import type { AvailableLocale } from 'app/interfaces/models/locale';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import type React from 'react';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(preferences)/+types/page';
import { Separator } from 'app/components/ui/separator';

const PreferencesPage: React.FC<Route.ComponentProps> = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { updatePreference, preferences } = usePreferences();
  const { resourcesPath } = useGameNavigation();

  const {
    shouldShowBuildingNames,
    isAccessibilityModeEnabled,
    isReducedMotionModeEnabled,
    isDeveloperModeEnabled,
    isAutomaticNavigationAfterBuildingLevelChangeEnabled,
  } = preferences;

  const title = `${t('Preferences')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={resourcesPath}>{t('Resources')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Preferences')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Preferences')}</Text>
      <Section>
        <SectionContent>
          <Text as="h2">{t('Appearance')}</Text>
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('UI color scheme')}</span>
              <span>
                {t(
                  'Select a light or dark theme for the interface appearance.',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Select
                value={preferences.colorScheme}
                onValueChange={(value: Preferences['colorScheme']) =>
                  updatePreference({ preferenceName: 'colorScheme', value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('Light')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('Graphics color scheme')}</span>
              <span>
                {t(
                  'Select a daytime or nighttime setting to adjust the overall visual atmosphere.',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Select
                value={preferences.timeOfDay}
                onValueChange={(value: Preferences['timeOfDay']) =>
                  updatePreference({ preferenceName: 'timeOfDay', value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('Day')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('Graphic set')}</span>
              <span>{t('Select your preferred graphic set')}</span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Select
                value={preferences.skinVariant}
                onValueChange={(value: Preferences['skinVariant']) =>
                  updatePreference({ preferenceName: 'skinVariant', value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('Default')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionContent>
        <Separator orientation="horizontal" />
        <SectionContent>
          <Text as="h2">{t('Localization')}</Text>
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('Locale')}</span>
              <span>{t('Select your preferred language.')}</span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Select
                value={preferences.locale}
                onValueChange={(value: AvailableLocale) =>
                  updatePreference({ preferenceName: 'locale', value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">{t('English')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionContent>
        <Separator orientation="horizontal" />
        <SectionContent>
          <Text as="h2">{t('Accessibility')}</Text>
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">
                {t('Additional accessibility features (in development))')}
              </span>
              <span>
                {t('Enables accessibility enhancements for better usability.')}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Switch
                disabled
                onCheckedChange={() =>
                  updatePreference({
                    preferenceName: 'isAccessibilityModeEnabled',
                    value: !isAccessibilityModeEnabled,
                  })
                }
                checked={isAccessibilityModeEnabled}
              />
            </div>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">
                {t('Reduced motion (in development)')}
              </span>
              <span>
                {t(
                  'Disables certain animations and effects for a smoother experience.',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Switch
                disabled
                onCheckedChange={() =>
                  updatePreference({
                    preferenceName: 'isReducedMotionModeEnabled',
                    value: !isReducedMotionModeEnabled,
                  })
                }
                checked={isReducedMotionModeEnabled}
              />
            </div>
          </div>
        </SectionContent>
        <Separator orientation="horizontal" />
        <SectionContent>
          <Text as="h2">{t('Display')}</Text>
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('Building names display')}</span>
              <span>
                {t(
                  'Shows the names of buildings on village and resources views.',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Switch
                onCheckedChange={() =>
                  updatePreference({
                    preferenceName: 'shouldShowBuildingNames',
                    value: !shouldShowBuildingNames,
                  })
                }
                checked={shouldShowBuildingNames}
              />
            </div>
          </div>
        </SectionContent>
        <Separator orientation="horizontal" />
        <SectionContent>
          <Text as="h2">{t('Functionality')}</Text>
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">
                {t('Navigation after building upgrade')}
              </span>
              <span>
                {t(
                  'Enable automatic navigation to resources or village views after starting a building upgrade or downgrade',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Switch
                onCheckedChange={() =>
                  updatePreference({
                    preferenceName:
                      'isAutomaticNavigationAfterBuildingLevelChangeEnabled',
                    value:
                      !isAutomaticNavigationAfterBuildingLevelChangeEnabled,
                  })
                }
                checked={isAutomaticNavigationAfterBuildingLevelChangeEnabled}
              />
            </div>
          </div>
          <Separator orientation="horizontal" />
          <div className="flex gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('Developer mode')}</span>
              <span>
                {t(
                  'Enables instant building of buildings and troops with no cost.',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-end items-center">
              <Switch
                onCheckedChange={() =>
                  updatePreference({
                    preferenceName: 'isDeveloperModeEnabled',
                    value: !isDeveloperModeEnabled,
                  })
                }
                checked={isDeveloperModeEnabled}
              />
            </div>
          </div>
        </SectionContent>
      </Section>
    </>
  );
};

export default PreferencesPage;
