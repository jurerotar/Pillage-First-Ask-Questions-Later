// @vitest-environment happy-dom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useLongPress } from 'app/hooks/use-long-press';

const TestLongPressTarget = ({ onLongPress }: { onLongPress: () => void }) => {
  const longPress = useLongPress(onLongPress, 1000);

  return (
    <button
      type="button"
      {...longPress}
    >
      Upgrade
    </button>
  );
};

const renderLongPressTarget = () => {
  const onLongPress = vi.fn();
  const result = render(<TestLongPressTarget onLongPress={onLongPress} />);
  const target = result.getByRole('button');
  const capturedPointers = new Set<number>();

  target.setPointerCapture = vi.fn((pointerId: number) => {
    capturedPointers.add(pointerId);
  });
  target.hasPointerCapture = vi.fn((pointerId: number) => {
    return capturedPointers.has(pointerId);
  });
  target.releasePointerCapture = vi.fn((pointerId: number) => {
    capturedPointers.delete(pointerId);
  });

  return {
    onLongPress,
    target,
  };
};

describe(useLongPress, () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test('calls callback after the long press timeout', () => {
    vi.useFakeTimers();
    const { onLongPress, target } = renderLongPressTarget();

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => vi.advanceTimersByTime(1000));

    expect(onLongPress).toHaveBeenCalledOnce();
  });

  test('cancels long press when touch moves beyond the cancel distance', () => {
    vi.useFakeTimers();
    const { onLongPress, target } = renderLongPressTarget();

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerMove(target, {
      clientX: 10,
      clientY: 19,
      pointerId: 1,
    });
    act(() => vi.advanceTimersByTime(1000));

    expect(onLongPress).not.toHaveBeenCalled();
  });

  test('keeps long press active for small touch movement', () => {
    vi.useFakeTimers();
    const { onLongPress, target } = renderLongPressTarget();

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
    });
    fireEvent.pointerMove(target, {
      clientX: 10,
      clientY: 14,
      pointerId: 1,
    });
    act(() => vi.advanceTimersByTime(1000));

    expect(onLongPress).toHaveBeenCalledOnce();
  });

  test('does not call callback more than once during a held press', () => {
    vi.useFakeTimers();
    const { onLongPress, target } = renderLongPressTarget();

    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.pointerDown(target, {
      button: 0,
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
    });
    act(() => vi.advanceTimersByTime(3000));

    expect(onLongPress).toHaveBeenCalledOnce();
  });
});
