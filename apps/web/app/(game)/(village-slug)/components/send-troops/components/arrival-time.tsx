import { useTranslation } from 'react-i18next';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { Text } from 'app/components/text';
import { formatFutureTimestamp } from 'app/utils/time';

type ArrivalTimeProps = {
  travelDuration: number;
};

export const ArrivalTime = ({ travelDuration }: ArrivalTimeProps) => {
  const { i18n } = useTranslation();
  const now = useCountdown();
  const arrivalTimestamp = now + travelDuration;
  const { formattedDate: formattedArrivalTime } = formatFutureTimestamp(
    arrivalTimestamp,
    i18n.language,
    now,
  );

  return <Text className="font-medium">{formattedArrivalTime}</Text>;
};
