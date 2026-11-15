import { useOutletContext } from 'react-router';
import { ReportsPage } from './reports/reports-page';

export default function BugsPage() {
  const token = useOutletContext<string>();
  return <ReportsPage token={token} />;
}
