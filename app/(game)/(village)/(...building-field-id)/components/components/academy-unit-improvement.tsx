import { UnitImprovementCard } from 'app/(game)/(village)/(...building-field-id)/components/components/components/unit-improvement-card';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { units } from 'app/assets/units';

export const AcademyUnitImprovement = () => {
  const { tribe } = useTribe();

  const upgradableUnits = units.filter(({ tier }) => tier !== 'special');
  const upgradableUnitsByCurrentTribe = upgradableUnits.filter(({ tribe: unitTribe }) => unitTribe === tribe);

  return (
    <div className="flex flex-col gap-2">
      {upgradableUnitsByCurrentTribe.map(({ id }) => (
        <UnitImprovementCard
          unitId={id}
          key={id}
        />
      ))}
    </div>
  );
};
