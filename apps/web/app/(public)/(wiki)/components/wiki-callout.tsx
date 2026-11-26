import { clsx } from 'clsx';
import { type ReactNode, useId } from 'react';
import { LuInfo, LuLightbulb, LuTriangleAlert } from 'react-icons/lu';

const variants = {
  note: {
    label: 'Note',
    Icon: LuInfo,
    style: 'border-blue-500 bg-blue-100/60 dark:bg-blue-900/30',
    accent: 'text-blue-800 dark:text-blue-300',
  },
  tip: {
    label: 'Tip',
    Icon: LuLightbulb,
    style: 'border-green-500 bg-green-100/60 dark:bg-green-900/30',
    accent: 'text-green-800 dark:text-green-300',
  },
  warning: {
    label: 'Warning',
    Icon: LuTriangleAlert,
    style: 'border-yellow-500 bg-yellow-100/60 dark:bg-yellow-900/30',
    accent: 'text-yellow-800 dark:text-yellow-300',
  },
};

type WikiCalloutProps = {
  kind: keyof typeof variants;
  title?: string;
  children: ReactNode;
};

export const WikiCallout = ({ kind, title, children }: WikiCalloutProps) => {
  const labelId = useId();
  const { label, Icon, style, accent } = variants[kind];

  return (
    <aside
      aria-labelledby={labelId}
      className={clsx('rounded-md border-s-4 px-4 py-3', style)}
    >
      <div
        className="mb-1 flex items-start gap-2 text-sm font-semibold leading-6"
        id={labelId}
      >
        <Icon
          aria-hidden="true"
          className={clsx('mt-1 size-4 shrink-0', accent)}
        />
        <span>
          <span className={accent}>{label}</span>
          {title && <> · {title}</>}
        </span>
      </div>
      <div className="text-foreground leading-6">{children}</div>
    </aside>
  );
};
