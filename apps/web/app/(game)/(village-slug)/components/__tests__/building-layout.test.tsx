// @vitest-environment happy-dom

import { fireEvent, render, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';

const renderOverflowContainer = () => {
  const result = render(
    <OverflowContainer>
      <button type="button">Child action</button>
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
});
