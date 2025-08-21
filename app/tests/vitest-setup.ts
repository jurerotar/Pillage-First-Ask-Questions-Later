import { vi } from 'vitest';
import '@testing-library/jest-dom';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid',
  },
});

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

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
