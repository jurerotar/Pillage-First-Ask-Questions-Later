import '@testing-library/jest-dom';
import * as ResizeObserverModule from 'resize-observer-polyfill';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid',
  },
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverModule.default
});
