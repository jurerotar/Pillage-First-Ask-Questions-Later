import { useTranslation } from 'react-i18next';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import type { ReportScope } from './reports-tabs';

type ReportsListHeaderProps = {
  scope: ReportScope;
  villageName: string;
};

export const ReportsListHeader = ({
  scope,
  villageName,
}: ReportsListHeaderProps) => {
  const { t } = useTranslation();

  const title =
    scope === 'global'
      ? t('All reports')
      : scope === 'unread'
        ? t('Unread reports')
        : scope === 'archived'
          ? t('Archived reports')
          : t('Reports in {{villageName}}', { villageName });

  const description =
    scope === 'global'
      ? t(
          'This is a categorized view of in-game reports. You can toggle different types of reports by using report filters above.',
        )
      : scope === 'unread'
        ? t(
            'This is a categorized view of unread reports. You can toggle different types of reports by using report filters above.',
          )
        : scope === 'archived'
          ? t(
              'This is a categorized view of archived reports. These reports are not deleted once a limit is reached and you can have an unlimited amount of them. You can toggle different types of reports by using report filters above.',
            )
          : t(
              'This is a categorized view of in-game reports from {{villageName}}. You can toggle different types of reports by using report filters above.',
              { villageName },
            );

  return (
    <SectionContent>
      <InformationPopover ariaLabel={title}>
        <Text>{description}</Text>
      </InformationPopover>
      <Text as="h2">{title}</Text>
    </SectionContent>
  );
};
