import type { FaroErrorBoundary as FaroBoundary } from '@grafana/faro-react';
import type { Faro } from '@grafana/faro-web-sdk';
import type { PropsWithChildren } from 'react';

export let faro: Faro | undefined;

let ErrorBoundary: typeof FaroBoundary | undefined;

export const setFaroClient = (
  client: Faro,
  errorBoundary: typeof FaroBoundary,
): void => {
  faro = client;
  ErrorBoundary = errorBoundary;
};

export const FaroErrorBoundary = ({ children }: PropsWithChildren) => {
  return ErrorBoundary ? <ErrorBoundary>{children}</ErrorBoundary> : children;
};
