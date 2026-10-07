import { Link } from 'react-router';
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
    <section>
      <div className="toolbar">
        <h2>All reports</h2>
        <button
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Refresh
        </button>
      </div>
      {error && <p role="alert">{error.message}</p>}
      {isPending && <p role="status">Loading reports…</p>}
      {reports?.length === 0 && <p>No reports yet.</p>}
      {reports && reports.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th>World</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>
                    <span className={`status ${report.status}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>{report.world?.status ?? 'No upload'}</td>
                  <td>
                    <Link
                      to={`/reports/${report.id}`}
                      aria-label={`Open ${report.title}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
