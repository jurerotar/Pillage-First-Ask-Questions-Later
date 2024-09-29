import { useCreateEvent } from 'app/[game]/hooks/use-create-event';
import { Button } from 'app/components/buttons/button';
import { GameEventType } from 'interfaces/models/events/game-event';

export const BarracksTroopTraining = () => {
  const { createBulkEvent: createBulkBarracksTrainingEvent } = useCreateEvent(GameEventType.TROOP_TRAINING);

  const onClick = () => {
    createBulkBarracksTrainingEvent({
      buildingId: 'BARRACKS',
      amount: 100,
      unitId: 'PHALANX',
      startsAt: Date.now() + 10000,
      duration: 1000,
      resourceCost: [0, 0, 0, 0],
    });
  };

  return <Button onClick={onClick}>Train 100 phalanxes</Button>;
};
