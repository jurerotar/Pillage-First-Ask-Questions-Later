import React from 'react';
import { Resource } from 'interfaces/models/game/resource';
import { useNavigate } from 'react-router-dom';
import { ResourceFieldId } from 'interfaces/models/game/village';
import { useContextSelector } from 'use-context-selector';
import { VillageContext } from 'providers/game/village-context';
import BuildingField from 'components/game/building-field';
import resourceToBuildingMap from 'utils/maps/resource-to-building-map';
import AppHelmet from 'components/common/head/app-helmet';

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

const ResourcesView: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const resourceFields = useContextSelector(VillageContext, (v) => v.resourceFields);

  return (
    <>
      <main className="mt-16 md:mt-20">
        <div className="hexagon__grid scale-[.60] xs:scale-75 sm:scale-100">
          {chunkedFieldsIds.map((resourceFieldsIdArray: (ResourceFieldId | 'x')[]) => (
            <div
              key={resourceFieldsIdArray[0]}
              className="flex justify-center relative"
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
                        className="absolute -translate-y-[36%] top-1/2 left-1/2 -translate-x-1/2 rounded-full w-[100px] h-[100px] bg-red-500"
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
                      className={`flex justify-center align-center hexagon__cell ${backgroundColors[resourceFields[resourceFieldId]!.type]}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default ResourcesView;
