import { type ComponentType, lazy } from 'react';

const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 250,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

// biome-ignore lint/suspicious/noExplicitAny: Match React.lazy's constraint while preserving each component's props.
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 250,
) => {
  return lazy(async () => retry(importFn, retries, delay));
};
