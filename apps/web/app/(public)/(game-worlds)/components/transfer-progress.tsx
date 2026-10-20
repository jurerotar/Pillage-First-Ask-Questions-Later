import { clsx } from 'clsx';
import { Progress } from 'app/components/ui/progress';
import type { TransferProgress } from 'app/utils/remote-api';

export const GameWorldTransferProgress = ({
  label,
  progress,
  showProgressText = true,
}: {
  label: string;
  progress: TransferProgress | null;
  showProgressText?: boolean;
}) => {
  const percentage = progress?.total
    ? Math.min(100, Math.floor((progress.loaded / progress.total) * 100))
    : null;

  return (
    <div className="grid min-w-0 gap-2">
      <p
        role="status"
        className="flex h-5 min-w-0 items-center gap-2 text-sm text-muted-foreground"
      >
        <span
          className="min-w-0 flex-1 truncate"
          title={label}
        >
          {label}
        </span>
        <span className="w-24 shrink-0 text-right tabular-nums">
          {clsx(
            showProgressText && percentage !== null && `${percentage}%`,
            showProgressText &&
              progress &&
              percentage === null &&
              `${(progress.loaded / 1024 / 1024).toFixed(1)} MiB`,
          )}
        </span>
      </p>
      <Progress
        value={percentage}
        aria-label={label}
      />
    </div>
  );
};
