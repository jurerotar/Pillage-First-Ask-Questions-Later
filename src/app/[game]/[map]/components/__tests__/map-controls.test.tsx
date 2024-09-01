import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapControls } from 'app/[game]/[map]/components/map-controls';
import { MapProvider } from 'app/[game]/[map]/providers/map-context';
import { renderWithGameContext } from 'test-utils';

const functionalityEnabledButtonClassName = 'bg-green-200';

describe('MapControls', () => {
  test('Toggle-faction-reputation-display button exists and behaves correctly', async () => {
    renderWithGameContext(<MapControls />, {
      wrapper: MapProvider,
    });

    const button = screen.getByLabelText('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_REPUTATION_DISPLAY');
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
  });

  test('Toggle-oasis-icons-display button exists and behaves correctly', async () => {
    renderWithGameContext(<MapControls />, {
      wrapper: MapProvider,
    });

    const button = screen.getByLabelText('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_OASIS_ICON_DISPLAY');
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
  });

  test('Toggle-treasures-display button exists and behaves correctly', async () => {
    renderWithGameContext(<MapControls />, {
      wrapper: MapProvider,
    });

    const button = screen.getByLabelText('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TREASURES_DISPLAY');
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
  });

  test('Toggle-troop-movements-display button exists and behaves correctly', async () => {
    renderWithGameContext(<MapControls />, {
      wrapper: MapProvider,
    });

    const button = screen.getByLabelText('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TROOP_MOVEMENTS_DISPLAY');
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
  });

  test('Toggle-wheat-fields-display button exists and behaves correctly', async () => {
    renderWithGameContext(<MapControls />, {
      wrapper: MapProvider,
    });

    const button = screen.getByLabelText('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_WHEAT_FIELDS_ICON_DISPLAY');
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
  });

  test('Toggle-tile-tooltip-display button exists and behaves correctly', async () => {
    renderWithGameContext(<MapControls />, {
      wrapper: MapProvider,
    });

    const button = screen.getByLabelText('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TILE_TOOLTIP_DISPLAY');
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).not.toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(button);
    expect(button).toHaveClass(functionalityEnabledButtonClassName);
  });
});
