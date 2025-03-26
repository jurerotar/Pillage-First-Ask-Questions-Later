import { screen } from '@testing-library/react';
import VillagePage from 'app/(game)/(village-slug)/(village)/page';
import { serverPathMock } from 'app/tests/mocks/game/server-mock';
import { renderWithGameContext } from 'app/tests/test-utils';
import { describe, expect, test } from 'vitest';

describe('Resource page', () => {
  const options = {
    path: `${serverPathMock}/v-1/resources`,
  };

  test('Village link should be rendered', () => {
    renderWithGameContext(<VillagePage />, options);

    expect(screen.getByLabelText('Village')).toBeInTheDocument();
  });

  test('19 links should be rendered', () => {
    renderWithGameContext(<VillagePage />, options);

    expect(screen.queryAllByRole('link').length).toBe(19);
  });

  test('Correct resource composition should be rendered', () => {
    renderWithGameContext(<VillagePage />, options);

    expect(screen.queryAllByLabelText('BUILDINGS.WOODCUTTER.NAME').length, 'Wood fields').toBe(4);
    expect(screen.queryAllByLabelText('BUILDINGS.CLAY_PIT.NAME').length, 'Clay fields').toBe(4);
    expect(screen.queryAllByLabelText('BUILDINGS.IRON_MINE.NAME').length, 'Iron fields').toBe(4);
    expect(screen.queryAllByLabelText('BUILDINGS.CROPLAND.NAME').length, 'Wheat fields').toBe(6);
  });
});

describe('Village page', () => {
  const options = {
    path: `${serverPathMock}/v-1/village`,
  };

  test('22 building fields should be rendered', () => {
    renderWithGameContext(<VillagePage />, options);

    expect(screen.queryAllByRole('link').length).toBe(22);
  });
});
