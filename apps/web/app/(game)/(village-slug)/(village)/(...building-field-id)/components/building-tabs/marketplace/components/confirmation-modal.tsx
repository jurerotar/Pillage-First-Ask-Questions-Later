import { useTranslation } from 'react-i18next';
import type { Resources as ResourcesType } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Separator } from 'app/components/ui/separator';
import { formatTime } from 'app/utils/time';
import type { VillageOption } from '../utils/villages';
import { VillageLabel } from './village-label';

type ResourceTransferConfirmationContentProps = {
  onBack: () => void;
  onConfirm: () => void;
  targetVillage: VillageOption | undefined;
  resources: ResourcesType;
  duration: number;
  merchantAmount: number;
  isPending: boolean;
};

export const ResourceTransferConfirmationContent = ({
  onBack,
  onConfirm,
  targetVillage,
  resources,
  duration,
  merchantAmount,
  isPending,
}: ResourceTransferConfirmationContentProps) => {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Confirm resource transfer')}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Resources
            resources={[
              resources.wood,
              resources.clay,
              resources.iron,
              resources.wheat,
            ]}
          />
        </div>

        <Separator orientation="horizontal" />

        <div className="space-y-2">
          <div className="flex justify-between gap-4">
            <Text className="text-muted-foreground">{t('Destination')}:</Text>
            <Text className="text-right font-medium">
              {targetVillage ? <VillageLabel village={targetVillage} /> : '-'}
            </Text>
          </div>
          <div className="flex justify-between gap-4">
            <Text className="text-muted-foreground">{t('Duration')}:</Text>
            <Text className="font-medium">{formatTime(duration)}</Text>
          </div>
          <div className="flex justify-between gap-4">
            <Text className="text-muted-foreground">
              {t('Merchants occupied')}:
            </Text>
            <Text className="font-medium">{formatNumber(merchantAmount)}</Text>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
        >
          {t('Back')}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
        >
          {t('Confirm')}
        </Button>
      </DialogFooter>
    </>
  );
};
