/**
 * app/_layout.tsx — v10 PRO
 * * Cambios realizados:
 * ✅ Importación correcta de 'supabase' para chequeo de sesión.
 * ✅ Limpieza correcta del callback de token inválido.
 * ✅ Manejo de tipos para evitar errores de TS en navegación.
 */

import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AppStoreProvider }  from '@/store/AppStore';
import { RecipeProvider }    from '@/store/RecipeStore';
import { GlucoseProvider }   from '@/store/GlucoseStore';
import {
  supabase, // Importamos el cliente directo
  setupDeepLinkHandler,
  setInvalidTokenCallback,
  removeInvalidTokenCallback,
} from '@/service/supabaseClient';
import { SyncService } from '@/service/syncService';

// ─── INIT DB ANTES DE TODO ────────────────────────────────────────────────────
try {
  const { initDatabase } = require('@/service/database');
  initDatabase();
} catch (e) {
  console.warn('[DB] init error at module load:', e);
}

// ─── HOOK DE INICIALIZACIÓN ───────────────────────────────────────────────────
function useAppInit() {
  const router = useRouter();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // 1. Auto-sync cada 5 minutos
    try { SyncService.startAutoSync(5); } catch {}

    // 2. Redirect inicial basado en sesión persistida
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('[Layout] Sesión detectada → Tabs');
        router.replace('/(tabs)');
      } else {
        console.log('[Layout] Sin sesión → Login');
        router.replace('/login');
      }
    });

    // 3. Deep link para OAuth y Recovery
    let deepLinkCleanup: (() => void) | undefined;
    try {
      deepLinkCleanup = setupDeepLinkHandler(
        () => {
          console.log('[Layout] Auth exitosa via DeepLink → Tabs');
          router.replace('/(tabs)');
        },
        () => {
          console.log('[Layout] Reset solicitado → ChangePassword');
          router.push('/ChangePassword?fromReset=true');
        }
      );
    } catch (e) {
      console.warn('[DeepLink] Error:', e);
    }

    // 4. Callback para token inválido (401)
    // Guardamos la referencia para poder removerlo después
    const onInvalidToken = () => {
      console.warn('[Layout] Sesión invalidada por el servidor → Login');
      router.replace('/login');
    };

    setInvalidTokenCallback(onInvalidToken);

    // ─── LIMPIEZA ─────────────────────────────────────────────────────────────
    return () => {
      if (deepLinkCleanup) deepLinkCleanup();
      try { SyncService.stopAutoSync(); } catch {}
      removeInvalidTokenCallback(onInvalidToken); // Pasamos la referencia exacta
    };
  }, []);
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
function AppScreens() {
  useAppInit();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Definición de rutas principales */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="Register" />
      
      {/* Modals con presentación específica */}
      <Stack.Screen 
        name="LogGlucoseScreen"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
      <Stack.Screen 
        name="RecipeBuilderScreen"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />
      
      {/* El resto de las pantallas heredan headerShown: false */}
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="ChangePassword" />
      <Stack.Screen name="EmergencySOSScreen" />
    </Stack>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
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