export const ROUTES = {
  AUTH: {
    LOGIN: '/login', // Coincide con login.tsx
  },
  TABS: {
    // Estas están dentro de (tabs)
    INDEX: '/(tabs)', 
    ADVICE: '/(tabs)/advice',
    EXPLORE: '/(tabs)/explore',
    HISTORY: '/(tabs)/history',
    SETTINGS: '/(tabs)/settings',
  },
  SETTINGS: {
    // NOTA: Aquí agregamos "Screen" porque así se llaman tus archivos
    PROFILE: '/ProfileScreen', 
    SUPPORT: '/SupportScreen',
    SECURITY_DETAIL: '/SecurityScreen',
    NOTIFICATIONS: '/NotificationsScreen',
  },
  HEALTH: {
    EXPORT: '/export',
    LOG_EXERCISE: '/log-exercise',
    LOG_MEDICATION: '/log-medication',
    REPORTS: '/reports',
  }
} as const;