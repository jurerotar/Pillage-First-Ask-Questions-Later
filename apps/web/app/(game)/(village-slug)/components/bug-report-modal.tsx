import { faro } from '@grafana/faro-web-sdk';
import { useMutation } from '@tanstack/react-query';
import { use, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { Input } from 'app/components/ui/input';
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
  contact: string;
};

type PendingUpload = {
  world: Blob;
  filename: string;
  description: string;
  contact: string;
  title: string;
  report?: ReportResponse;
  reservation?: UploadReservation;
  nextChunkIndex: number;
};

const getBugReporterUrl = (pathname: string): URL => {
  if (!env.VITE_API_URL) {
    throw new Error('Bug reporting is not configured.');
  }

  return new URL(pathname, env.VITE_API_URL);
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
    faroSessionId: faro.api?.getSession()?.id ?? null,
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

const uploadWorld = async (upload: PendingUpload): Promise<void> => {
  upload.report ??= await fetchJson<ReportResponse>(
    getBugReporterUrl('/api/reports'),
    {
      body: JSON.stringify({
        contact: upload.contact || undefined,
        description: upload.description,
        title: upload.title,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );

  const { report, world } = upload;

  const getUploadReservation = () =>
    fetchJson<UploadReservation>(
      getBugReporterUrl(`/api/reports/${report.reportId}/world/upload-url`),
      {
        headers: { authorization: `Bearer ${report.writeToken}` },
        method: 'POST',
      },
    );

  upload.reservation ??= await fetchJson<UploadReservation>(
    getBugReporterUrl(`/api/reports/${report.reportId}/world`),
    {
      body: JSON.stringify({
        filename: upload.filename,
        size: world.size,
      }),
      headers: {
        authorization: `Bearer ${report.writeToken}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  );

  let reservation = upload.reservation;

  while (upload.nextChunkIndex * reservation.chunkSize < world.size) {
    const chunkIndex = upload.nextChunkIndex;
    const start = chunkIndex * reservation.chunkSize;
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
      upload.reservation = reservation;
      response = await uploadChunk();
    }

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
    upload.nextChunkIndex += 1;
  }

  const completeUpload = () => {
    return fetch(getBugReporterUrl(reservation.completeUrl), {
      method: 'POST',
    });
  };

  let completeResponse = await completeUpload();

  if (completeResponse.status === 401) {
    reservation = await getUploadReservation();
    upload.reservation = reservation;
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
    defaultValues: { description: '', contact: '' },
  });
  const pendingUpload = useRef<PendingUpload | null>(null);

  const {
    mutate: submit,
    isPending: isSubmitting,
    error,
  } = useMutation<void, Error, BugReportFormValues>({
    mutationFn: async ({ description, contact }) => {
      if (!pendingUpload.current) {
        const diagnostics = createDiagnostics(server);
        const { data: database } = await apiClient.get('/server/database');

        pendingUpload.current = {
          world: new Blob([Uint8Array.from(database)], {
            type: 'application/x-sqlite3',
          }),
          filename: `${server.slug}.sqlite3`,
          description: [
            description.trim(),
            '',
            'Automatic diagnostics:',
            JSON.stringify(diagnostics, null, 2),
          ]
            .join('\n')
            .slice(0, 10_000),
          contact: contact.trim(),
          title: `Bug report: ${server.name}`.slice(0, 200),
          nextChunkIndex: 0,
        };
      }

      await uploadWorld(pendingUpload.current);
    },
    onSuccess: () => {
      pendingUpload.current = null;
      form.reset();
      onClose();
      toast.success(t('Bug report submitted. Thank you!'));
    },
    onError: () => {
      if (!pendingUpload.current?.report) {
        pendingUpload.current = null;
      }
    },
  });

  const formError =
    form.formState.errors.description?.message ?? error?.message;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent
        closeDisabled={isSubmitting}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
      >
        <form onSubmit={form.handleSubmit((values) => submit(values))}>
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
              readOnly={!!pendingUpload.current?.report}
              maxLength={8000}
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
            <Label
              htmlFor="bug-report-contact"
              className="mt-2"
            >
              {t('Contact (optional)')}
            </Label>
            <Input
              id="bug-report-contact"
              type="text"
              disabled={isSubmitting}
              readOnly={!!pendingUpload.current?.report}
              maxLength={320}
              placeholder={t('Discord username or email address')}
              aria-describedby="bug-report-contact-help"
              {...form.register('contact')}
            />
            {!!pendingUpload.current?.report && !isSubmitting && (
              <p className="text-sm text-muted-foreground">
                {t(
                  'Your report has been saved. Submit again to resume the world upload.',
                )}
              </p>
            )}
            {formError && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {formError}
              </p>
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
