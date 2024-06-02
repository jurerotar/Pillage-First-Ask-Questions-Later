import { useGameNavigation } from 'app/[game]/hooks/routes/use-game-navigation';
import { serverMock } from 'mocks/models/game/server-mock';
import { villageMock } from 'mocks/models/game/village/village-mock';
import { renderHookWithGameContext } from 'test-utils';
import { describe, expect } from 'vitest';

const { slug: serverSlug } = serverMock;
const { slug: villageSlug } = villageMock;

describe('useGameNavigation', () => {
  test('Resources path includes serverSlug, villageId & resources pathname', () => {
    const { result } = renderHookWithGameContext(() => useGameNavigation());
    const { resourcesPath } = result.current;

    expect(resourcesPath.includes(serverSlug)).toBe(true);
    expect(resourcesPath.includes(villageSlug!)).toBe(true);
    expect(resourcesPath.includes('resources')).toBe(true);
  });

  test('Village path includes serverSlug, villageId & village pathname', () => {
    const { result } = renderHookWithGameContext(() => useGameNavigation());
    const { villagePath } = result.current;

    expect(villagePath.includes(serverSlug)).toBe(true);
    expect(villagePath.includes(villageSlug!)).toBe(true);
    expect(villagePath.includes('village')).toBe(true);
  });

  test('Map path includes serverSlug, villageId & map pathname', () => {
    const { result } = renderHookWithGameContext(() => useGameNavigation());
    const { mapPath } = result.current;

    expect(mapPath.includes(serverSlug)).toBe(true);
    expect(mapPath.includes(villageSlug!)).toBe(true);
    expect(mapPath.includes('map')).toBe(true);
  });
});
