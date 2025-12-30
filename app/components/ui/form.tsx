import { Field } from '@base-ui/react';
import { clsx } from 'clsx';
import { type ComponentProps, createContext, use } from 'react';
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
  return (
    <FormFieldContext value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext>
  );
};

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

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

export const FormItem = ({ className, ...props }: ComponentProps<'div'>) => {
  const { name } = use(FormFieldContext);

  return (
    <FormItemContext value={{ id: name }}>
      <Field.Root
        data-slot="form-item"
        className={clsx('grid gap-2', className)}
        {...props}
      />
    </FormItemContext>
  );
};

export const FormLabel = ({
  className,
  ...props
}: ComponentProps<typeof Field.Label>) => {
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

export const FormControl = ({
  children,
  ...props
}: ComponentProps<typeof Field.Control>) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Field.Control
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      render={children as React.ReactElement}
      {...props}
    />
  );
};

export const FormDescription = ({
  className,
  ...props
}: ComponentProps<typeof Field.Description>) => {
  const { formDescriptionId } = useFormField();

  return (
    <Field.Description
      data-slot="form-description"
      id={formDescriptionId}
      className={clsx('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
};

export const FormMessage = ({
  className,
  ...props
}: ComponentProps<typeof Field.Error>) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : props.children;

  if (!body) {
    return null;
  }

  return (
    <Field.Error
      data-slot="form-message"
      id={formMessageId}
      className={clsx('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </Field.Error>
  );
};
