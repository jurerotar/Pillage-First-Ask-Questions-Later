import { Link, useParams } from 'react-router';
import { Button } from 'app/components/ui/button';
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
    return (
      <p
        className="text-destructive"
        role="alert"
      >
        {reportQuery.error.message}
      </p>
    );
  }

  const report = reportQuery.data;
  const diagnosticsMarker = [
    ...report.description.matchAll(/\r?\n\r?\nAutomatic diagnostics:\r?\n/gu),
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
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <Link
          className="text-link underline underline-offset-4"
          to="/bugs"
        >
          ← Back to reports
        </Link>
        <Button
          variant="outline"
          type="button"
          disabled={pending || reportQuery.isFetching}
          onClick={() => void reportQuery.refetch()}
        >
          Refresh
        </Button>
      </div>
      <h2 className="text-xl font-semibold leading-tight">{report.title}</h2>
      <span
        className={clsx(
          'inline-block rounded px-2 py-0.5 text-sm',
          report.status === 'open'
            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300'
            : 'bg-green-500/15 text-green-700 dark:text-green-300',
        )}
      >
        {report.status}
      </span>
      <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-y-2 [&_dt]:text-muted-foreground [&_dd]:mb-3 [&_dd]:wrap-anywhere sm:[&_dd]:mb-0">
        <dt>Report ID</dt>
        <dd>{report.id}</dd>
        <dt>Created</dt>
        <dd>{formatDate(report.createdAt)}</dd>
        <dt>Closed</dt>
        <dd>{formatDate(report.closedAt)}</dd>
        <dt>Contact</dt>
        <dd>{report.contact ?? 'Not provided'}</dd>
      </dl>
      <h3 className="mt-7 mb-4 font-semibold">Description</h3>
      <CopyableText
        key={`description-${report.id}`}
        text={description}
        label="bug description"
      />
      {diagnostics !== null && (
        <details
          key={`diagnostics-${report.id}`}
          className="group mt-7"
        >
          <summary className="cursor-pointer font-semibold group-open:mb-4">
            Automatic diagnostics
          </summary>
          <CopyableText
            text={diagnostics}
            label="automatic diagnostics"
          />
        </details>
      )}
      <h3 className="mt-7 mb-4 font-semibold">Game world</h3>
      {report.world ? (
        <>
          <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-y-2 [&_dt]:text-muted-foreground [&_dd]:mb-3 [&_dd]:wrap-anywhere sm:[&_dd]:mb-0">
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
              className="text-link underline underline-offset-4"
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
      {download.error && (
        <p
          className="text-destructive"
          role="alert"
        >
          {download.error.message}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
        <Button
          variant="outline"
          type="button"
          disabled={pending || report.status === 'closed'}
          onClick={() => closeReport.mutate()}
        >
          {report.status === 'closed' ? 'Report closed' : 'Close report'}
        </Button>
        <Button
          variant="outline"
          type="button"
          className="border-destructive text-destructive"
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
        </Button>
        {pending && <span role="status">Working…</span>}
        {closeReport.error && (
          <p
            className="text-destructive"
            role="alert"
          >
            {closeReport.error.message}
          </p>
        )}
        {deleteReport.error && (
          <p
            className="text-destructive"
            role="alert"
          >
            {deleteReport.error.message}
          </p>
        )}
      </div>
    </section>
  );
};

import { clsx } from 'clsx';
