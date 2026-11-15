import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuArrowLeft,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { buttonVariants } from 'app/components/ui/cvas/button-cva';

export const ReportsBackButton = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const label = t('Back');

  return (
    <Link
      to={{
        pathname: '../reports',
        search: location.search,
      }}
      className={buttonVariants({ variant: 'outline', size: 'icon' })}
      aria-label={label}
      title={label}
      data-tooltip-id="general-tooltip"
      data-tooltip-content={label}
    >
      <LuArrowLeft />
    </Link>
  );
};

type ReportNavigationButtonProps = {
  children: ReactNode;
  label: string;
  reportId: number | null;
};

export const ReportNavigationButton = ({
  children,
  label,
  reportId,
}: ReportNavigationButtonProps) => {
  const location = useLocation();
  const isDisabled = reportId === null;

  const className = buttonVariants({ variant: 'outline', size: 'icon' });

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        className={className}
        aria-label={label}
        title={label}
        data-tooltip-id="general-tooltip"
        data-tooltip-content={label}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      to={{ pathname: `../reports/${reportId}`, search: location.search }}
      className={className}
      aria-label={label}
      title={label}
      data-tooltip-id="general-tooltip"
      data-tooltip-content={label}
    >
      {children}
    </Link>
  );
};

type ReportNavigationButtonsProps = {
  previousReportId: number | null;
  nextReportId: number | null;
  previousUnreadReportId: number | null;
  nextUnreadReportId: number | null;
};

export const ReportNavigationButtons = ({
  previousReportId,
  nextReportId,
  previousUnreadReportId,
  nextUnreadReportId,
}: ReportNavigationButtonsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <ReportNavigationButton
          label={t('Previous unread')}
          reportId={previousUnreadReportId}
        >
          <LuChevronsLeft />
        </ReportNavigationButton>
        <ReportNavigationButton
          label={t('Previous')}
          reportId={previousReportId}
        >
          <LuChevronLeft />
        </ReportNavigationButton>
      </div>
      <div className="flex items-center gap-1">
        <ReportNavigationButton
          label={t('Next')}
          reportId={nextReportId}
        >
          <LuChevronRight />
        </ReportNavigationButton>
        <ReportNavigationButton
          label={t('Next unread')}
          reportId={nextUnreadReportId}
        >
          <LuChevronsRight />
        </ReportNavigationButton>
      </div>
    </div>
  );
};
