import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createEngine, type WasmModule } from '../client';

const request = { type: 'request', url: '/server', method: 'GET' } as const;
const response = {
  data: { name: 'Živjo 🐉' },
  notifications: [],
  nextDeadline: null,
};

describe('client native boundary', () => {
  const ccall = vi.fn();
  const module = {
    FS: { writeFile: vi.fn(), unlink: vi.fn() },
    HEAPU8: new Uint8Array([0, 0, 1, 2, 3, 0]),
    ccall,
  } as unknown as WasmModule;
  const load = () => createEngine(new Uint8Array([7, 8]), async () => module);

  beforeEach(() => {
    vi.resetAllMocks();
    module.HEAPU8 = new Uint8Array([0, 0, 1, 2, 3, 0]);
    ccall.mockImplementation(
      (name: string) =>
        ({
          engine_initialize: 1,
          engine_dispatch: JSON.stringify(response),
          engine_snapshot: 2,
          engine_snapshot_size: 3,
        })[name],
    );
  });

  test('loads the image once, releases its MEMFS copy and dispatches JSON', async () => {
    const engine = await load();
    expect(module.FS.writeFile).toHaveBeenCalledWith(
      '/world.sqlite3',
      new Uint8Array([7, 8]),
    );
    expect(module.FS.unlink).toHaveBeenCalledWith('/world.sqlite3');
    expect(engine.dispatch(request)).toEqual(response);
    expect(ccall).toHaveBeenCalledWith(
      'engine_dispatch',
      'string',
      ['string'],
      [JSON.stringify(request)],
    );
    engine.close();
  });

  test.each(['write', 'initialize', 'unlink'])(
    'releases a partially created engine when %s fails',
    async (stage) => {
      if (stage === 'write') {
        vi.mocked(module.FS.writeFile).mockImplementation(() => {
          throw new Error('write failed');
        });
      }
      if (stage === 'initialize') {
        ccall.mockReturnValue(0);
      }
      if (stage === 'unlink') {
        vi.mocked(module.FS.unlink).mockImplementation(() => {
          throw new Error('unlink failed');
        });
      }
      await expect(load()).rejects.toThrow();
      expect(
        ccall.mock.calls.filter(([name]) => name === 'engine_close'),
      ).toHaveLength(1);
    },
  );

  test('cleans up when native initialization throws', async () => {
    ccall.mockImplementation((name) => {
      if (name === 'engine_initialize') {
        throw new Error('native trap');
      }
    });
    await expect(load()).rejects.toThrow('native trap');
    expect(ccall).toHaveBeenCalledWith('engine_close', null, [], []);
  });

  test.each([null, '', '{', JSON.stringify({ error: 'constraint failed' })])(
    'reports dispatch failure %j and permits recovery',
    async (output) => {
      const engine = await load();
      ccall.mockReturnValueOnce(output);
      expect(() => engine.dispatch(request)).toThrow();
      expect(engine.dispatch(request)).toEqual(response);
      engine.close();
    },
  );

  test('snapshots are detached copies and survive memory growth and close', async () => {
    const engine = await load();
    const first = engine.snapshot();
    module.HEAPU8 = new Uint8Array([0, 0, 4, 5, 6, 0]);
    expect(engine.snapshot()).toEqual(new Uint8Array([4, 5, 6]));
    module.HEAPU8.fill(0);
    engine.close();
    expect(first).toEqual(new Uint8Array([1, 2, 3]));
  });

  test.each([
    [0, 3],
    [2, 0],
    [5, 3],
    [Number.NaN, 3],
    [2, Number.POSITIVE_INFINITY],
    [1.5, 3],
  ])('rejects invalid snapshot pointer/length %j', async (pointer, length) => {
    const engine = await load();
    ccall.mockReturnValueOnce(pointer).mockReturnValueOnce(length);
    expect(() => engine.snapshot()).toThrow('Could not serialize');
    engine.close();
  });

  test('close is idempotent and prevents native access afterwards', async () => {
    const engine = await load();
    engine.close();
    engine.close();
    expect(() => engine.dispatch(request)).toThrow('closed');
    expect(() => engine.snapshot()).toThrow('closed');
    expect(
      ccall.mock.calls.filter(([name]) => name === 'engine_close'),
    ).toHaveLength(1);
  });
});
