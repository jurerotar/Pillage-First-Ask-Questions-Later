import { render, screen, fireEvent } from '@testing-library/react';
import { MapControls } from 'app/(game)/map/components/map-controls';
import { MapProvider } from 'app/(game)/map/providers/map-context';

const functionalityEnabledButtonClassName = 'bg-green-200';

describe('MapControls', () => {
  test('Toggle faction reputation button exists and behaves correctly', () => {
    render(<MapControls />, {
      wrapper: MapProvider
    });

    const toggleFactionReputationButton = screen.getByTestId('map-controls-toggle-faction-reputation-button');
    expect(toggleFactionReputationButton).toHaveClass(functionalityEnabledButtonClassName)
    fireEvent.click(toggleFactionReputationButton);
    expect(toggleFactionReputationButton).not.toHaveClass(functionalityEnabledButtonClassName);
  })
});
