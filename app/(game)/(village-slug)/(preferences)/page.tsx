import { useDeveloperMode } from 'app/(game)/(village-slug)/hooks/use-developer-mode';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Switch } from 'app/components/ui/switch';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'app/components/ui/breadcrumb';
import type { MetaFunction } from 'react-router';
import { t } from 'i18next';

export const meta: MetaFunction = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  return [
    {
      title: `${t('Preferences')} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const PreferencesPage = () => {
  const { t } = useTranslation();
  const { togglePreference, shouldShowBuildingNames, isAccessibilityModeEnabled, isReducedMotionModeEnabled } = usePreferences();
  const { isDeveloperModeActive, toggleDeveloperMode } = useDeveloperMode();
  const { resourcesPath } = useGameNavigation();

  return (
    <>
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
      <article className="flex flex-col gap-2">
        <div className="flex gap-2 border-b border-gray-300 pb-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">{t('Developer mode')}</span>
            <span>{t('Enables instant building of buildings and troops with no cost.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Switch
              id="develop-mode-toggle"
              onCheckedChange={toggleDeveloperMode}
              checked={isDeveloperModeActive}
            />
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-300 py-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">{t('Building names display')}</span>
            <span>{t('Shows the names of buildings on village and resources views.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Switch
              id="should-show-building-names-toggle"
              onCheckedChange={() => togglePreference('shouldShowBuildingNames')}
              checked={shouldShowBuildingNames}
            />
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-300 py-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">{t('Reduced motion (in development)')}</span>
            <span>{t('Disables certain animations and effects for a smoother experience.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Switch
              disabled
              id="reduced-motion-mode-toggle"
              onCheckedChange={() => togglePreference('isReducedMotionModeEnabled')}
              checked={isReducedMotionModeEnabled}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">{t('Additional accessibility features (in development))')}</span>
            <span>{t('Enables accessibility enhancements for better usability.')}</span>
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Switch
              disabled
              id="accessibility-mode-toggle"
              onCheckedChange={() => togglePreference('isAccessibilityModeEnabled')}
              checked={isAccessibilityModeEnabled}
            />
          </div>
        </div>
      </article>
    </>
  );
};

export default PreferencesPage;
