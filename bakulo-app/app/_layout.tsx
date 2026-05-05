/**
 * app/_layout.tsx — v8
 *
 * FIXES:
 *  ✅ GlucoseProvider añadido → resuelve "useGlucose must be inside GlucoseProvider"
 *  ✅ Todas las rutas declaradas que existen en el proyecto como archivos físicos
 *  ✅ startAutoSync / stopAutoSync correctamente importados del singleton
 *  ✅ setupDeepLinkHandler para OAuth Google/Apple
 *
 * IMPORTANTE — Rutas en Expo Router:
 *  El router solo registra rutas que tienen un archivo físico en app/.
 *  Si un Screen aparece aquí pero NO hay archivo en app/, Expo lanza el warning.
 *  Asegúrate de que estos archivos existan en app/:
 *    app/LogGlucoseScreen.tsx
 *    app/RecipeDetailScreen.tsx
 *    app/history.tsx
 *    app/DailyTasksScreen.tsx
 *    app/InsightsScreen.tsx
 *    app/ArticleDetail.tsx
 */

import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AppStoreProvider }  from '@/store/AppStore';
import { RecipeProvider }    from '@/store/RecipeStore';
import { GlucoseProvider }   from '@/store/GlucoseStore';
import { setupDeepLinkHandler } from '@/service/supabaseClient';
import { startAutoSync, stopAutoSync } from '@/service/syncService';

function useAppInit() {
  const router = useRouter();

  useEffect(() => {
    // SQLite
    try {
      const { initDatabase } = require('@/service/database');
      initDatabase();
    } catch (e) { console.warn('[DB] init skipped:', e); }

    // Auto-sync Supabase cada 5 min
    try { startAutoSync(5); } catch {}

    // Deep link handler para OAuth y reset de contraseña
    let cleanup: (() => void) | undefined;
    try {
      cleanup = setupDeepLinkHandler(
        () => { router.replace('/(tabs)'); },
        () => { router.push('/ChangePassword?fromReset=true' as any); }
      );
    } catch (e) { console.warn('[DeepLink] setup skipped:', e); }

    return () => {
      try { cleanup?.(); } catch {}
      try { stopAutoSync(); } catch {}
    };
  }, []);
}

function AppScreens() {
  useAppInit();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tabs principales */}
      <Stack.Screen name="(tabs)" />

      {/* Auth */}
      <Stack.Screen name="login"           />
      <Stack.Screen name="register"        />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="ChangePassword"  />

      {/* Modals de registro — slide desde abajo */}
      <Stack.Screen name="LogGlucoseScreen"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />
      <Stack.Screen name="log-medication"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />
      <Stack.Screen name="log-exercise"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />
      <Stack.Screen name="FoodLogScreen"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />

      {/* Recetas */}
      <Stack.Screen name="RecipesScreen" />
      <Stack.Screen name="RecipeDetailScreen" />
      <Stack.Screen name="RecipeBuilderScreen"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />

      {/* Salud / Historia */}
      <Stack.Screen name="history" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="RepositoryScreen" />
      <Stack.Screen name="SyncScreen" />
      <Stack.Screen name="DataVerifyScreen" />
      <Stack.Screen name="DailyTasksScreen" />
      <Stack.Screen name="EmergencySOSScreen" />

      {/* Insights / Artículos */}
      <Stack.Screen name="InsightsScreen" />
      <Stack.Screen name="ArticleDetail" />

      {/* Configuración / Perfil */}
      <Stack.Screen name="ProfileScreen" />
      <Stack.Screen name="SecurityScreen" />
      <Stack.Screen name="SupportScreen" />
      <Stack.Screen name="NotificationsScreen" />

      {/* Detalles */}
      <Stack.Screen name="log-details" />
      <Stack.Screen name="exercise-details" />
      <Stack.Screen name="bolus-details" />
      <Stack.Screen name="meal-details" />

      {/* Modals sistema */}
      <Stack.Screen name="export"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />
      <Stack.Screen name="notifications"
        options={{ presentation:'modal', animation:'slide_from_bottom' }} />
      <Stack.Screen name="modal"
        options={{ presentation:'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <RecipeProvider>
        {/* GlucoseProvider DEBE estar aquí para que useGlucose() funcione en cualquier pantalla */}
        <GlucoseProvider>
          <AppScreens />
        </GlucoseProvider>
      </RecipeProvider>
    </AppStoreProvider>
  );
}