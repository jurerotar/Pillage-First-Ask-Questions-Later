import React from 'react';
import { Resource } from 'interfaces/models/game/resource';
import { useNavigate } from 'react-router-dom';
import { ResourceFieldId } from 'interfaces/models/game/village';
import { useContextSelector } from 'use-context-selector';
import { VillageContext } from 'providers/game/village-context';
import { BuildingField } from 'components/game/building-field';
import { resourceToBuildingMap } from 'maps/resource-to-building-map';
import clsx from 'clsx';

// TODO: This will eventually get replaced by graphics
const backgroundColors: { [key in Resource]: string } = {
  wood: 'bg-resources-wood',
  iron: 'bg-resources-iron',
  clay: 'bg-resources-clay',
  wheat: 'bg-resources-wheat'
};

// Chunk field ids to render hexagons more easily, x represents village icon
const chunkedFieldsIds: (ResourceFieldId | 'x')[][] = [
  ['1', '2', '3'],
  ['4', '5', '6', '7'],
  ['8', '9', 'x', '10', '11'],
  ['12', '13', '14', '15'],
  ['16', '17', '18']
];

export const ResourcesView: React.FC = () => {
  const navigate = useNavigate();
  const resourceFields = useContextSelector(VillageContext, (v) => v.resourceFields);

  return (
    <main className="mt-16 md:mt-20">
      <div className="hexagon__grid scale-[.60] xs:scale-75 sm:scale-100">
        {chunkedFieldsIds.map((resourceFieldsIdArray: (ResourceFieldId | 'x')[]) => (
          <div
            key={resourceFieldsIdArray[0]}
            className="relative flex justify-center"
          >
            {resourceFieldsIdArray.map((resourceFieldId: ResourceFieldId | 'x') => (
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <React.Fragment key={resourceFieldId}>
                {resourceFieldId === 'x' ? (
                  <>
                    {/* Display a transparent cell to reserve the space for village link */}
                    <div className="hexagon__cell" />
                    <button
                      type="button"
                      className="absolute top-1/2 left-1/2 h-[100px] w-[100px] -translate-y-[36%] -translate-x-1/2 rounded-full bg-red-500"
                      onClick={() => navigate('/village')}
                    >
                      Village
                    </button>
                  </>
                ) : (
                  <BuildingField
                    buildingFieldId={resourceFieldId}
                    buildingId={resourceToBuildingMap[resourceFields[resourceFieldId]!.type]}
                    buildingLevel={resourceFields[resourceFieldId]!.level}
                    className={clsx(backgroundColors[resourceFields[resourceFieldId]!.type], 'align-center hexagon__cell flex justify-center')}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
};
