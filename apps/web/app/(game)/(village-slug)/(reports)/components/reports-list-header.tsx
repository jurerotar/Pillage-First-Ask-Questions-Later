import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { ReportScope } from 'app/(game)/(village-slug)/hooks/use-reports';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

type ReportsListHeaderProps = {
  scope: ReportScope;
};

export const ReportsListHeader = ({ scope }: ReportsListHeaderProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  if (scope === 'global') {
    return (
      <>
        <InformationPopover ariaLabel={t('All reports')}>
          <Text>
            {t(
              'This is a categorized view of in-game reports. You can toggle different types of reports by using report filters above.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('All reports')}</Text>
      </>
    );
  }

  if (scope === 'unread') {
    return (
      <>
        <InformationPopover ariaLabel={t('Unread reports')}>
          <Text>
            {t(
              'This is a categorized view of unread reports. You can toggle different types of reports by using report filters above.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Unread reports')}</Text>
      </>
    );
  }

  if (scope === 'archived') {
    return (
      <>
        <InformationPopover ariaLabel={t('Archived reports')}>
          <Text>
            {t(
              'This is a categorized view of archived reports. These reports are not deleted once a limit is reached and you can have an unlimited amount of them. You can toggle different types of reports by using report filters above.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Archived reports')}</Text>
      </>
    );
  }

  return (
    <>
      <InformationPopover
        ariaLabel={t('Reports in {{villageName}}', {
          villageName: currentVillage.name,
        })}
      >
        <Text>
          {t(
            'This is a categorized view of in-game reports from {{villageName}}. You can toggle different types of reports by using report filters above.',
            { villageName: currentVillage.name },
          )}
        </Text>
      </InformationPopover>
      <Text as="h2">
        {t('Reports in {{villageName}}', { villageName: currentVillage.name })}
      </Text>
    </>
  );
};
