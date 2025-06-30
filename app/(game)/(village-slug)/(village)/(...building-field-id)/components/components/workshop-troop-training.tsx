import { UnitTraining } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-training';

export const WorkshopTroopTraining = () => {
  return (
    <UnitTraining
      buildingId="WORKSHOP"
      durationEffect="workshopTrainingDuration"
      category="siege"
    />
  );
};
