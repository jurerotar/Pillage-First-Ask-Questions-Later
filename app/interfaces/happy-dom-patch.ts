// We need this to speed up TypeScript checks.
// Vitest is currently importing happy-dom types, which slow down compilation by ~ 10%.

declare module 'happy-dom' {}
