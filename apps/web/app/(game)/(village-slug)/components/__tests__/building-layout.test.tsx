// @vitest-environment happy-dom

import { cleanup, fireEvent, render, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';

const renderOverflowContainer = (children?: ReactNode) => {
  const result = render(
    <OverflowContainer>
      <button type="button">Child action</button>
      {children}
    </OverflowContainer>,
  );

  const overflowContainer = result.container
    .firstElementChild as HTMLDivElement;
  const button = within(result.container).getByRole('button', {
    name: 'Child action',
  });
  const capturedPointers = new Set<number>();

  Object.defineProperties(overflowContainer, {
    clientWidth: {
      configurable: true,
      value: 300,
    },
    scrollWidth: {
      configurable: true,
      value: 900,
    },
  });

  overflowContainer.setPointerCapture = vi.fn((pointerId: number) => {
    capturedPointers.add(pointerId);
  });
  overflowContainer.hasPointerCapture = vi.fn((pointerId: number) => {
    return capturedPointers.has(pointerId);
  });
  overflowContainer.releasePointerCapture = vi.fn((pointerId: number) => {
    capturedPointers.delete(pointerId);
  });

  return {
    button,
    overflowContainer,
  };
};

describe(OverflowContainer, () => {
  afterEach(cleanup);

  test('does not capture pointers or drag when clicking portal content', () => {
    const handleClick = vi.fn();
    const { overflowContainer } = renderOverflowContainer(
      createPortal(
        <div data-testid="portal-content">
          <button
            type="button"
            onClick={handleClick}
          >
            Portal action
          </button>
        </div>,
        document.body,
      ),
    );
    const portal = within(document.body).getByTestId('portal-content');
    const button = within(portal).getByRole('button', {
      name: 'Portal action',
    });

    fireEvent.pointerDown(button, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(button, {
      clientX: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse' });
    fireEvent.click(button);

    expect(overflowContainer.setPointerCapture).not.toHaveBeenCalled();
    expect(overflowContainer.scrollLeft).toBe(0);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(portal, {
      button: 0,
      clientX: 100,
      pointerId: 2,
      pointerType: 'mouse',
    });

    expect(overflowContainer.setPointerCapture).not.toHaveBeenCalled();
  });

  test('does not block portal actions after dragging the scroll area', () => {
    const handleClick = vi.fn();
    const { overflowContainer } = renderOverflowContainer(
      createPortal(
        <button
          type="button"
          onClick={handleClick}
        >
          Portal action
        </button>,
        document.body,
      ),
    );
    const button = within(document.body).getByRole('button', {
      name: 'Portal action',
    });

    fireEvent.pointerDown(overflowContainer, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(overflowContainer, {
      clientX: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(overflowContainer, {
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('scrolls horizontally when dragged with a mouse', () => {
    const { overflowContainer } = renderOverflowContainer();

    fireEvent.pointerDown(overflowContainer, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(overflowContainer, {
      clientX: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(overflowContainer, {
      pointerId: 1,
      pointerType: 'mouse',
    });

    expect(overflowContainer.scrollLeft).toBe(60);
  });

  test('does not drag-scroll for touch pointers', () => {
    const { overflowContainer } = renderOverflowContainer();

    fireEvent.pointerDown(overflowContainer, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(overflowContainer, {
      clientX: 40,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerUp(overflowContainer, {
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(overflowContainer.scrollLeft).toBe(0);
  });

  test('prevents child clicks immediately after a drag', () => {
    const { button, overflowContainer } = renderOverflowContainer();
    const handleClick = vi.fn();

    button.addEventListener('click', handleClick);

    fireEvent.pointerDown(overflowContainer, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(overflowContainer, {
      clientX: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(overflowContainer, {
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not hijack clicks that start on interactive children', () => {
    const { button, overflowContainer } = renderOverflowContainer();
    const handleClick = vi.fn();

    button.addEventListener('click', handleClick);

    fireEvent.pointerDown(button, {
      button: 0,
      clientX: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(overflowContainer, {
      clientX: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(overflowContainer, {
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.click(button);

    expect(overflowContainer.scrollLeft).toBe(0);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
