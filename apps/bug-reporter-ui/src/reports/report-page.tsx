import { Link, useParams } from 'react-router';
import { formatDate } from '../api';
import { CopyableText } from '../components/copyable-text';
import { useCloseReport } from './hooks/use-close-report';
import { useDeleteReport } from './hooks/use-delete-report';
import { useDownloadWorld } from './hooks/use-download-world';
import { useReport } from './hooks/use-report';

export const ReportPage = ({ token }: { token: string }) => {
  const { reportId = '' } = useParams();
  const reportQuery = useReport(token, reportId);
  const closeReport = useCloseReport(token, reportId);
  const deleteReport = useDeleteReport(token, reportId);
  const download = useDownloadWorld(token);

  const pending =
    closeReport.isPending || deleteReport.isPending || download.isPending;
  if (reportQuery.isPending) {
    return <p role="status">Loading report…</p>;
  }
  if (reportQuery.isError) {
    return <p role="alert">{reportQuery.error.message}</p>;
  }

  const report = reportQuery.data;
  const diagnosticsMarker = [
    ...report.description.matchAll(/\r?\n\r?\nAutomatic diagnostics:\r?\n/g),
  ].at(-1);
  const description = diagnosticsMarker
    ? report.description.slice(0, diagnosticsMarker.index)
    : report.description;
  const diagnostics = diagnosticsMarker
    ? report.description.slice(
        diagnosticsMarker.index + diagnosticsMarker[0].length,
      )
    : null;

  return (
    <section>
      <div className="toolbar">
        <Link to="/">← Back to reports</Link>
        <button
          type="button"
          disabled={pending || reportQuery.isFetching}
          onClick={() => void reportQuery.refetch()}
        >
          Refresh
        </button>
      </div>
      <h2>{report.title}</h2>
      <span className={`status ${report.status}`}>{report.status}</span>
      <dl>
        <dt>Report ID</dt>
        <dd>{report.id}</dd>
        <dt>Created</dt>
        <dd>{formatDate(report.createdAt)}</dd>
        <dt>Closed</dt>
        <dd>{formatDate(report.closedAt)}</dd>
        <dt>Contact</dt>
        <dd>{report.contact ?? 'Not provided'}</dd>
      </dl>
      <h3>Description</h3>
      <CopyableText
        key={`description-${report.id}`}
        text={description}
        label="bug description"
      />
      {diagnostics !== null && (
        <details
          key={`diagnostics-${report.id}`}
          className="diagnostics"
        >
          <summary>Automatic diagnostics</summary>
          <CopyableText
            text={diagnostics}
            label="automatic diagnostics"
          />
        </details>
      )}
      <h3>Game world</h3>
      {report.world ? (
        <>
          <dl>
            <dt>Upload ID</dt>
            <dd>{report.world.id}</dd>
            <dt>Filename</dt>
            <dd>{report.world.filename}</dd>
            <dt>Size</dt>
            <dd>{report.world.size.toLocaleString()} bytes</dd>
            <dt>Status</dt>
            <dd>{report.world.status}</dd>
            <dt>Created</dt>
            <dd>{formatDate(report.world.createdAt)}</dd>
            <dt>Completed</dt>
            <dd>{formatDate(report.world.completedAt)}</dd>
            <dt>File type</dt>
            <dd>{report.world.mimeType ?? 'Not checked yet'}</dd>
          </dl>
          {report.world.downloadUrl ? (
            <a
              href={report.world.downloadUrl}
              aria-disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                if (!pending) {
                  download.mutate({
                    id: report.world!.id,
                    downloadUrl: report.world!.downloadUrl!,
                  });
                }
              }}
            >
              Download SQLite database
            </a>
          ) : (
            <p>The world upload is still pending.</p>
          )}
        </>
      ) : (
        <p>No game world uploaded.</p>
      )}
      {download.error && <p role="alert">{download.error.message}</p>}
      <div className="actions">
        <button
          type="button"
          disabled={pending || report.status === 'closed'}
          onClick={() => closeReport.mutate()}
        >
          {report.status === 'closed' ? 'Report closed' : 'Close report'}
        </button>
        <button
          type="button"
          className="danger"
          disabled={pending}
          onClick={() => {
            if (
              window.confirm(
                'Delete this report and its uploaded game world? This cannot be undone.',
              )
            ) {
              deleteReport.mutate();
            }
          }}
        >
          Delete report
        </button>
        {pending && <span role="status">Working…</span>}
        {closeReport.error && <p role="alert">{closeReport.error.message}</p>}
        {deleteReport.error && <p role="alert">{deleteReport.error.message}</p>}
      </div>
    </section>
  );
};
