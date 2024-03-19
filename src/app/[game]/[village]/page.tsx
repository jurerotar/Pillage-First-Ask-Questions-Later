import React from 'react';
import { Head } from 'app/components/head';
import { BuildingField } from 'app/[game]/[village]/components/building-field';
import { VillageFieldId, BuildingField as BuildingFieldType } from 'interfaces/models/game/village';
import { Tooltip } from 'app/components/tooltip';
import { BuildingFieldTooltip } from 'app/[game]/components/building-field-tooltip';
import { Modal } from 'app/components/modal';
import { BuildingUpgradeModal } from 'app/[game]/components/building-upgrade-modal';
import { useDialog } from 'app/hooks/use-dialog';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import { BuildingConstructionModal } from 'app/[game]/components/building-construction-modal';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useTranslation } from 'react-i18next';

export const VillagePage: React.FC = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  const {
    modalArgs,
    isOpen: isBuildingUpgradeModalOpen,
    closeModal: closeBuildingUpgradeModal,
    openModal: openBuildingUpgradeModal,
  } = useDialog<BuildingFieldType['id']>();

  const [title, hasBuilding] = (() => {
    const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, modalArgs as BuildingFieldType['id']);
    if (buildingField !== null) {
      const { buildingId, level } = buildingField;
      const buildingName = t(`BUILDINGS.${buildingId}.NAME`);
      return [t('APP.GAME.VILLAGE.BUILDING_UPGRADE_MODAL.TITLE', { level, buildingName }), true];
    }

    return [t('APP.GAME.VILLAGE.BUILDING_CONSTRUCTION_MODAL.TITLE'), false];
  })();

  return (
    <>
      <Head viewName="village" />
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

          const buildingFieldId = Number(buildingFieldIdAttribute) as BuildingFieldType['id'];

          return <BuildingFieldTooltip buildingFieldId={buildingFieldId} />;
        }}
      />
      <Modal
        isOpen={isBuildingUpgradeModalOpen}
        closeHandler={closeBuildingUpgradeModal}
        title={title}
        hasTitle
      >
        {hasBuilding ? (
          <BuildingUpgradeModal
            buildingFieldId={modalArgs as BuildingFieldType['id']}
            modalCloseHandler={closeBuildingUpgradeModal}
          />
        ) : (
          <BuildingConstructionModal
            buildingFieldId={modalArgs as BuildingFieldType['id']}
            modalCloseHandler={closeBuildingUpgradeModal}
          />
        )}
      </Modal>
      <main className="relative mx-auto flex aspect-[16/9] min-w-[320px] max-w-[1000px]">
        {[...Array(22)].map((_, buildingFieldId) => (
          <BuildingField
            onClick={() => openBuildingUpgradeModal((buildingFieldId + 19) as VillageFieldId)}
            // eslint-disable-next-line react/no-array-index-key
            key={buildingFieldId}
            buildingFieldId={(buildingFieldId + 19) as VillageFieldId}
          />
        ))}
      </main>
    </>
  );
};
