import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';

const ReportPage = () => {
  const { reportId: _reportId } = useRouteSegments();

  return <>Individual report page</>;
};

export default ReportPage;
