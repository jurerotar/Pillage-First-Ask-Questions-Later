// @vitest-environment happy-dom

import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabWidths = new Map([
  ['overview', 80],
  ['inventory', 100],
  ['adventures', 100],
  ['auctions', 90],
]);

let containerWidth = 500;
let moreButtonWidth = 72;
let originalOffsetWidth: PropertyDescriptor | undefined;
let resizeCallbacks: ResizeObserverCallback[] = [];

const triggerResize = () => {
  act(() => {
    for (const callback of resizeCallbacks) {
      callback([], {} as ResizeObserver);
    }
  });
};

const renderTabs = () => {
  return render(
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
};

describe(Tabs, () => {
  beforeEach(() => {
    resizeCallbacks = [];
    containerWidth = 500;
    moreButtonWidth = 72;
    originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );

    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserverMock {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }

        disconnect = vi.fn();
        observe = vi.fn();
        unobserve = vi.fn();
      },
    );

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        const element = this as HTMLElement;

        if (element.getAttribute('data-slot') === 'tab-list') {
          return containerWidth;
        }

        if (element.getAttribute('data-slot') === 'tab-more-measure') {
          return moreButtonWidth;
        }

        const tabValue = element.getAttribute('data-value');
        if (tabValue !== null) {
          return tabWidths.get(tabValue) ?? 0;
        }

        return 0;
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();

    if (originalOffsetWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        'offsetWidth',
        originalOffsetWidth,
      );
      return;
    }

    Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
  });

  test('renders all tabs without a more menu when they fit', async () => {
    const result = renderTabs();

    await waitFor(() => {
      expect(result.queryByRole('tab', { name: 'Overview' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Inventory' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Adventures' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Auctions' })).not.toBeNull();
      expect(result.queryByRole('button', { name: 'More' })).toBeNull();
    });
  });

  test('moves overflowing tabs into the more menu', async () => {
    containerWidth = 220;
    const result = renderTabs();

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
    containerWidth = 220;
    const result = renderTabs();

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
    containerWidth = 220;
    const result = renderTabs();

    await waitFor(() => {
      expect(result.queryByRole('button', { name: 'More' })).not.toBeNull();
    });

    containerWidth = 500;
    triggerResize();

    await waitFor(() => {
      expect(result.queryByRole('tab', { name: 'Inventory' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Adventures' })).not.toBeNull();
      expect(result.queryByRole('tab', { name: 'Auctions' })).not.toBeNull();
      expect(result.queryByRole('button', { name: 'More' })).toBeNull();
    });
  });
});
