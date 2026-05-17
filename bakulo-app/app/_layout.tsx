/**
 * app/_layout.tsx — v11 FINAL
 *
 * FIXES CRÍTICOS:
 *  ✅ initDatabase() ejecutado SINCRÓNICAMENTE antes de que se monte AppStoreProvider
 *     → Elimina el error "no such table: user_preferences"
 *     → Elimina el bucle login↔home
 *  ✅ Auth guard: sesión Supabase → tabs | sin sesión → login
 *  ✅ startAutoSync SOLO si hay sesión activa (evita Network request failed al arrancar)
 *  ✅ setInvalidTokenCallback / removeInvalidTokenCallback con fallback seguro
 *  ✅ Todas las rutas del proyecto declaradas
 */

import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AppStoreProvider }  from '@/store/AppStore';
import { RecipeProvider }    from '@/store/RecipeStore';
import { GlucoseProvider }   from '@/store/GlucoseStore';
import { supabase, setupDeepLinkHandler } from '@/service/supabaseClient';
import { SyncService } from '@/service/syncService';

// ─── PASO 1: initDatabase SÍNCRONO — ANTES de cualquier import de stores ──────
// Este bloque corre en el momento que el módulo se evalúa (module-level),
// ANTES de que React monte cualquier componente o Provider.
// Es la única manera de garantizar que las tablas existan cuando
// AppStore llame db_getCurrentUser() en su useState inicial.

try {
  // require (no import) para forzar ejecución síncrona inmediata
  const { initDatabase } = require('@/service/database');
  initDatabase();
  console.log('[DB] ✅ initDatabase OK (module level)');
} catch (e: any) {
  console.error('[DB] ❌ initDatabase FAILED:', e?.message ?? e);
}

// ─── PASO 2: Hook de inicialización async (red, sync, deep links) ─────────────

function useAppInit() {
  const router   = useRouter();
  const didInit  = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // ── Auth guard principal ─────────────────────────────────────────────────
    // Intento 1: sesión de Supabase (online)
    // Intento 2: fallback a sesión local SQLite (offline)
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('[Auth] Sesión Supabase activa → tabs');
          // Iniciar sync SOLO cuando hay sesión para evitar Network error
          try { SyncService.startAutoSync(5); } catch {}
          router.replace('/(tabs)');
          return;
        }
      } catch (e) {
        console.warn('[Auth] Supabase.getSession falló (sin red?):', e);
      }

      // Fallback: ¿hay usuario guardado localmente?
      try {
        const { db_getCurrentUser } = require('@/service/database');
        const localUser = db_getCurrentUser();
        if (localUser) {
          console.log('[Auth] Sesión local encontrada → tabs (offline)');
          router.replace('/(tabs)');
          return;
        }
      } catch (e) {
        console.warn('[Auth] db_getCurrentUser falló:', e);
      }

      console.log('[Auth] Sin sesión → login');
      router.replace('/login');
    };

    checkAuth();

    // ── Deep link handler (OAuth + reset password) ───────────────────────────
    let deepLinkCleanup: (() => void) | undefined;
    try {
      deepLinkCleanup = setupDeepLinkHandler(
        () => {
          console.log('[DeepLink] Auth OK → tabs');
          try { SyncService.startAutoSync(5); } catch {}
          router.replace('/(tabs)');
        },
        () => {
          console.log('[DeepLink] Password reset → ChangePassword');
          router.push('/ChangePassword' as any);
        }
      );
    } catch (e) {
      console.warn('[DeepLink] setup error:', e);
    }

    // ── Listener de cambios de sesión (token expirado, logout remoto) ────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase Auth]', event);
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        try { SyncService.stopAutoSync(); } catch {}
        router.replace('/login');
      }
    });

    return () => {
      deepLinkCleanup?.();
      subscription?.unsubscribe();
      try { SyncService.stopAutoSync(); } catch {}
    };
  }, []);
}

// ─── PASO 3: Componente de pantallas ─────────────────────────────────────────

function AppScreens() {
  useAppInit();

  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* ── Tabs principales ─────────────────────────────────────────────── */}
      <Stack.Screen name="(tabs)" />

      {/* ── Auth ─────────────────────────────────────────────────────────── */}
      <Stack.Screen name="login" />
      <Stack.Screen name="Register" />
      <Stack.Screen name="register" />
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="ChangePassword" />

      {/* ── Modals slide from bottom ──────────────────────────────────────── */}
      <Stack.Screen name="LogGlucoseScreen"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="log-medication"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="log-exercise"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="FoodLogScreen"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="RecipeBuilderScreen"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="export"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="notifications"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal"
        options={{ presentation: 'modal' }} />

      {/* ── Pantallas push ───────────────────────────────────────────────── */}
      <Stack.Screen name="DashboardScreen" />
      <Stack.Screen name="history" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="RepositoryScreen" />
      <Stack.Screen name="SyncScreen" />
      <Stack.Screen name="DataVerifyScreen" />
      <Stack.Screen name="DailyTasksScreen" />
      <Stack.Screen name="RecipesScreen" />
      <Stack.Screen name="RecipeDetailScreen" />
      <Stack.Screen name="InsightsScreen" />
      <Stack.Screen name="ArticleDetail" />
      <Stack.Screen name="ProfileScreen" />
      <Stack.Screen name="SecurityScreen" />
      <Stack.Screen name="SupportScreen" />
      <Stack.Screen name="NotificationsScreen" />
      <Stack.Screen name="MissingDataScreen" />
      <Stack.Screen name="log-details" />
      <Stack.Screen name="exercise-details" />
      <Stack.Screen name="bolus-details" />
      <Stack.Screen name="meal-details" />

      {/* ── Emergencia (fade para impacto visual) ───────────────────────── */}
      <Stack.Screen name="EmergencySOSScreen"
        options={{ animation: 'fade' }} />

    </Stack>
  );
}

// ─── PASO 4: Root — Providers envuelven todo ─────────────────────────────────
// IMPORTANTE: initDatabase() ya corrió ANTES de llegar aquí (paso 1)
// Así que AppStoreProvider puede llamar db_getCurrentUser() sin error

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <RecipeProvider>
        <GlucoseProvider>
          <AppScreens />
        </GlucoseProvider>
      </RecipeProvider>
    </AppStoreProvider>
  );
}