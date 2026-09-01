import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { BaseTroopFormValues } from '../utils/schema';
import {
  TroopSelectionForm,
  type TroopSelectionFormFooterOptions,
  type TroopSelectionFormTargetOptions,
  type TroopSelectionFormUnitsOptions,
} from './troop-selection-form';

type SendTroopsModalContentProps<T extends BaseTroopFormValues> = {
  footer?: TroopSelectionFormFooterOptions;
  form: UseFormReturn<T, unknown, T>;
  onClose: () => void;
  onSubmit: SubmitHandler<T>;
  target?: TroopSelectionFormTargetOptions;
  title: string;
  units?: TroopSelectionFormUnitsOptions;
};

export const SendTroopsModalContent = <T extends BaseTroopFormValues>({
  onClose,
  onSubmit,
  title,
  form,
  units,
  target,
  footer,
}: SendTroopsModalContentProps<T>) => {
  return (
    <TroopSelectionForm
      form={form}
      onSubmit={onSubmit}
      title={title}
      units={units}
      target={target}
      footer={{
        ...footer,
        onCancel: footer?.onCancel ?? onClose,
      }}
    />
  );
};
