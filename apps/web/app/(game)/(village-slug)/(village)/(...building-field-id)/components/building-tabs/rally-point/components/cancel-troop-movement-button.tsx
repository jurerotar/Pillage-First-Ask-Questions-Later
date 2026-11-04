import { useTranslation } from 'react-i18next';
import { LuX } from 'react-icons/lu';
import type { TroopMovementItemDto } from '@pillage-first/types/dtos/troop-movement';
import { useCancelTroopMovement } from 'app/(game)/(village-slug)/hooks/use-cancel-troop-movement';
import { Button } from 'app/components/ui/button';
import { useTimeWindow } from 'app/hooks/use-time-window';

type CancelTroopMovementButtonProps = {
  movement: TroopMovementItemDto;
};

export const CancelTroopMovementButton = ({
  movement,
}: CancelTroopMovementButtonProps) => {
  const { t } = useTranslation();
  const canCancel = useTimeWindow(
    movement.startsAt,
    Math.min(movement.startsAt + 60_000, movement.resolvesAt),
  );
  const { mutate: cancelTroopMovement, isPending: isCancelling } =
    useCancelTroopMovement();

  if (!canCancel) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-6 shrink-0"
      aria-label={t('Cancel troop movement')}
      title={t('Cancel troop movement')}
      disabled={isCancelling}
      onClick={() => cancelTroopMovement(movement.id)}
    >
      <LuX className="size-4" />
    </Button>
  );
};
