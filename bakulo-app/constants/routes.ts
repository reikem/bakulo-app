/**
 * routes.ts — v2
 * Rutas centralizadas de toda la aplicación Serenity.
 * Importa desde cualquier pantalla:
 *   import { ROUTES } from '@/constants/routes';
 *   router.push(ROUTES.HEALTH.REPOSITORY);
 */

export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
  },

  TABS: {
    INDEX:      '/(tabs)/DashboardScreen',
    ADVICE:     '/(tabs)/advice',
    EXPLORE:    '/(tabs)/explore',
    HISTORY:    '/(tabs)/history',
    SETTINGS:   '/(tabs)/settings',
    SYNC:       '/(tabs)/sync',
  },

  SETTINGS: {
    PROFILE:          '/ProfileScreen',
    SUPPORT:          '/SupportScreen',
    SECURITY_DETAIL:  '/SecurityScreen',
    NOTIFICATIONS:    '/NotificationsScreen',
  },

  INSIGHTS: {
    MAIN:           '/(tabs)/InsightsScreen',
    NUTRITION_LIST: '/(tabs)/NutritionList',
    ARTICLE_DETAIL: '/(tabs)/ArticleDetail',
  },

  HEALTH: {
    EXPORT:        '/export',
    LOG_EXERCISE:  '/log-exercise',
    LOG_MEDICATION:'/log-medication',
    LOG_GLUCOSE:   '/LogGlucoseScreen',
    FOOD_LOG:      '/FoodLogScreen',
    REPORTS:       '/reports',
    REPOSITORY:    '/RepositoryScreen',
    HISTORY:       '/history',
  },
} as const;

// Tipo utilitario para usar con router.push()
export type AppRoute =
  | typeof ROUTES.AUTH[keyof typeof ROUTES.AUTH]
  | typeof ROUTES.TABS[keyof typeof ROUTES.TABS]
  | typeof ROUTES.SETTINGS[keyof typeof ROUTES.SETTINGS]
  | typeof ROUTES.INSIGHTS[keyof typeof ROUTES.INSIGHTS]
  | typeof ROUTES.HEALTH[keyof typeof ROUTES.HEALTH];
