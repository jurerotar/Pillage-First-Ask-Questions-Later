import '@testing-library/jest-dom';
import * as ResizeObserverModule from 'resize-observer-polyfill';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid',
  },
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverModule.default,
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string): string => str,
  }),
}));
