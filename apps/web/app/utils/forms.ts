import type { FieldErrors, FieldValues } from 'react-hook-form';

export const getFormErrorBag = <T extends FieldValues>(
  errors: FieldErrors<T>,
): string[] => {
  return Object.values(errors).flatMap((error) => {
    if (!error) {
      return [];
    }

    if (error?.message) {
      return [error.message.toString()];
    }

    return Object.values(error)
      .map((nested) =>
        nested && typeof nested === 'object' && 'message' in nested
          ? nested.message?.toString()
          : undefined,
      )
      .filter((m): m is string => !!m);
  });
};
