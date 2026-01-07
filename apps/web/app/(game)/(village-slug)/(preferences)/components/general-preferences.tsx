import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  SkinVariant,
  TimeOfDay,
  UIColorScheme,
} from '@pillage-first/types/models/preferences';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
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
import { CookieContext } from 'app/providers/cookie-provider';
import {
  GRAPHICS_SKIN_VARIANT_COOKIE_NAME,
  GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
  LOCALE_COOKIE_NAME,
  setCookie,
  UI_COLOR_SCHEME_COOKIE_NAME,
} from 'app/utils/device';

export const GeneralPreferences = () => {
  const { t, i18n } = useTranslation();
  const { updatePreference, preferences } = usePreferences();
  const { locale, skinVariant, uiColorScheme, timeOfDay } = use(CookieContext);

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Gameplay')}</Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col">
            <span className="font-medium">
              {t('Offline attacks (in development)')}
            </span>
            <span>
              {t(
                "Select whether enemies can trigger attacks against you while you're offline.",
              )}
            </span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Switch
              disabled
              checked
            />
          </div>
        </div>
        <Separator orientation="horizontal" />
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col">
            <span className="font-medium">
              {t('Vacation mode (in development)')}
            </span>
            <span>
              {t(
                'While in vacation mode, game pauses completely. You may enable vacation mode or resume gameplay at any time.',
              )}
            </span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Button disabled>{t('Enable vacation mode')}</Button>
          </div>
        </div>
      </SectionContent>
      <Separator orientation="horizontal" />
      <SectionContent>
        <Text as="h2">{t('Appearance')}</Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col">
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
              value={timeOfDay}
              onValueChange={async (value: TimeOfDay) => {
                await setCookie<TimeOfDay>(
                  GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
                  value,
                );
              }}
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
              value={skinVariant}
              onValueChange={async (value: SkinVariant) => {
                await setCookie<SkinVariant>(
                  GRAPHICS_SKIN_VARIANT_COOKIE_NAME,
                  value,
                );
              }}
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
        <Text as="h2">{t('Accessibility')}</Text>
        <div className="flex gap-2">
          <Text className="flex flex-4 gap-1 flex-col">
            <span className="font-medium">
              {t('Additional accessibility features (in development)')}
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
                  value: !preferences.isAccessibilityModeEnabled,
                })
              }
              checked={preferences.isAccessibilityModeEnabled}
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
                  value: !preferences.isReducedMotionModeEnabled,
                })
              }
              checked={preferences.isReducedMotionModeEnabled}
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
                  value: !preferences.shouldShowBuildingNames,
                })
              }
              checked={preferences.shouldShowBuildingNames}
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
                    !preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled,
                })
              }
              checked={
                preferences.isAutomaticNavigationAfterBuildingLevelChangeEnabled
              }
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
                  value: !preferences.isDeveloperModeEnabled,
                })
              }
              checked={preferences.isDeveloperModeEnabled}
            />
          </div>
        </div>
      </SectionContent>
    </Section>
  );
};
