import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { Head } from 'app/components/head';
import type React from 'react';

export const ReportPage: React.FC = () => {
  const { reportId } = useRouteSegments();
  console.log({ reportId });

  return (
    <>
      <Head viewName="resources" />
    </>
  );
};
