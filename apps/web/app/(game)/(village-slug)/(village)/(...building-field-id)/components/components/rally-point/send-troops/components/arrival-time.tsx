import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';
import { Text } from 'app/components/text';
import { formatFutureTimestamp } from 'app/utils/time';

type ArrivalTimeProps = {
  travelDuration: number;
};

export const ArrivalTime = ({ travelDuration }: ArrivalTimeProps) => {
  const { i18n } = useTranslation();
  const [_, setTick] = useState(0);

  useEffect(() => {
    return subscribeToTimer(() => {
      setTick((tick) => tick + 1);
    });
  }, []);

  const now = getCurrentTime();
  const arrivalTimestamp = now + travelDuration;
  const { formattedDate: formattedArrivalTime } = formatFutureTimestamp(
    arrivalTimestamp,
    i18n.language,
  );

  return <Text className="font-medium">{formattedArrivalTime}</Text>;
};
