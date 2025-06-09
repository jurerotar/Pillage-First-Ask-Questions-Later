import { UnitTraining } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-training';

export const GreatBarracksTroopTraining = () => {
  return (
    <UnitTraining
      buildingId="BARRACKS"
      durationEffect="greatBarracksTrainingDuration"
      category="infantry"
    />
  );
};
