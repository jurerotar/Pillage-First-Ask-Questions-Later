// @vitest-environment happy-dom

import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabWidths = new Map([
  ['overview', 80],
  ['inventory', 100],
  ['adventures', 100],
  ['auctions', 90],
]);

const renderTabs = (initialContainerWidth = 500) => {
  let containerWidth = initialContainerWidth;
  const resizeCallbacks = new Set<ResizeObserverCallback>();

  const resizeObserver = vi
    .spyOn(globalThis, 'ResizeObserver')
    .mockImplementation(
      class implements ResizeObserver {
        private readonly callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
          resizeCallbacks.add(callback);
        }

        disconnect = () => {
          resizeCallbacks.delete(this.callback);
        };
        observe = vi.fn();
        unobserve = vi.fn();
      },
    );

  const offsetWidth = vi
    .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('data-slot') === 'tab-list') {
        return containerWidth;
      }

      if (this.getAttribute('data-slot') === 'tab-more-measure') {
        return 72;
      }

      return tabWidths.get(this.getAttribute('data-value') ?? '') ?? 0;
    });

  const result = render(
    <Tabs defaultValue="overview">
      <TabList aria-label="Hero tabs">
        <Tab value="overview">Overview</Tab>
        <Tab value="inventory">Inventory</Tab>
        <Tab value="adventures">Adventures</Tab>
        <Tab value="auctions">Auctions</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="inventory">Inventory panel</TabPanel>
      <TabPanel value="adventures">Adventures panel</TabPanel>
      <TabPanel value="auctions">Auctions panel</TabPanel>
    </Tabs>,
  );

  return {
    ...result,
    resize: (width: number) => {
      containerWidth = width;
      act(() => {
        for (const callback of resizeCallbacks) {
          callback([], {} as ResizeObserver);
        }
      });
    },
    [Symbol.dispose]: () => {
      try {
        cleanup();
      } finally {
        resizeObserver.mockRestore();
        offsetWidth.mockRestore();
      }
    },
  };
};

describe(Tabs, () => {
  test('renders all tabs without a more menu when they fit', async () => {
    using result = renderTabs();

    await waitFor(() => {
      expect(result.queryByRole('tab', { name: 'Overview' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Inventory' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Adventures' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Auctions' })).not.toBeNull();
      expect(result.queryByRole('button', { name: 'More' })).toBeNull();
    });
  });

  test('moves overflowing tabs into the more menu', async () => {
    using result = renderTabs(220);

    await waitFor(() => {
      expect(result.queryByRole('tab', { name: 'Overview' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Inventory' })).toBeNull();
      expect(result.queryByRole('button', { name: 'More' })).not.toBeNull();
    });

    fireEvent.click(result.getByRole('button', { name: 'More' }));

    expect(result.queryByRole('button', { name: 'Inventory' })).not.toBeNull();
    expect(result.queryByRole('button', { name: 'Adventures' })).not.toBeNull();
    expect(result.queryByRole('button', { name: 'Auctions' })).not.toBeNull();
  });

  test('selects an overflowing tab from the more menu', async () => {
    using result = renderTabs(220);

    await waitFor(() => {
      expect(result.queryByRole('button', { name: 'More' })).not.toBeNull();
    });

    fireEvent.click(result.getByRole('button', { name: 'More' }));
    fireEvent.click(result.getByRole('button', { name: 'Inventory' }));

    expect(result.getByText('Inventory panel').hasAttribute('hidden')).toBe(
      false,
    );
    expect(result.queryByRole('button', { name: 'Inventory' })).toBeNull();
  });

  test('restores visible tabs when the list becomes wide enough', async () => {
    using result = renderTabs(220);

    await waitFor(() => {
      expect(result.queryByRole('button', { name: 'More' })).not.toBeNull();
    });

    result.resize(500);

    await waitFor(() => {
      expect(result.queryByRole('tab', { name: 'Inventory' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Adventures' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Auctions' })).not.toBeNull();
      expect(result.queryByRole('button', { name: 'More' })).toBeNull();
    });
  });
});
