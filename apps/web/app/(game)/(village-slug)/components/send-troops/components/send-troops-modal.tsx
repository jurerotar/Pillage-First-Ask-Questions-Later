import type { ReactNode } from 'react';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema';
import { TroopSelectionForm } from './troop-selection-form';

type SendTroopsModalContentProps<T extends BaseTroopFormValues> = {
  onClose: () => void;
  onSubmit: SubmitHandler<T>;
  title: string;
  form: UseFormReturn<T, unknown, T>;
  disabledUnitTiers?: UnitSelection['tier'][];
  maxUnits?: { unitId: UnitSelection['unitId']; amount: number }[];
  targetSelector?: 'coordinates' | 'playerVillage';
  isTargetSelectorDisabled?: boolean;
  extraContent?: ReactNode;
};

export const SendTroopsModalContent = <T extends BaseTroopFormValues>({
  onClose,
  onSubmit,
  title,
  form,
  disabledUnitTiers,
  maxUnits,
  targetSelector = 'coordinates',
  isTargetSelectorDisabled = false,
  extraContent,
}: SendTroopsModalContentProps<T>) => {
  return (
    <TroopSelectionForm
      form={form}
      onSubmit={onSubmit}
      title={title}
      disabledUnitTiers={disabledUnitTiers}
      maxUnits={maxUnits}
      targetSelector={targetSelector}
      isTargetSelectorDisabled={isTargetSelectorDisabled}
      extraTargetContent={extraContent}
      onCancel={onClose}
    />
  );
};
