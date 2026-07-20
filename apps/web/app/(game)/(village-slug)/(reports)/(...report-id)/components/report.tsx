import { createContext, type PropsWithChildren, use, useMemo } from 'react';
import type { Report as ReportType } from '@pillage-first/types/models/report';
import { getReportSubject } from 'app/(game)/(village-slug)/(reports)/utils/report-subject';
import { Text } from 'app/components/text';

type ReportContextState = {
  report: ReportType;
};

export const ReportContext = createContext<ReportContextState>(
  {} as ReportContextState,
);

type ReportProps = {
  report: ReportType;
};

export const Report = ({
  report,
  children,
}: PropsWithChildren<ReportProps>) => {
  const value = useMemo(
    () => ({
      report,
    }),
    [report],
  );

  return (
    <ReportContext value={value}>
      <article className="flex flex-col gap-2">{children}</article>
    </ReportContext>
  );
};

export const ReportHeader = () => {
  const { report } = use(ReportContext);

  return (
    <div className="flex flex-col gap-2">
      <Text as="h1">{getReportSubject(report)}</Text>
      <Text
        as="span"
        className="text-muted"
      >
        {new Date(report.timestamp).toLocaleString()}
      </Text>
    </div>
  );
};
