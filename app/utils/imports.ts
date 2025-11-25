import { type JSX, lazy } from 'react';

const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 250,
): Promise<T> => {
  try {
    return await fn();
  } catch {
    await new Promise((res) => setTimeout(res, delay));
    return retry(fn, retries - 1);
  }
};

export const lazyWithRetry = <T extends { default: () => JSX.Element }>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 250,
) => {
  return lazy(() => retry(importFn, retries, delay));
};
