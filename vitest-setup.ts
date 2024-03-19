import '@testing-library/jest-dom';
import * as ResizeObserverModule from 'resize-observer-polyfill';
import { vi } from 'vitest';

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
