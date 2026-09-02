// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ColorPickerPage from './page';

vi.mock('app/components/icons/icons.module.scss?raw', async () => {
  const { readFile } = await import('node:fs/promises');

  return {
    default: await readFile('app/components/icons/icons.module.scss', 'utf8'),
  };
});

const horseColorsStorageKey = 'pillage-first:cavalry-icon-colors:v1';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('cavalry color picker persistence', () => {
  test('stores only SCSS color overrides and removes reset colors', async () => {
    window.localStorage.setItem(
      horseColorsStorageKey,
      JSON.stringify({
        'roman-scout': {
          base: '#123456',
          baseBottom: '#86745b',
        },
      }),
    );

    render(<ColorPickerPage />);

    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem(horseColorsStorageKey) ?? ''),
      ).toEqual({
        'roman-scout': {
          base: '#123456',
        },
      });
    });

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Reset to default' })[0],
    );

    await waitFor(() => {
      expect(window.localStorage.getItem(horseColorsStorageKey)).toBeNull();
    });
  });
});
