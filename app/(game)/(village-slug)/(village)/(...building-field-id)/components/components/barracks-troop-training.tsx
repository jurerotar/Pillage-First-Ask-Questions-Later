import { UnitTraining } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/unit-training';

export const BarracksTroopTraining = () => {
  return (
    <UnitTraining
      buildingId="BARRACKS"
      durationEffect="barracksTrainingDuration"
      category="infantry"
    />
  );
};
