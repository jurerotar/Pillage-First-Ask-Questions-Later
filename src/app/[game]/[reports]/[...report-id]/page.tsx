import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import type React from 'react';

export const ReportPage: React.FC = () => {
  const { reportId: _reportId } = useRouteSegments();

  return <></>;
};
