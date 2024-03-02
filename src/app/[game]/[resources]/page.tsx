import React from 'react';
import { Head } from 'app/components/head';
import { useGameNavigation } from 'app/[game]/hooks/routes/use-game-navigation';
import { Link } from 'react-router-dom';
import { BuildingFieldId, ResourceFieldId } from 'interfaces/models/game/village';
import { Tooltip } from 'app/components/tooltip';
import { BuildingFieldTooltip } from 'app/[game]/components/building-field-tooltip';
import { ResourceField } from 'app/[game]/[resources]/components/resource-field';
import { useDialog } from 'app/hooks/use-dialog';
import { Modal } from 'app/components/modal';
import { BuildingUpgradeModal } from 'app/[game]/components/building-upgrade-modal';

export const ResourcesPage: React.FC = () => {
  const { villagePath } = useGameNavigation();
  const {
    modalArgs,
    isOpen: isBuildingUpgradeModalOpen,
    closeModal: closeBuildingUpgradeModal,
    openModal: openBuildingUpgradeModal,
  } = useDialog<BuildingFieldId>();

  return (
    <>
      <Head viewName="resources" />
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        render={({ activeAnchor }) => {
          const buildingFieldIdAttribute = activeAnchor?.getAttribute('data-building-field-id');

          if (!buildingFieldIdAttribute) {
            return null;
          }

          const buildingFieldId = Number(buildingFieldIdAttribute) as BuildingFieldId;

          return <BuildingFieldTooltip buildingFieldId={buildingFieldId} />
        }}
      />
      <Modal
        isOpen={isBuildingUpgradeModalOpen}
        closeHandler={closeBuildingUpgradeModal}
      >
        <BuildingUpgradeModal buildingFieldId={modalArgs as BuildingFieldId} />
      </Modal>
      <main className="relative mx-auto flex aspect-[16/9] min-w-[320px] max-w-[1000px]">
        {[...Array(18)].map((_, resourceBuildingFieldId) => (
          <ResourceField
            onClick={() => openBuildingUpgradeModal((resourceBuildingFieldId + 1) as ResourceFieldId)}
            // eslint-disable-next-line react/no-array-index-key
            key={resourceBuildingFieldId}
            resourceFieldId={(resourceBuildingFieldId + 1) as ResourceFieldId}
          />
        ))}

        <Link
          to={villagePath}
          className="absolute left-[50%] top-[50%] flex size-[14.4%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
        >
          Village
        </Link>
      </main>
    </>
  );
};
