import { describe, expect, test, vi } from 'vitest';
import { enqueueWrite } from '../opfs';

describe('createOpfsWriteQueue', () => {
  test('executes writes in order', async () => {
    const result: string[] = [];

    enqueueWrite(async () => {
      await new Promise((res) => setTimeout(res, 10));
      result.push('first');
    });

    enqueueWrite(async () => {
      await new Promise((res) => setTimeout(res, 5));
      result.push('second');
    });

    await new Promise((res) => setTimeout(res, 30));

    expect(result).toEqual(['first', 'second']);
  });

  test('handles rapid enqueue without dropping tasks', async () => {
    const result: string[] = [];

    for (let i = 0; i < 5; i++) {
      enqueueWrite(async () => {
        await new Promise((res) => setTimeout(res, 1));
        result.push(`task-${i}`);
      });
    }

    await new Promise((res) => setTimeout(res, 100));

    expect(result).toEqual(['task-0', 'task-1', 'task-2', 'task-3', 'task-4']);
  });

  test('catches and logs errors without halting the queue', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result: string[] = [];

    enqueueWrite(async () => {
      throw new Error('boom');
    });

    enqueueWrite(async () => {
      result.push('after-error');
    });

    await new Promise((res) => setTimeout(res, 10));

    expect(result).toContain('after-error');
    expect(spy).toHaveBeenCalledWith(
      '[writeQueue] Write failed:',
      expect.any(Error),
    );

    spy.mockRestore();
  });
});
