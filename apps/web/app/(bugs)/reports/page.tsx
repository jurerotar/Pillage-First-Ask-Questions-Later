import { useOutletContext } from 'react-router';
import { ReportPage } from './report-page';

export default function BugReportPage() {
  const token = useOutletContext<string>();
  return <ReportPage token={token} />;
}
