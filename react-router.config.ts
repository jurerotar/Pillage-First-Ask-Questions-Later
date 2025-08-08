import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  prerender: [
    '/',
    '/create-new-server',
    '/game/server-slug/village-slug/resources',
    '/game/server-slug/village-slug/village',
    '/game/server-slug/village-slug/map',
    '/game/server-slug/village-slug/resources/building-field-id',
    '/game/server-slug/village-slug/village/building-field-id',
    '/game/server-slug/village-slug/production-overview',
    '/game/server-slug/village-slug/hero',
    '/game/server-slug/village-slug/preferences',
    '/game/server-slug/village-slug/statistics',
    '/game/server-slug/village-slug/overview',
    '/game/server-slug/village-slug/quests',
    '/game/server-slug/village-slug/reports',
    '/game/server-slug/village-slug/reports/report-id',
    '/design-system/icons',
    '/error/403',
    '/error/404',
  ],
  future: {
    unstable_middleware: true,
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: true,
    unstable_viteEnvironmentApi: true,
    unstable_splitRouteModules: 'enforce',
  },
} satisfies Config;
