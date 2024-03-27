import React from 'react';
import { Head } from 'app/components/head';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';

export const ReportPage: React.FC = () => {
  const { reportId } = useRouteSegments();
  console.log({ reportId });

  return (
    <>
      <Head viewName="resources" />
    </>
  );
};
