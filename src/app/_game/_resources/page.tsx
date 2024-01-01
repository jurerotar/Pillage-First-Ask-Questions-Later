import React from 'react';
import { Head } from 'components/head';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { useGameNavigation } from 'hooks/game/routes/use-game-navigation';
import { ResourceField } from 'app/_game/_resources/components/resource-field';
import { ResourceFieldId } from 'interfaces/models/game/village';
import { Link } from 'react-router-dom';

export const ResourcesPage: React.FC = () => {
  const { currentVillage } = useCurrentVillage();
  const { villagePath } = useGameNavigation();

  return (
    <>
      <Head
        viewName="resources"
        tFunctionArgs={{
          currentVillageName: currentVillage.name,
        }}
      />
      <main className="">
        <div className="relative mx-auto flex aspect-[16/9] min-w-[320px] max-w-[1000px]">
          {[...Array(18)].map((_, resourceBuildingFieldId) => (
            <ResourceField
              // eslint-disable-next-line react/no-array-index-key
              key={resourceBuildingFieldId}
              resourceFieldId={String(resourceBuildingFieldId + 1) as ResourceFieldId}
            />
          ))}

          <Link
            to={villagePath}
            className="absolute left-[50%] top-[50%] flex size-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
          >
            Village
          </Link>
        </div>
      </main>
    </>
  );
};
