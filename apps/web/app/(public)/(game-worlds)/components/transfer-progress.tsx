import { clsx } from 'clsx';
import { Progress } from 'app/components/ui/progress';
import type { TransferProgress } from 'app/utils/remote-api';

export const GameWorldTransferProgress = ({
  label,
  progress,
}: {
  label: string;
  progress: TransferProgress | null;
}) => {
  const percentage = progress?.total
    ? Math.min(100, Math.floor((progress.loaded / progress.total) * 100))
    : null;

  return (
    <div className="grid gap-2">
      <p
        role="status"
        className="text-sm text-muted-foreground"
      >
        {clsx(
          label,
          percentage !== null && `${percentage}%`,
          progress &&
            percentage === null &&
            `(${(progress.loaded / 1024 / 1024).toFixed(1)} MiB received)`,
        )}
      </p>
      <Progress
        value={percentage}
        aria-label={label}
        className={percentage === null ? 'animate-pulse' : undefined}
      />
    </div>
  );
};
