import clsx from 'clsx';
import type React from 'react';
import { Suspense } from 'react';
import type { IconBaseProps } from 'react-icons';
import { type IconType, icons } from 'app/components/icons/icons';
import { useTranslation } from 'react-i18next';

type IconPlaceholderProps = React.HTMLAttributes<HTMLSpanElement>;

const IconPlaceholder: React.FC<IconPlaceholderProps> = ({ className }) => {
  return <span className={clsx(className, 'min-h-4 min-w-4')} />;
};

type IconProps = IconBaseProps &
  React.HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    subIcon?: IconType;
    shouldShowTooltip?: boolean;
  };

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
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
            <Icon type={subIcon} />
          </span>
        )}
      </span>
    </Suspense>
  );
};
