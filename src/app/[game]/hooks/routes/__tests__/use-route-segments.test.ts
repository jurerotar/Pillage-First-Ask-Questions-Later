import { describe, expect } from 'vitest';
import { renderHookWithGameContext } from 'test-utils';
import { serverMock } from 'mocks/models/game/server-mock';
import { villageMock } from 'mocks/models/game/village/village-mock';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';

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
