import type { FieldValues, SubmitHandler } from 'react-hook-form';
import type { z } from 'zod';
import {
  type SendTroopsEventType,
  useVillageTroops,
} from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { useDialog } from 'app/hooks/use-dialog';
import type { BaseTroopFormValues } from '../utils/schema';
import { type TroopFormOptions, useTroopForm } from './use-troop-form';

type MovementValidationType =
  | 'reinforcements'
  | 'relocation'
  | 'findNewVillage'
  | 'attack'
  | 'raid'
  | 'oasisOccupation';

type UseTroopMovementFormOptions<T extends FieldValues & BaseTroopFormValues> =
  {
    schema: z.ZodType<T>;
    formOptions: TroopFormOptions<T>;
    getMovementValidationType: (data: T) => MovementValidationType;
    getEventType: (data: T) => SendTroopsEventType;
    onSuccess?: () => void;
  };

export const useTroopMovementForm = <
  T extends FieldValues & BaseTroopFormValues,
>({
  schema,
  formOptions,
  getMovementValidationType,
  getEventType,
  onSuccess,
}: UseTroopMovementFormOptions<T>) => {
  const { sendTroops } = useVillageTroops();
  const { form, getBaseEventArgs, resetForm, validateTroopMovementAsync } =
    useTroopForm(schema, formOptions);

  const {
    isOpen: isConfirmationStepOpen,
    openModal: openConfirmationStep,
    closeModal: closeConfirmationStep,
    modalArgs: formData,
  } = useDialog<T>();

  const onFormSubmit: SubmitHandler<T> = async (data) => {
    const isValid = await validateTroopMovementAsync(
      data,
      getMovementValidationType(data),
    );

    if (isValid) {
      openConfirmationStep(data);
    }
  };

  const onConfirm = () => {
    if (!formData.current) {
      return;
    }

    sendTroops(
      {
        type: getEventType(formData.current),
        ...getBaseEventArgs(formData.current),
      },
      {
        onSuccess: () => {
          resetForm();
          closeConfirmationStep();
          onSuccess?.();
        },
      },
    );
  };

  return {
    form,
    formData,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
    closeConfirmationStep,
  };
};
