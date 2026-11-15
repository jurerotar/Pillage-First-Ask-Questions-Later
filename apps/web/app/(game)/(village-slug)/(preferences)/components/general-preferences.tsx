import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  UIColorScheme,
  VillageSort,
} from '@pillage-first/types/models/preferences';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Separator } from 'app/components/ui/separator';
import { Switch } from 'app/components/ui/switch';
import type { AvailableLocale } from 'app/localization/i18n';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { CookieContext } from 'app/providers/cookie-context';
import {
  LOCALE_COOKIE_NAME,
  setCookie,
  UI_COLOR_SCHEME_COOKIE_NAME,
} from 'app/utils/device';
import { NavigationSettings } from './navigation-settings';
import { ReportGenerationSettings } from './report-generation-settings';

export const GeneralPreferences = () => {
  const { t, i18n } = useTranslation();
  const { updatePreference, preferences } = usePreferences();
  const { locale, uiColorScheme } = use(CookieContext);

  return (
    <Section>
      <SectionContent>
        <Text
          as="h2"
          className="transition-colors"
        >
          {t('Appearance')}
        </Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
            <span className="font-medium">{t('UI color scheme')}</span>
            <span>
              {t('Select a light or dark theme for the interface appearance.')}
            </span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Select
              value={uiColorScheme}
              onValueChange={async (value: UIColorScheme) => {
                await setCookie(UI_COLOR_SCHEME_COOKIE_NAME, value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('Light')}</SelectItem>
                <SelectItem value="dark">{t('Dark')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionContent>
      <Separator orientation="horizontal" />
      <SectionContent>
        <Text
          as="h2"
          className="transition-colors"
        >
          {t('Localization')}
        </Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
            <span className="font-medium">{t('Locale')}</span>
            <span>{t('Select your preferred language.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Select
              disabled
              value={locale}
              onValueChange={async (value: AvailableLocale) => {
                await setCookie(LOCALE_COOKIE_NAME, value);
                await loadAppTranslations(locale);
                await i18n.changeLanguage(locale);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionContent>
      <Separator orientation="horizontal" />
      <SectionContent>
        <Text
          as="h2"
          className="transition-colors"
        >
          {t('Display')}
        </Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
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
                  value: !preferences.shouldShowBuildingNames,
                })
              }
              checked={preferences.shouldShowBuildingNames}
            />
          </div>
        </div>
        <Separator orientation="horizontal" />
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
            <span className="font-medium">{t('Sort villages by')}</span>
            <span>{t('Choose the order used in the village select.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Select
              value={preferences.villageSort}
              onValueChange={(value: VillageSort) => {
                updatePreference({
                  preferenceName: 'villageSort',
                  value,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetic">{t('Alphabetic')}</SelectItem>
                <SelectItem value="populationAsc">
                  {t('Population - ascending')}
                </SelectItem>
                <SelectItem value="populationDesc">
                  {t('Population - descending')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionContent>
      <Separator orientation="horizontal" />
      <SectionContent>
        <Text
          as="h2"
          className="transition-colors"
        >
          {t('Functionality')}
        </Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
            <span className="font-medium">{t('Report generation')}</span>
            <span>
              {t('Choose which reports to generate across all your villages.')}
            </span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <ReportGenerationSettings />
          </div>
        </div>
        <Separator orientation="horizontal" />
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
            <span className="font-medium">{t('Navigation settings')}</span>
            <span>
              {t(
                'Configure automatic navigation after building upgrades, unit research, unit improvements and sending units.',
              )}
            </span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <NavigationSettings />
          </div>
        </div>
      </SectionContent>
      <Separator orientation="horizontal" />
      <SectionContent>
        <Text
          as="h2"
          className="transition-colors"
        >
          {t('Development tooling')}
        </Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col transition-colors">
            <span className="font-medium">{t('Developer console')}</span>
            <span>{t('Enables the developer console button.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Switch
              onCheckedChange={() =>
                updatePreference({
                  preferenceName: 'isDeveloperToolsConsoleEnabled',
                  value: !preferences.isDeveloperToolsConsoleEnabled,
                })
              }
              checked={preferences.isDeveloperToolsConsoleEnabled}
            />
          </div>
        </div>
      </SectionContent>
    </Section>
  );
};
