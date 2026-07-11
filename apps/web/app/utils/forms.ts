import type { FieldErrors, FieldValues } from 'react-hook-form';

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return undefined;
  }

  const { message } = error as { message?: unknown };

  return message ? message.toString() : undefined;
};

const getErrorMessages = (error: unknown): string[] => {
  const message = getErrorMessage(error);

  if (message) {
    return [message];
  }

  if (!error || typeof error !== 'object') {
    return [];
  }

  return Object.entries(error).flatMap(([key, value]) =>
    key === 'ref' ? [] : getErrorMessages(value),
  );
};

export const getFormErrorBag = <T extends FieldValues>(
  errors: FieldErrors<T>,
): string[] => {
  return getErrorMessages(errors);
};
