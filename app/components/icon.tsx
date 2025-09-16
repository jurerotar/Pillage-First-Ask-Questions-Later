import { clsx } from 'clsx';
import { type HTMLAttributes, Suspense } from 'react';
import type { IconBaseProps } from 'react-icons';
import { type IconType, icons } from 'app/components/icons/icons';
import { useTranslation } from 'react-i18next';

const IconPlaceholder = ({ className }: HTMLAttributes<HTMLSpanElement>) => {
  return <span className={clsx(className, 'min-h-4 min-w-4')} />;
};

type IconProps = IconBaseProps &
  HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    subIcon?: IconType;
    shouldShowTooltip?: boolean;
  };

// TODO: Replace library icons by custom icons
export const Icon = (props: IconProps) => {
  const { type, subIcon, className, shouldShowTooltip = true, ...rest } = props;

  const { t: assetsT } = useTranslation();

  const ComputedIcon = icons[type] ?? icons.missingIcon;

  const hasSubIcon = !!subIcon;

  return (
    <Suspense fallback={<IconPlaceholder className={className} />}>
      <span
        className={clsx(hasSubIcon && 'relative', className)}
        {...(shouldShowTooltip && {
          'data-tooltip-id': 'general-tooltip',
          'data-tooltip-content': assetsT(`ICONS.${type}`),
        })}
        {...rest}
      >
        <ComputedIcon />
        {hasSubIcon && (
          <span className="absolute bottom-[-2px] right-[-6px] size-3 rounded-full shadow bg-background">
            <Icon
              shouldShowTooltip={false}
              type={subIcon}
            />
          </span>
        )}
      </span>
    </Suspense>
  );
};
