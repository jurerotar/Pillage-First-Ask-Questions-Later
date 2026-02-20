import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconBaseProps } from 'react-icons';
import { type IconType, icons } from 'app/components/icons/icons';

type IconProps = IconBaseProps &
  HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    subIcon?: IconType;
    shouldShowTooltip?: boolean;
  };

export const Icon = (props: IconProps) => {
  const { type, subIcon, className, shouldShowTooltip = true, ...rest } = props;

  const { t } = useTranslation();

  const ComputedIcon = icons[type] ?? icons.missingIcon;

  const hasSubIcon = !!subIcon;

  return (
    <>
      {hasSubIcon && (
        <span className={clsx(hasSubIcon && 'relative', className)}>
          <ComputedIcon
            {...rest}
            className={className}
            {...(shouldShowTooltip && {
              'data-tooltip-id': 'general-tooltip',
              'data-tooltip-content': t(`ICONS.${type}`),
            })}
          />
          {hasSubIcon && (
            <span className="absolute bottom-[-2px] right-[-6px] size-3 rounded-full shadow bg-background">
              <Icon
                shouldShowTooltip={false}
                type={subIcon}
              />
            </span>
          )}
        </span>
      )}
      {!hasSubIcon && (
        <ComputedIcon
          {...rest}
          className={className}
          {...(shouldShowTooltip && {
            'data-tooltip-id': 'general-tooltip',
            'data-tooltip-content': t(`ICONS.${type}`),
          })}
        />
      )}
    </>
  );
};
