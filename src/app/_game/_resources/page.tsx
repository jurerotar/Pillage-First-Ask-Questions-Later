import React from 'react';
import { Resource } from 'interfaces/models/game/resource';
import { Head } from 'components/head';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import clsx from 'clsx';
import { useGameNavigation } from 'hooks/game/routes/use-game-navigation';
import { ResourceField } from 'app/_game/_resources/components/resource-field';
import { ResourceFieldId } from 'interfaces/models/game/village';

// TODO: This will eventually get replaced by graphics
const backgroundColors: { [key in Resource]: string } = {
  wood: 'bg-resources-wood',
  iron: 'bg-resources-iron',
  clay: 'bg-resources-clay',
  wheat: 'bg-resources-wheat',
};

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
      <main className="">
        <div className="relative mx-auto flex aspect-[5/4] min-w-[320px] max-w-[1000px] bg-blue-500">
          {[...Array(18)].map((_, resourceBuildingFieldId) => (
            <ResourceField resourceFieldId={String(resourceBuildingFieldId + 1) as ResourceFieldId} />
          ))}
          <svg
            className="villageCenter"
            viewBox="0 0 473 304"
          >
            <path
              d="M223 109c-14.5 4.4-17.7 5.5-18.8 6.3-1.9 1.5-7.4 4.6-10.2 5.8-1.4.6-3.8 1.7-5.5 2.4-1.6.7-5 1.9-7.4 2.7-5.7 1.7-6.9 3.5-4.8 7.7 1.2 2.3 1.3 3.9.6 6.3-1.2 4.2-.3 6.7 2.6 7.4 2 .5 2.5 1.4 3.1 6 .7 5.6 3.4 10.4 6 10.4.8 0 2.2.9 3.1 2 1 1.1 2.9 2 4.3 2s4.8.9 7.6 1.9c3.1 1.2 10.2 2.4 18 3.1 7.1.6 16 1.5 19.7 2 8.1 1 10 .3 15.6-6.2 4-4.4 8-6.5 16.5-8.4 3.3-.8 4.1-1.4 4.8-4.1.5-1.8 1.7-3.4 2.8-3.8 2.4-.8 2.5-1.8.5-4.9-1.2-1.8-1.3-2.9-.5-5.2.8-1.9.8-3.5.1-4.9-.5-1.1-1.2-4.5-1.6-7.7-.6-5.4-.8-5.7-4.4-7.2-3.5-1.3-7.4-5-8.3-7.7-.2-.6-2.6-1.2-5.3-1.4-2.8-.1-5.7-.5-6.5-.8-1.6-.7-20.1-3.6-26-4.1-1.9-.2-4.6 0-6 .4z"
            />
          </svg>
        </div>
        {/* <div className="hexagon__grid scale-[.60] xs:scale-75 sm:scale-100"> */}
        {/*   {chunkedFieldsIds.map((resourceFieldsIdArray: ResourceBuildingField[]) => ( */}
        {/*     <div */}
        {/*       key={resourceFieldsIdArray[0]} */}
        {/*       className="relative flex justify-center" */}
        {/*     > */}
        {/*       {resourceFieldsIdArray.map((resourceFieldId: ResourceBuildingField) => ( */}
        {/*         <React.Fragment key={resourceFieldId}> */}
        {/*           {resourceFieldId === 'village' ? ( */}
        {/*             <> */}
        {/*               /!* Display a transparent cell to reserve the space for village link *!/ */}
        {/*               <div className="hexagon__cell" /> */}
        {/*               <Link */}
        {/*                 className="absolute left-1/2 top-1/2 h-[100px] w-[100px] -translate-x-1/2 -translate-y-[36%] rounded-full bg-red-500" */}
        {/*                 to={villagePath} */}
        {/*               /> */}
        {/*             </> */}
        {/*           ) : ( */}
        {/*             <div className="align-center hexagon__cell flex justify-center bg-blue-300" /> */}
        {/*             // <BuildingField */}
        {/*             //   buildingFieldId={resourceFieldId} */}
        {/*             //   buildingId={resourceToBuildingMap[resourceFields[resourceFieldId]!.type]} */}
        {/*             //   buildingLevel={resourceFields[resourceFieldId]!.level} */}
        {/*             //   className={clsx(backgroundColors[resourceFields[resourceFieldId]!.type], 'align-center hexagon__cell flex justify-center')} */}
        {/*             // /> */}
        {/*           )} */}
        {/*         </React.Fragment> */}
        {/*       ))} */}
        {/*     </div> */}
        {/*   ))} */}
        {/* </div> */}
      </main>
    </>
  );
};
