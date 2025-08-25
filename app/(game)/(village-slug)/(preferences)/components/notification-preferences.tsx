import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Switch } from 'app/components/ui/switch';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Separator } from 'app/components/ui/separator';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import {
  useNotificationPermission,
  requestNotificationPermission,
} from 'app/(game)/hooks/use-notification-permission';

export const NotificationPreferences = () => {
  const { t } = useTranslation();
  const { updatePreference, preferences } = usePreferences();
  const notificationPermission = useNotificationPermission();

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Notifications')}</Text>
        {notificationPermission === 'not-available' && (
          <Alert variant="error">
            {t('Notifications are not available on your device.')}
          </Alert>
        )}
        {notificationPermission === 'denied' && (
          <Alert variant="error">
            {t(
              "You've blocked notifications for this site. To receive alerts, you'll need to re-enable them in your browser settings.",
            )}
            <ul className="flex flex-col gap-4 mt-4">
              <li>
                <b>Chrome/Edge/Vivaldi/Brave</b>: Click the padlock icon in the
                address bar {'>'} Site settings {'>'} Set Notifications to
                "Allow", or manually visit:{' '}
                <code>chrome://settings/content/notifications</code>
              </li>
              <li>
                <b>Firefox</b>: Click the padlock icon in the address bar {'>'}{' '}
                Click the arrow {'>'} More Information {'>'} Permissions tab{' '}
                {'>'} Set Send Notifications to "Allow" or manually visit:{' '}
                <code>about:preferences#privacy</code>
              </li>
              <li>
                <b>Safari</b>: Safari {'>'} Settings/Preferences {'>'} Websites{' '}
                {'>'} Notifications
              </li>
            </ul>
          </Alert>
        )}
        {notificationPermission === 'default' && (
          <div className="flex flex-col md:flex-row gap-2">
            <Text className="flex flex-4 gap-1 flex-col">
              <span className="font-medium">{t('Enable notifications')}</span>
              <span>
                {t(
                  'You\'ve not yet enabled notifications for this site. To receive alerts, you\'ll need to enable them by clicking on the "Enable notifications" button.',
                )}
              </span>
            </Text>
            <div className="flex flex-1 justify-start md:justify-end items-center">
              <Button
                size="fit"
                onClick={requestNotificationPermission}
              >
                {t('Enable notifications')}
              </Button>
            </div>
          </div>
        )}
        {notificationPermission === 'granted' && (
          <>
            <div className="flex gap-2">
              <Text className="flex flex-4 gap-1 flex-col">
                <span className="font-medium">
                  {t('Building upgrade notifications')}
                </span>
                <span>
                  {t('Enable notification on building upgrade completion')}
                </span>
              </Text>
              <div className="flex flex-1 justify-end items-center">
                <Switch
                  onCheckedChange={() =>
                    updatePreference({
                      preferenceName:
                        'shouldShowNotificationsOnBuildingUpgradeCompletion',
                      value:
                        !preferences.shouldShowNotificationsOnBuildingUpgradeCompletion,
                    })
                  }
                  checked={
                    preferences.shouldShowNotificationsOnBuildingUpgradeCompletion
                  }
                />
              </div>
            </div>
            <Separator orientation="horizontal" />
            <div className="flex gap-2">
              <Text className="flex flex-4 gap-1 flex-col">
                <span className="font-medium">
                  {t('Smithy unit upgrade notifications')}
                </span>
                <span>
                  {t('Enable notification on Smithy unit upgrade completion')}
                </span>
              </Text>
              <div className="flex flex-1 justify-end items-center">
                <Switch
                  onCheckedChange={() =>
                    updatePreference({
                      preferenceName:
                        'shouldShowNotificationsOnUnitUpgradeCompletion',
                      value:
                        !preferences.shouldShowNotificationsOnUnitUpgradeCompletion,
                    })
                  }
                  checked={
                    preferences.shouldShowNotificationsOnUnitUpgradeCompletion
                  }
                />
              </div>
            </div>
            <Separator orientation="horizontal" />
            <div className="flex gap-2">
              <Text className="flex flex-4 gap-1 flex-col">
                <span className="font-medium">
                  {t('Academy research notifications')}
                </span>
                <span>
                  {t('Enable notification on Academy research completion')}
                </span>
              </Text>
              <div className="flex flex-1 justify-end items-center">
                <Switch
                  onCheckedChange={() =>
                    updatePreference({
                      preferenceName:
                        'shouldShowNotificationsOnAcademyResearchCompletion',
                      value:
                        !preferences.shouldShowNotificationsOnAcademyResearchCompletion,
                    })
                  }
                  checked={
                    preferences.shouldShowNotificationsOnAcademyResearchCompletion
                  }
                />
              </div>
            </div>
          </>
        )}
      </SectionContent>
    </Section>
  );
};
