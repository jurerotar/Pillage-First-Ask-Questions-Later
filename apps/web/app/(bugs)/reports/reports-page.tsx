import { Link } from 'react-router';
import { Button } from 'app/components/ui/button';
import { formatDate } from '../api';
import { useReports } from './hooks/use-reports';

export const ReportsPage = ({ token }: { token: string }) => {
  const {
    data: reports,
    error,
    isPending,
    isFetching,
    refetch,
  } = useReports(token);

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold leading-tight">All reports</h2>
        <Button
          variant="outline"
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Refresh
        </Button>
      </div>
      {error && (
        <p
          className="text-destructive"
          role="alert"
        >
          {error.message}
        </p>
      )}
      {isPending && <p role="status">Loading reports…</p>}
      {reports?.length === 0 && <p>No reports yet.</p>}
      {reports && reports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left [&_th]:border-b [&_th]:p-3 [&_th]:text-sm [&_th]:font-semibold [&_th]:text-muted-foreground [&_td]:border-b [&_td]:p-3">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  className="relative hover:bg-accent focus-within:bg-accent"
                  key={report.id}
                >
                  <td className="min-w-45 wrap-anywhere">
                    <Link
                      className="text-inherit no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring focus-visible:after:-outline-offset-2"
                      to={`/bugs/reports/${encodeURIComponent(report.id)}`}
                    >
                      {report.title}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-sm ${report.status === 'open' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300' : 'bg-green-500/15 text-green-700 dark:text-green-300'}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td>{formatDate(report.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
