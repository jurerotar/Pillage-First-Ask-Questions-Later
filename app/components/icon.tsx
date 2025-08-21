import clsx from 'clsx';
import type React from 'react';
import { lazy, Suspense } from 'react';
import type { IconBaseProps } from 'react-icons';
import { type IconType, typeToIconMap } from 'app/components/icons/icon-maps';
import { useTranslation } from 'react-i18next';

// Variants
const IconNegativeChangeVariant = lazy(async () => ({
  default: (
    await import('app/components/icons/variants/icon-negative-change-variant')
  ).IconNegativeChangeVariant,
}));
const IconPositiveChangeVariant = lazy(async () => ({
  default: (
    await import('app/components/icons/variants/icon-positive-change-variant')
  ).IconPositiveChangeVariant,
}));

type IconPlaceholderProps = React.HTMLAttributes<HTMLSpanElement>;

const IconPlaceholder: React.FC<IconPlaceholderProps> = ({ className }) => {
  return <span className={clsx(className, 'min-h-4 min-w-4')} />;
};

type IconProps = IconBaseProps &
  React.HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    variant?: 'positive-change' | 'negative-change';
    shouldShowTooltip?: boolean;
  };

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
  const { type, variant, className, shouldShowTooltip = true, ...rest } = props;

  const { t: assetsT } = useTranslation();

  const ComputedIcon = typeToIconMap[type] ?? typeToIconMap.missingIcon;

  const hasVariantIcon = !!variant;

  return (
    <Suspense fallback={<IconPlaceholder className={className} />}>
      <span
        className={clsx(hasVariantIcon && 'relative', className)}
        {...(shouldShowTooltip && {
          'data-tooltip-id': 'general-tooltip',
          'data-tooltip-content': assetsT(`EFFECTS.${type}`),
        })}
        {...rest}
      >
        <ComputedIcon />
        {hasVariantIcon && (
          <span className="absolute bottom-[-2px] right-[-6px] size-3 rounded-full shadow bg-background">
            {variant === 'positive-change' && <IconPositiveChangeVariant />}
            {variant === 'negative-change' && <IconNegativeChangeVariant />}
          </span>
        )}
      </span>
    </Suspense>
  );
};
