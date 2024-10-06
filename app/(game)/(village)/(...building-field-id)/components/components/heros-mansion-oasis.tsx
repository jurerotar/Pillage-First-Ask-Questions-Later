import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useMap } from 'app/(game)/hooks/use-map';
import { useOccupiedOasis } from 'app/(game)/hooks/use-occupied-oasis';
import { isOasisTile } from 'app/(game)/utils/guards/map-guards';

export const HerosMansionOasis = () => {
  const { currentVillage } = useCurrentVillage();
  const { map } = useMap();
  const { hasOccupiedOasis } = useOccupiedOasis();

  const oasisTilesInRange = map.filter((tile) => {
    if (!isOasisTile(tile)) {
      return false;
    }

    const distanceX = Math.abs(currentVillage.coordinates.x - tile.coordinates.x);
    const distanceY = Math.abs(currentVillage.coordinates.y - tile.coordinates.y);
    const manhattanDistance = distanceX + distanceY;

    return manhattanDistance <= 3;
  });

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col">
        <h2>Occupied oasis</h2>
        {!hasOccupiedOasis && <p>No</p>}
        {hasOccupiedOasis && (
          <div className="flex flex-col border border-gray-300 w-full">
            <div className="flex font-medium">
              <div className="flex-1 p-2 border border-gray-300 text-center">Coordinates</div>
              <div className="flex-1 p-2 border border-gray-300 text-center">Resources</div>
              <div className="flex-1 p-2 border border-gray-300 text-center">Action</div>
            </div>
            {oasisTilesInRange.map((tile) => (
              <div
                className="flex"
                key={tile.id}
              >
                <div className="flex-1 p-2 border border-gray-300 text-center" />
                <div className="flex-1 p-2 border border-gray-300 text-center" />
                <div className="flex-1 p-2 border border-gray-300 text-center" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col">
        <h2>Oasis within reach</h2>
        <div className="flex flex-col border border-gray-300 w-full">
          <div className="flex font-medium">
            <div className="flex-1 p-2 border border-gray-300 text-center">Owner</div>
            <div className="flex-1 p-2 border border-gray-300 text-center">Coordinates</div>
            <div className="flex-1 p-2 border border-gray-300 text-center">Resources</div>
            <div className="flex-1 p-2 border border-gray-300 text-center">Action</div>
          </div>
          {oasisTilesInRange.map((tile) => (
            <div
              className="flex"
              key={tile.id}
            >
              <div className="flex-1 p-2 border border-gray-300 text-center" />
              <div className="flex-1 p-2 border border-gray-300 text-center" />
              <div className="flex-1 p-2 border border-gray-300 text-center" />
              <div className="flex-1 p-2 border border-gray-300 text-center" />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};
