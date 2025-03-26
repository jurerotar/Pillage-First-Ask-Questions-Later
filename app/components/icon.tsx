import { BorderIndicator, type BorderIndicatorProps } from 'app/(game)/(village-slug)/components/border-indicator';
import { ConditionalWrapper } from 'app/components/conditional-wrapper';
import clsx from 'clsx';
import type React from 'react';
import { lazy, Suspense } from 'react';
import type { IconBaseProps } from 'react-icons';
import { type IconType, typeToIconCssClass, typeToIconMap } from 'app/components/icons/icon-maps';

// Variants
const IconNegativeChangeVariant = lazy(async () => ({
  default: (await import('app/components/icons/variants/icon-negative-change-variant')).IconNegativeChangeVariant,
}));
const IconPositiveChangeVariant = lazy(async () => ({
  default: (await import('app/components/icons/variants/icon-positive-change-variant')).IconPositiveChangeVariant,
}));

type IconPlaceholderProps = React.HTMLAttributes<HTMLSpanElement>;

const IconPlaceholder: React.FC<IconPlaceholderProps> = ({ className }) => {
  return <span className={className} />;
};

export type IconProps = IconBaseProps &
  React.HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    variant?: 'positive-change' | 'negative-change';
    borderVariant?: BorderIndicatorProps['variant'];
    wrapperClassName?: string;
    asCss?: boolean;
  };

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
  const { type, variant, borderVariant, className, wrapperClassName, asCss = false, ...rest } = props;

  // @ts-ignore - TODO: Add missing icons
  const ComputedIcon = typeToIconMap[type] ?? typeToIconMap.missingIcon;

  const hasVariantIcon = !!variant;

  return (
    <ConditionalWrapper
      condition={!!borderVariant}
      wrapper={(children) => (
        <BorderIndicator
          className={wrapperClassName}
          variant={borderVariant}
          backgroundVariant="white"
        >
          {children}
        </BorderIndicator>
      )}
    >
      {asCss && <span className={typeToIconCssClass[type] ?? typeToIconCssClass.missingIcon} />}
      {!asCss && (
        <Suspense fallback={<IconPlaceholder className={className} />}>
          <span
            className={clsx(hasVariantIcon && 'relative', className)}
            {...rest}
          >
            <ComputedIcon />
            {hasVariantIcon && (
              <span className="absolute bottom-[-2px] right-[-6px] size-3 rounded-full shadow bg-white">
                {variant === 'positive-change' && <IconPositiveChangeVariant />}
                {variant === 'negative-change' && <IconNegativeChangeVariant />}
              </span>
            )}
          </span>
        </Suspense>
      )}
    </ConditionalWrapper>
  );
};
