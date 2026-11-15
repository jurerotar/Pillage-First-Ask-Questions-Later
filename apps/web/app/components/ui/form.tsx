import { useRender } from '@base-ui/react/use-render';
import { clsx } from 'clsx';
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  use,
  useMemo,
} from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import { Label } from 'app/components/ui/label';

export const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const value = useMemo(() => {
    return {
      name: props.name,
    };
  }, [props.name]);

  return (
    <FormFieldContext value={value}>
      <Controller {...props} />
    </FormFieldContext>
  );
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const useFormField = () => {
  const fieldContext = use(FormFieldContext);
  const itemContext = use(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

export const FormItem = ({ className, ...props }: ComponentProps<'div'>) => {
  const { name } = use(FormFieldContext);

  const value = useMemo(() => {
    return {
      id: name,
    };
  }, [name]);

  return (
    <FormItemContext value={value}>
      <div
        data-slot="form-item"
        className={className}
        {...props}
      />
    </FormItemContext>
  );
};

export const FormLabel = ({
  className,
  ...props
}: ComponentProps<typeof Label>) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={clsx('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
};

export const FormControl = (
  props: ComponentProps<'div'> & { children: ReactElement },
) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <FormControlSlot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  );
};

export const FormDescription = ({
  className,
  ...props
}: ComponentProps<'p'>) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={clsx('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
};

export const FormMessage = ({ className, ...props }: ComponentProps<'p'>) => {
  const { error, formMessageId } = useFormField();
  const body = error ? (error?.message ?? '') : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={clsx('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  );
};

function FormControlSlot({
  children,
  ...props
}: ComponentProps<'div'> & { children: ReactElement }) {
  return useRender({ render: children, props });
}
