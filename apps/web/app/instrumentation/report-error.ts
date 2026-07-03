import { faro } from '@grafana/faro-web-sdk';

type ReportErrorContext = Record<
  string,
  boolean | null | number | string | undefined
>;

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
    return new Error(String(error.message));
  }

  return new Error(fallbackMessage);
};

const toFaroContext = (
  context: ReportErrorContext = {},
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
};

export const reportError = (
  error: unknown,
  fallbackMessage: string,
  context?: ReportErrorContext,
): void => {
  faro.unpatchedConsole.error(fallbackMessage, error, context);

  faro.api.pushError(toError(error, fallbackMessage), {
    context: {
      message: fallbackMessage,
      ...toFaroContext(context),
    },
  });
};
