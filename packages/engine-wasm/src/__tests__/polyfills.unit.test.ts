import { afterEach, expect, test, vi } from 'vitest';

const NativeSearchParams = URLSearchParams;
afterEach(() => vi.unstubAllGlobals());

test.each([
  '',
  '?a=1&a=2&empty=&flag',
  'q=hello+world&name=%C5%BD%F0%9F%90%89',
  'a=x=y&&b=%26%3D',
  'x=%&x=%A&x=%GG&x=%FF&x=%E0%A4%A',
  'x=%C0%AF&x=%ED%A0%80&x=%F4%90%80%80&x=%E0%80%A4',
  'x=%F0%9F%90&x=%E1%80A&x=%C2%41&x=%00%25%2B',
  'x=\ud800&x=\udc00&x=\ud83d\udc09&%FF=value',
])('portable query parsing matches the host for %s', async (query) => {
  vi.resetModules();
  vi.stubGlobal('URLSearchParams', undefined);
  await import('../polyfills');
  expect([...new URLSearchParams(query)]).toEqual([
    ...new NativeSearchParams(query),
  ]);
});

test('existing host globals are preserved', async () => {
  vi.resetModules();
  const logger = { error: vi.fn() };
  vi.stubGlobal('console', logger);
  await import('../polyfills');
  expect(console).toBe(logger);
  expect(URLSearchParams).toBe(NativeSearchParams);
});

test('a missing logger gets the error method needed by resolvers', async () => {
  vi.resetModules();
  vi.stubGlobal('console', undefined);
  await import('../polyfills');
  expect(() => console.error('resolver failure')).not.toThrow();
});
