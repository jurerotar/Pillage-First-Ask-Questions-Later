import * as ResizeObserverModule from 'resize-observer-polyfill';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import '@vitest/web-worker';
import 'packages/vitest-opfs-mock';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid',
  },
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverModule.default,
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string): string => str,
  }),
}));
