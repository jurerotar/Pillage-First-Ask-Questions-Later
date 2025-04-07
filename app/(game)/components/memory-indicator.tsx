import { useEffect, useState } from 'react';

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

export const MemoryIndicator = () => {
  const [usedHeap, setUsedHeap] = useState<number>(0);

  useEffect(() => {
    // @ts-expect-error: Dev-only
    if (!window.performance.memory) {
      return;
    }

    const interval = setInterval(() => {
      // @ts-expect-error: Dev-only
      const { usedJSHeapSize } = window.performance.memory;
      setUsedHeap(usedJSHeapSize);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // @ts-expect-error: Dev-only
  if (!window.performance.memory) {
    return null;
  }

  return (
    <div className="fixed bottom-2 lg:bottom-auto left-2 lg:top-1 lg:left-1 w-fit h-auto pointer-events-none text-2xs lg:text-xs font-mono z-100 bg-black/80 text-white px-2 py-1 rounded shadow">
      Memory: {formatBytes(usedHeap)}
    </div>
  );
};
