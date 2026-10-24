import { faro } from '@grafana/faro-web-sdk';
import type { ErrorWithContext } from '@pillage-first/utils/errors';

type ReportErrorContext = Record<
  string,
  boolean | null | number | string | undefined
>;

const toFaroContext = (
  context: ReportErrorContext = {},
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
};

const toError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    error.message
  ) {
    const result = new Error(String(error.message));

    if ('name' in error && error.name) {
      result.name = String(error.name);
    }

    if ('stack' in error && error.stack) {
      result.stack = String(error.stack);
    }

    if ('cause' in error && error.cause) {
      result.cause = error.cause;
    }

    if ('context' in error && error.context) {
      (result as ErrorWithContext).context = toFaroContext(
        error.context as ReportErrorContext,
      );
    }

    return result;
  }

  return new Error(fallbackMessage);
};

export const reportError = (
  error: unknown,
  fallbackMessage: string,
  context?: ReportErrorContext,
): void => {
  if (!faro?.api) {
    console.error(error);
    return;
  }

  if (faro.unpatchedConsole?.error) {
    faro.unpatchedConsole.error(fallbackMessage, error, context);
  } else {
    console.error(fallbackMessage, error, context);
  }

  const reportedError: ErrorWithContext = toError(error, fallbackMessage);

  faro.api.pushError(reportedError, {
    context: {
      message: fallbackMessage,
      ...reportedError.context,
      ...toFaroContext(context),
    },
  });
};
