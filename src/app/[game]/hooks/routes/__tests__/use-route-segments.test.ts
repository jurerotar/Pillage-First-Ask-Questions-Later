import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { renderHookWithGameContext } from 'test-utils';
import { describe, expect } from 'vitest';
import { serverMock } from 'mocks/game/server-mock';
import { villageMock } from 'mocks/game/village/village-mock';

const { slug: mockServerSlug } = serverMock;
const { slug: mockVillageSlug } = villageMock;

describe('useRouteSegments', () => {
  test('Parsed server slug matches with mock server slug', () => {
    const { result } = renderHookWithGameContext(() => useRouteSegments());
    const { serverSlug } = result.current;

    expect(serverSlug).toBe(mockServerSlug);
  });

  test('Parsed village slug matches with mock village slug', () => {
    const { result } = renderHookWithGameContext(() => useRouteSegments());
    const { villageSlug } = result.current;

    expect(villageSlug).toBe(mockVillageSlug);
  });
});
