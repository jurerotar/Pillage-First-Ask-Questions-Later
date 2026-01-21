import * as matchers from '@testing-library/jest-dom/matchers';
import type * as ReactRouter from 'react-router';
import { expect, vi } from 'vitest';

expect.extend(matchers);

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid',
  },
});

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof ReactRouter>('react-router');

  return {
    ...actual,
    useNavigation: () => ({
      state: 'idle',
    }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string): string => str,
  }),
}));

vi.mock('i18next', () => ({
  t: (str: string): string => str,
}));
