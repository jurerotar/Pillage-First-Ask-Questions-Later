import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import type React from 'react';

const ReportPage: React.FC = () => {
  const { reportId: _reportId } = useRouteSegments();

  return <></>;
};

export default ReportPage;
