/**
 * app/_layout.tsx — Layout raíz v3
 *
 * ✅ AppStoreProvider  — fuente de verdad central
 * ✅ GlucoseProvider   — bridge adapter sobre AppStore
 * ✅ RecipeProvider    — recetas + TheMealDB API
 * ✅ AppInitializer    — initDatabase + NotificationService (una vez)
 * ✅ Stack completo    — todas las rutas de la app
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppStoreProvider } from '@/store/AppStore';
import { GlucoseProvider } from '@/store/GlucoseStore';
import { RecipeProvider } from '@/store/RecipeStore';
import { initDatabase } from '@/service/database';
import { NotificationService } from '@/service/notificationService';

// ─── Inicialización única al montar la app ────────────────────────────────────

function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try { initDatabase(); } catch (e) { console.warn('DB init error:', e); }
    NotificationService.setup().catch(() => {});
  }, []);
  return <>{children}</>;
}

// ─── Layout raíz ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <GlucoseProvider>
        <RecipeProvider>
          <AppInitializer>
            <Stack screenOptions={{ headerShown: false }}>

              {/* ── Tabs principales ───────────────────────────────── */}
              <Stack.Screen name="(tabs)" />

              {/* ── Auth ───────────────────────────────────────────── */}
              <Stack.Screen name="login" />

              {/* ── Modales de registro (slide from bottom) ─────────── */}
              <Stack.Screen
                name="LogGlucoseScreen"
                options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="log-medication"
                options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="log-exercise"
                options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="FoodLogScreen"
                options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="export"
                options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="notifications"
                options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal' }}
              />

              {/* ── Pantallas de navegación normal (push) ──────────── */}
              <Stack.Screen name="DashboardScreen"     options={{ headerShown: false }} />
              <Stack.Screen name="ProfileScreen"       options={{ headerShown: false }} />
              <Stack.Screen name="SecurityScreen"      options={{ headerShown: false }} />
              <Stack.Screen name="SupportScreen"       options={{ headerShown: false }} />
              <Stack.Screen name="NotificationsScreen" options={{ headerShown: false }} />
              <Stack.Screen name="reports"             options={{ headerShown: false }} />
              <Stack.Screen name="RepositoryScreen"    options={{ headerShown: false }} />
              <Stack.Screen name="SyncScreen"          options={{ headerShown: false }} />
              <Stack.Screen name="history"             options={{ headerShown: false }} />
              <Stack.Screen name="log-details"         options={{ headerShown: false }} />
              <Stack.Screen name="exercise-details"    options={{ headerShown: false }} />
              <Stack.Screen name="bolus-details"       options={{ headerShown: false }} />
              <Stack.Screen name="meal-details"        options={{ headerShown: false }} />

              {/* ── Recetas ────────────────────────────────────────── */}
              <Stack.Screen name="RecipesScreen"       options={{ headerShown: false }} />
              <Stack.Screen name="RecipeBuilderScreen" options={{ headerShown: false }} />
              <Stack.Screen name="EmergencySOSScreen"  options={{ headerShown: false, animation: 'fade' }} />


            </Stack>
          </AppInitializer>
        </RecipeProvider>
      </GlucoseProvider>
    </AppStoreProvider>
  );
}