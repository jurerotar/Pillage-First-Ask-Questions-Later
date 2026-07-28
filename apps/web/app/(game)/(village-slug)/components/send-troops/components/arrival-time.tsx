import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { Text } from 'app/components/text';
import { useIntl } from 'app/hooks/use-intl';
import { formatFutureTimestamp } from 'app/utils/time';

type ArrivalTimeProps = {
  travelDuration: number;
};

export const ArrivalTime = ({ travelDuration }: ArrivalTimeProps) => {
  const intl = useIntl();
  const now = useCountdown();
  const arrivalTimestamp = now + travelDuration;
  const { formattedDate: formattedArrivalTime } = formatFutureTimestamp(
    arrivalTimestamp,
    now,
    intl,
  );

  return <Text className="font-medium">{formattedArrivalTime}</Text>;
};
