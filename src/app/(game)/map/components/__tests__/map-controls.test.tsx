import { screen, render } from '@testing-library/react';
import { MapControls } from 'app/(game)/map/components/map-controls';
import { MapProvider } from 'app/(game)/map/providers/map-context';
import userEvent from '@testing-library/user-event';

const functionalityEnabledButtonClassName = 'bg-green-200';

describe('MapControls', () => {
  test('Toggle faction reputation button exists and behaves correctly', async () => {
    render(<MapControls />, {
      wrapper: MapProvider
    });

    const toggleFactionReputationButton = screen.getByTestId('map-controls-toggle-faction-reputation-button');
    expect(toggleFactionReputationButton).toHaveClass(functionalityEnabledButtonClassName);
    await userEvent.click(toggleFactionReputationButton);
    expect(toggleFactionReputationButton).not.toHaveClass(functionalityEnabledButtonClassName);
  });
});
