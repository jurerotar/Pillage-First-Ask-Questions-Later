import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const SPLASH_DURATION_MS = 1200;
const MIN_CROSSFADE_DURATION_MS = 180;

type SplashPhase = 'loading' | 'fading' | 'hidden';

const GameStartupReadyContext = createContext<(() => void) | null>(null);

export const GameStartupContentReady = () => {
  const onReady = use(GameStartupReadyContext);

  useLayoutEffect(() => {
    onReady?.();
  }, [onReady]);

  return null;
};

export const GameStartupSplash = ({ children }: PropsWithChildren) => {
  const [phase, setPhase] = useState<SplashPhase>('loading');
  const splashRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number>(0);

  const isReady = phase !== 'loading';

  const onReady = useCallback(() => {
    setPhase((current) => (current === 'loading' ? 'fading' : current));
  }, []);

  useLayoutEffect(() => {
    startedAt.current = performance.now();
  }, []);

  useLayoutEffect(() => {
    const splash = splashRef.current;
    if (phase !== 'fading' || !splash) {
      return;
    }

    const elapsed = performance.now() - startedAt.current;
    const duration = Math.max(
      MIN_CROSSFADE_DURATION_MS,
      SPLASH_DURATION_MS - elapsed,
    );

    const animation = splash.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration,
      easing: 'ease-out',
      fill: 'forwards',
    });

    animation.onfinish = () => setPhase('hidden');

    return () => animation.cancel();
  }, [phase]);

  return (
    <GameStartupReadyContext value={onReady}>
      <div inert={!isReady}>{children}</div>
      {phase !== 'hidden' && (
        <div
          ref={splashRef}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,var(--color-amber-50),var(--background)_58%)] px-6 aria-hidden:pointer-events-none dark:bg-[radial-gradient(circle_at_center,var(--color-stone-900),var(--background)_58%)]"
          aria-hidden={isReady || undefined}
        >
          <div
            className="animate-api-provider-splash flex w-full max-w-md flex-col items-center gap-8 text-center"
            role="status"
            aria-live="polite"
          >
            <img
              src="/pillage-first-logo-horizontal.svg"
              alt="Pillage First! logo"
              className="animate-api-provider-splash-logo h-auto w-56 max-w-full sm:w-72"
            />
            <div className="animate-api-provider-splash-logo flex w-full max-w-56 flex-col gap-3 sm:max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="animate-api-provider-splash-progress h-full w-1/2 rounded-full bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </GameStartupReadyContext>
  );
};
