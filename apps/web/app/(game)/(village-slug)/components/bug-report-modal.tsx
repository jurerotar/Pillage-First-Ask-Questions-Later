import { use } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { env } from '@pillage-first/utils/env';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { ApiContext } from 'app/(game)/providers/api-context';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Label } from 'app/components/ui/label';
import { Spinner } from 'app/components/ui/spinner';

type BugReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ReportResponse = {
  reportId: string;
  writeToken: string;
};

type UploadReservation = {
  chunkSize: number;
  chunkUrlTemplate: string;
  completeUrl: string;
};

type BugReportFormValues = {
  description: string;
};

const getBugReporterUrl = (pathname: string): URL => {
  if (!env.VITE_BUG_REPORTER_URL) {
    throw new Error('Bug reporting is not configured.');
  }

  return new URL(pathname, env.VITE_BUG_REPORTER_URL);
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : response.statusText;
  } catch {
    return response.statusText;
  }
};

const fetchJson = async <T,>(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

const createDiagnostics = (server: ReturnType<typeof useServer>['server']) => {
  return {
    appVersion: env.VERSION,
    browserLanguage: navigator.language,
    browserLanguages: navigator.languages,
    gameWorld: {
      id: server.id,
      mapSize: server.configuration.mapSize,
      name: server.name,
      slug: server.slug,
      speed: server.configuration.speed,
      version: server.version,
    },
    location: window.location.href,
    reportedAt: new Date().toISOString(),
    screen: {
      devicePixelRatio: window.devicePixelRatio,
      height: window.screen.height,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      width: window.screen.width,
    },
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  };
};

const uploadWorld = async (
  database: Uint8Array,
  description: string,
  server: ReturnType<typeof useServer>['server'],
): Promise<void> => {
  const reportDescription = [
    description.trim(),
    '',
    'Automatic diagnostics:',
    JSON.stringify(createDiagnostics(server), null, 2),
  ]
    .join('\n')
    .slice(0, 10_000);

  const report = await fetchJson<ReportResponse>(
    getBugReporterUrl('/api/reports'),
    {
      body: JSON.stringify({
        description: reportDescription,
        title: `Bug report: ${server.name}`.slice(0, 200),
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );

  const world = new Blob([Uint8Array.from(database)], {
    type: 'application/x-sqlite3',
  });

  const getUploadReservation = () =>
    fetchJson<UploadReservation>(
      getBugReporterUrl(`/api/reports/${report.reportId}/world/upload-url`),
      {
        headers: { authorization: `Bearer ${report.writeToken}` },
        method: 'POST',
      },
    );

  let reservation = await fetchJson<UploadReservation>(
    getBugReporterUrl(`/api/reports/${report.reportId}/world`),
    {
      body: JSON.stringify({
        filename: `${server.slug}.sqlite3`,
        size: world.size,
      }),
      headers: {
        authorization: `Bearer ${report.writeToken}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  );

  for (
    let chunkIndex = 0, start = 0;
    start < world.size;
    chunkIndex += 1, start += reservation.chunkSize
  ) {
    const end = Math.min(start + reservation.chunkSize, world.size);
    const chunk = world.slice(start, end);
    const uploadChunk = async (): Promise<Response> => {
      const uploadUrl = reservation.chunkUrlTemplate.replace(
        '{chunkIndex}',
        String(chunkIndex),
      );
      return fetch(uploadUrl, {
        body: chunk,
        headers: {
          'content-range': `bytes ${start}-${end - 1}/${world.size}`,
        },
        method: 'PUT',
      });
    };

    let response = await uploadChunk();

    if (response.status === 401) {
      reservation = await getUploadReservation();
      response = await uploadChunk();
    }

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
  }

  const completeUpload = () => {
    return fetch(getBugReporterUrl(reservation.completeUrl), {
      method: 'POST',
    });
  };

  let completeResponse = await completeUpload();

  if (completeResponse.status === 401) {
    reservation = await getUploadReservation();
    completeResponse = await completeUpload();
  }

  if (!completeResponse.ok) {
    throw new Error(await getErrorMessage(completeResponse));
  }
};

export const BugReportModal = ({ isOpen, onClose }: BugReportModalProps) => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { apiClient } = use(ApiContext);
  const form = useForm<BugReportFormValues>({
    defaultValues: { description: '' },
  });
  const isSubmitting = form.formState.isSubmitting;
  const formError =
    form.formState.errors.description?.message ??
    form.formState.errors.root?.message;

  const submit = async ({ description }: BugReportFormValues) => {
    form.clearErrors('root');

    try {
      const { data: database } = await apiClient.get('/server/database');
      await uploadWorld(database, description, server);
      form.reset();
      onClose();
    } catch (submissionError) {
      form.setError('root', {
        message:
          submissionError instanceof Error
            ? submissionError.message
            : t('Unable to submit the bug report.'),
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <form onSubmit={form.handleSubmit(submit)}>
          <DialogHeader>
            <DialogTitle>{t('Report a bug')}</DialogTitle>
            <DialogDescription>
              {t(
                'Your current game world and browser details will be attached automatically.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-2">
            <Label htmlFor="bug-report-description">
              {t('What happened?')}
            </Label>
            <textarea
              id="bug-report-description"
              disabled={isSubmitting}
              maxLength={8_000}
              rows={7}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t('Include the steps that led to the problem.')}
              {...form.register('description', {
                required: t(
                  'Describe what happened before submitting the report.',
                ),
                validate: (value) =>
                  value.trim().length > 0 ||
                  t('Describe what happened before submitting the report.'),
              })}
            />
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting
                ? t('Submitting bug report…')
                : t('Submit bug report')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
