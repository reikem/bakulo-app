/**
 * hooks/useSessionGuard.ts
 *
 * Hook que protege rutas autenticadas.
 * Redirige a /login si no hay sesión válida.
 *
 * Uso en cualquier pantalla protegida:
 *   export default function DashboardScreen() {
 *     useSessionGuard();
 *     ...
 *   }
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/service/supabaseClient';
import { db_getCurrentUser, db_logout } from '@/service/database';
import { SessionTimeout } from '@/service/securityService';

const SESSION_TIMEOUT_MINUTES = 30;

export function useSessionGuard(options?: {
  redirectTo?:      string;
  timeoutMinutes?:  number;
  offlineAllowed?:  boolean;
}) {
  const router          = useRouter();
  const redirectTo      = options?.redirectTo      ?? '/login';
  const timeoutMinutes  = options?.timeoutMinutes   ?? SESSION_TIMEOUT_MINUTES;
  const offlineAllowed  = options?.offlineAllowed   ?? true;
  const lastActiveRef   = useRef(Date.now());
  const appStateRef     = useRef<AppStateStatus>('active');

  useEffect(() => {
    let valid = false;

    const checkSession = async () => {
      // 1. Verificar sesión Supabase (online)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) { valid = true; return; }
      } catch { /* sin red */ }

      // 2. Fallback: sesión local (offline)
      if (offlineAllowed) {
        const localUser = db_getCurrentUser();
        if (localUser) { valid = true; return; }
      }

      // 3. Sin sesión → redirigir
      console.warn('[SessionGuard] Sin sesión → redirect a', redirectTo);
      router.replace(redirectTo as any);
    };

    checkSession();

    // ── Timeout de inactividad ────────────────────────────────────────────────
    SessionTimeout.configure(timeoutMinutes, () => {
      console.warn('[SessionGuard] Timeout por inactividad');
      db_logout();
      supabase.auth.signOut().catch(() => {});
      router.replace(redirectTo as any);
    });

    // ── Verificar al volver al primer plano ───────────────────────────────────
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        const elapsed = Date.now() - lastActiveRef.current;
        const elapsedMinutes = elapsed / 60000;

        if (elapsedMinutes >= timeoutMinutes) {
          console.warn('[SessionGuard] Sesión expirada por tiempo en background');
          db_logout();
          supabase.auth.signOut().catch(() => {});
          router.replace(redirectTo as any);
        } else {
          // Refrescar sesión si lleva más de 10 min en background
          if (elapsedMinutes > 10) {
            supabase.auth.refreshSession().catch(() => {});
          }
          SessionTimeout.reset();
        }
      }
      if (nextState === 'background' || nextState === 'inactive') {
        lastActiveRef.current = Date.now();
      }
      appStateRef.current = nextState;
    });

    return () => {
      appStateSub.remove();
      SessionTimeout.stop();
    };
  }, []);

  // Registrar actividad del usuario para resetear el timeout
  const registerActivity = () => {
    SessionTimeout.reset();
    lastActiveRef.current = Date.now();
  };

  return { registerActivity };
}

/**
 * Hook simplificado solo para resetear timeout en interacciones.
 * Úsalo en pantallas donde el usuario interactúa frecuentemente.
 *
 * const { onInteraction } = useActivityTracker();
 * <ScrollView onScroll={onInteraction} onTouchStart={onInteraction}>
 */
export function useActivityTracker() {
  const onInteraction = () => SessionTimeout.reset();
  return { onInteraction };
}