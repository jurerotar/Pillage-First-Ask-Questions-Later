import React from 'react';
import { Resource } from 'interfaces/models/game/resource';
import { Link, useNavigate } from 'react-router-dom';
import { ResourceFieldId } from 'interfaces/models/game/village';
import { Head } from 'components/head';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import clsx from 'clsx';
import { useGameNavigation } from 'hooks/game/routes/use-game-navigation';

// TODO: This will eventually get replaced by graphics
const backgroundColors: { [key in Resource]: string } = {
  wood: 'bg-resources-wood',
  iron: 'bg-resources-iron',
  clay: 'bg-resources-clay',
  wheat: 'bg-resources-wheat',
};

type ResourceBuildingField = ResourceFieldId | 'village';

// Chunk field ids to render hexagons more easily
const chunkedFieldsIds: ResourceBuildingField[][] = [
  ['1', '2', '3'],
  ['4', '5', '6', '7'],
  ['8', '9', 'village', '10', '11'],
  ['12', '13', '14', '15'],
  ['16', '17', '18'],
];

export const ResourcesPage: React.FC = () => {
  const { currentVillage } = useCurrentVillage();
  const { villagePath } = useGameNavigation();

  return (
    <>
      <Head
        viewName="resources"
        tFunctionArgs={{
          currentVillageName: currentVillage.name
        }}
      />
      <main className="mt-16 md:mt-20">
        <div className="hexagon__grid scale-[.60] xs:scale-75 sm:scale-100">
          {chunkedFieldsIds.map((resourceFieldsIdArray: ResourceBuildingField[]) => (
            <div
              key={resourceFieldsIdArray[0]}
              className="relative flex justify-center"
            >
              {resourceFieldsIdArray.map((resourceFieldId: ResourceBuildingField) => (
                <React.Fragment key={resourceFieldId}>
                  {resourceFieldId === 'village' ? (
                    <>
                      {/* Display a transparent cell to reserve the space for village link */}
                      <div className="hexagon__cell" />
                      <Link
                        className="absolute left-1/2 top-1/2 h-[100px] w-[100px] -translate-x-1/2 -translate-y-[36%] rounded-full bg-red-500"
                        to={villagePath}
                      />
                    </>
                  ) : (
                    <div className="align-center hexagon__cell flex justify-center bg-blue-300" />
                    // <BuildingField
                    //   buildingFieldId={resourceFieldId}
                    //   buildingId={resourceToBuildingMap[resourceFields[resourceFieldId]!.type]}
                    //   buildingLevel={resourceFields[resourceFieldId]!.level}
                    //   className={clsx(backgroundColors[resourceFields[resourceFieldId]!.type], 'align-center hexagon__cell flex justify-center')}
                    // />
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
