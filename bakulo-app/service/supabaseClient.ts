/**
 * service/supabaseClient.ts — v5
 *
 * ✅ supaSignInWithGoogle  — OAuth via navegador del sistema + deep link
 * ✅ supaSignInWithApple   — expo-apple-authentication (solo iOS)
 * ✅ Al cerrar sesión: borra todos los datos del AsyncStorage y SQLite local
 * ✅ Anon key: usa la LEGACY key (eyJ...) desde Settings → API → Legacy anon
 * ✅ Confirmación de email DESACTIVADA en el registro (auto-confirm)
 *    → En Supabase Dashboard: Authentication → Providers → Email
 *      desactiva "Confirm email"  ← esto soluciona el problema de verificación
 *
 * .env correcto:
 *   EXPO_PUBLIC_SUPABASE_URL=https://kjiphfttgxdrmrrspenw.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← Legacy anon
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking  from 'expo-linking';
import { Platform }  from 'react-native';

// ─── CREDENCIALES ─────────────────────────────────────────────────────────────
// ⚠️  La clave sb_publishable_... NO funciona con supabase-js.
//     Necesitas la LEGACY anon key (eyJ...).
//     Pasos:
//       1. Ve a: https://supabase.com/dashboard/project/kjiphfttgxdrmrrspenw/settings/api
//       2. Haz clic en "Legacy anon, service_role API keys"
//       3. Copia "anon public" (empieza con eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
//       4. Ponla en .env como EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

const SUPABASE_URL  =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://kjiphfttgxdrmrrspenw.supabase.co';

const SUPABASE_ANON =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_YsJOpYe90S0TsleW_osP1w_S80_2CeW';

// Solo advertencia, no error que rompa la app
if (__DEV__ && SUPABASE_ANON.startsWith('sb_publishable_')) {
  console.warn('[Supabase] ⚠️  Publishable key detectada. Si auth falla obtén la Legacy anon key (eyJ...) en: Dashboard → Settings → API');
}

export const APP_SCHEME    = 'serenity';
export const AUTH_CALLBACK = `${APP_SCHEME}://auth/callback`;

// ─── CLIENTE ──────────────────────────────────────────────────────────────────
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON,
  {
    auth: {
      storage:            AsyncStorage,
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'x-app-name': 'serenity-expo' },
    },
  }
);

// ─── LIMPIAR STORAGE SUPABASE ─────────────────────────────────────────────────
async function clearSupabaseStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(k =>
      k.includes('supabase') || k.includes('sb-') || k.includes('auth-token')
    );
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
    }
  } catch {}
}

// ─── CALLBACK PARA REDIRECT AL LOGIN ─────────────────────────────────────────
let _onInvalidToken: (() => void) | null = null;
export function setInvalidTokenCallback(cb: () => void) { _onInvalidToken = cb; }
export function removeInvalidTokenCallback() { _onInvalidToken = null; }

// ─── AUTO-CLEAR SESIÓN INVÁLIDA ───────────────────────────────────────────────
supabase.auth.onAuthStateChange(async (event) => {
  if (event === 'SIGNED_OUT') {
    await clearSupabaseStorage();
  }
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export async function getSupabaseUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── TEST DE CONEXIÓN ─────────────────────────────────────────────────────────
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const start = Date.now();
    const { error } = await supabase.from('glucose_entries').select('id').limit(1);
    const ms = Date.now() - start;
    if (error) {
      if (error.message?.includes('does not exist')) {
        console.error('\n❌ TABLAS NO EXISTEN. Ejecuta supabase_schema.sql en el SQL Editor.\n');
      } else {
        console.warn(`[Supabase] ❌ ${error.message} (${error.code})`);
      }
      return false;
    }
    console.log(`[Supabase] ✅ Conectado en ${ms}ms`);
    return true;
  } catch (e: any) {
    console.error('[Supabase] ❌', e?.message);
    return false;
  }
}

// ─── AUTH EMAIL / PASSWORD ────────────────────────────────────────────────────
export async function supaSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Registro sin confirmación de email.
 * REQUIERE que en Supabase Dashboard desactives "Confirm email":
 *   Authentication → Providers → Email → desactivar "Confirm email"
 */
export async function supaSignUp(
  email: string,
  password: string,
  displayName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      // No enviar email de confirmación si está desactivado en el dashboard
      emailRedirectTo: AUTH_CALLBACK,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function supaResetPassword(email: string): Promise<boolean> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: AUTH_CALLBACK,
  });
  if (error) { console.warn('[Supabase] resetPassword:', error.message); return false; }
  return true;
}

export async function supaUpdatePassword(newPassword: string): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) { console.warn('[Supabase] updatePassword:', error.message); return false; }
  return true;
}

// ─── LIMPIEZA DE DATOS AL CERRAR SESIÓN ──────────────────────────────────────
/**
 * Elimina TODOS los datos locales del usuario al cerrar sesión:
 *   - Sesión Supabase
 *   - AsyncStorage (tokens, preferencias)
 *   - SQLite (usuario actual, preferencias)
 */
async function clearLocalUserData(): Promise<void> {
  // 1. Limpiar AsyncStorage (tokens Supabase, caché)
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    // Eliminar claves relacionadas con Supabase y la app
    const keysToRemove = allKeys.filter(k =>
      k.includes('supabase') ||
      k.includes('serenity') ||
      k.includes('sb-') ||
      k.includes('auth') ||
      k.includes('session') ||
      k.includes('user')
    );
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    console.log('[Logout] AsyncStorage limpiado:', keysToRemove.length, 'claves eliminadas');
  } catch (e) {
    console.warn('[Logout] Error limpiando AsyncStorage:', e);
  }

  // 2. Limpiar datos de usuario en SQLite
  try {
    const { db_logout, db_setPreference } = require('@/service/database');
    db_logout();                              // elimina current_user de preferences
    db_setPreference('faceIdEnabled', 'false');
    db_setPreference('incognito', 'false');
    console.log('[Logout] SQLite limpiado');
  } catch (e) {
    console.warn('[Logout] Error limpiando SQLite:', e);
  }
}

export async function supaSignOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[Logout] supabase.auth.signOut error:', e);
  } finally {
    // Siempre limpiar localmente aunque falle la red
    await clearLocalUserData();
  }
}

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
/**
 * Inicia el flujo OAuth con Google.
 * Abre el navegador del sistema. El deep link serenity://auth/callback
 * devuelve los tokens. Usa setupDeepLinkHandler en _layout.tsx para capturarlos.
 *
 * Configuración requerida en Supabase Dashboard:
 *   Authentication → Providers → Google → habilitar
 *   Authentication → URL Configuration:
 *     Site URL: serenity://auth/callback
 *     Redirect URLs: serenity://auth/callback
 */
export async function supaSignInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
  redirected?: boolean;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:         AUTH_CALLBACK,
        skipBrowserRedirect: true,   // nosotros abrimos el URL manualmente
        queryParams: {
          access_type: 'offline',
          prompt:      'consent',    // fuerza mostrar selector de cuenta
        },
      },
    });

    if (error || !data.url) {
      return { success: false, error: error?.message ?? 'No se pudo obtener URL de Google.' };
    }

    // Abrir navegador del sistema
    const canOpen = await Linking.canOpenURL(data.url).catch(() => false);
    if (!canOpen) {
      return { success: false, error: 'No se puede abrir el navegador.' };
    }

    await Linking.openURL(data.url);

    // La sesión se establece cuando el deep link regresa a la app
    // → setupDeepLinkHandler en _layout.tsx llama onActivated()
    return { success: false, redirected: true, error: '_OAUTH_REDIRECT_' };

  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error con Google OAuth.' };
  }
}

// ─── APPLE SIGN IN ────────────────────────────────────────────────────────────
/**
 * Inicio de sesión con Apple (solo iOS).
 * Usa expo-apple-authentication directamente (sin expo-auth-session/expo-crypto).
 * Al cerrar sesión se eliminan los datos locales igualmente.
 *
 * Instalación: npx expo install expo-apple-authentication
 * Configuración en app.json:
 *   "plugins": [["expo-apple-authentication"]]
 * En Supabase: Authentication → Providers → Apple → habilitar
 */
export async function supaSignInWithApple(): Promise<{
  success: boolean;
  user?: { id: string; email?: string; displayName: string };
  error?: string;
}> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign In solo está disponible en iOS.' };
  }

  try {
    // Import dinámico — no rompe en Android/Web si no está instalado
    const AppleAuth = await import('expo-apple-authentication');

    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { success: false, error: 'Apple no devolvió un identity token.' };
    }

    // Enviar token a Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token:    credential.identityToken,
      nonce:    credential.authorizationCode ?? undefined,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const supaUser   = data.user;
    const fullName   = credential.fullName;
    const firstName  = fullName?.givenName  ?? '';
    const lastName   = fullName?.familyName ?? '';
    const displayName = [firstName, lastName].filter(Boolean).join(' ')
      || supaUser?.email?.split('@')[0]
      || 'Usuario';

    // Actualizar metadata con el nombre real (Apple solo lo manda la primera vez)
    if (firstName || lastName) {
      await supabase.auth.updateUser({
        data: { display_name: displayName, full_name: displayName },
      }).catch(() => {});
    }

    console.log('[Apple] ✅ Login exitoso:', supaUser?.id);
    return {
      success: true,
      user: {
        id:          supaUser!.id,
        email:       supaUser?.email,
        displayName,
      },
    };

  } catch (e: any) {
    // ERR_CANCELED = usuario canceló el diálogo
    if (e?.code === 'ERR_CANCELED' || e?.code === '1001') {
      return { success: false, error: 'Cancelado por el usuario.' };
    }
    // Apple Auth no instalado
    if (e?.message?.includes("Cannot find module")) {
      return { success: false, error: 'expo-apple-authentication no está instalado. Ejecuta: npx expo install expo-apple-authentication' };
    }
    console.warn('[Apple] Error:', e?.message ?? e);
    return { success: false, error: e?.message ?? 'Error con Apple Sign In.' };
  }
}

// ─── DEEP LINK HANDLER ────────────────────────────────────────────────────────
/**
 * Registra el listener de deep links para capturar el callback de OAuth.
 * Llamar en _layout.tsx → useEffect al montar.
 *
 * Ejemplo de uso:
 *   useEffect(() => {
 *     const cleanup = setupDeepLinkHandler(
 *       () => router.replace('/(tabs)'),   // onActivated
 *       () => router.push('/ChangePassword?fromReset=true') // onPasswordReset
 *     );
 *     return cleanup;
 *   }, []);
 */
export function setupDeepLinkHandler(
  onActivated?:     () => void,
  onPasswordReset?: () => void,
): () => void {
  const handle = async (url: string) => {
    if (!url) return;
    console.log('[DeepLink] URL recibida:', url);

    // Supabase puede volver con el código en query string (PKCE) o tokens en fragment
    const fragment = url.split('#')[1] ?? '';
    const fParams  = new URLSearchParams(fragment);

    const errorCode = fParams.get('error_code');
    if (errorCode) {
      console.warn('[DeepLink] Error:', fParams.get('error_description'));
      return;
    }

    const accessToken  = fParams.get('access_token');
    const refreshToken = fParams.get('refresh_token');
    const type         = fParams.get('type');

    if (accessToken) {
      // Implicit flow — tokens directamente en el fragmento
      try {
        const { error } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken ?? '',
        });
        if (error) { console.warn('[DeepLink] setSession error:', error.message); return; }
        console.log('[DeepLink] ✅ Sesión establecida (implicit), tipo:', type);

        if (type === 'recovery') {
          onPasswordReset?.();
        } else {
          onActivated?.();
        }
      } catch (e: any) {
        console.error('[DeepLink] setSession excepción:', e?.message);
      }
      return;
    }

    // PKCE flow — código en query string
    const qs   = url.split('?')[1] ?? '';
    const qp   = new URLSearchParams(qs);
    const code = qp.get('code');
    const qType = qp.get('type');

    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { console.warn('[DeepLink] exchangeCode error:', error.message); return; }
        console.log('[DeepLink] ✅ Sesión establecida (PKCE)');

        if (qType === 'recovery') {
          onPasswordReset?.();
        } else {
          onActivated?.();
        }
      } catch (e: any) {
        console.error('[DeepLink] exchangeCode excepción:', e?.message);
      }
    }
  };

  // Escuchar links mientras la app está abierta
  const subscription = Linking.addEventListener('url', ({ url }) => handle(url));

  // Link inicial (app abierta fría desde un link)
  Linking.getInitialURL()
    .then(url => { if (url) handle(url); })
    .catch(() => {});

  return () => subscription.remove();
}

// ─── UPSERTS ──────────────────────────────────────────────────────────────────
export async function upsertGlucoseEntry(entry: {
  id: string; userId: string; value: number; source: string;
  deviceName?: string; note?: string; timestamp: Date;
}): Promise<boolean> {
  const { error } = await supabase.from('glucose_entries').upsert({
    id:          entry.id,
    user_id:     entry.userId,
    value:       entry.value,
    source:      entry.source,
    device_name: entry.deviceName ?? null,
    note:        entry.note ?? null,
    completed:   true,
    timestamp:   entry.timestamp.toISOString(),
  }, { onConflict: 'id' });
  if (error) { console.warn('[Supabase] upsertGlucose:', error.message); return false; }
  return true;
}

export async function upsertExerciseEntry(entry: {
  id: string; userId: string; activity: string;
  durationMinutes: number; note?: string; timestamp: Date;
}): Promise<boolean> {
  const { error } = await supabase.from('exercise_entries').upsert({
    id:               entry.id,
    user_id:          entry.userId,
    activity:         entry.activity,
    duration_minutes: entry.durationMinutes,
    note:             entry.note ?? null,
    completed:        true,
    timestamp:        entry.timestamp.toISOString(),
  }, { onConflict: 'id' });
  if (error) { console.warn('[Supabase] upsertExercise:', error.message); return false; }
  return true;
}

export async function upsertMealEntry(entry: {
  id: string; userId: string; name: string; category: string;
  calories: number; carbs: number; protein: number; fat: number;
  imageUri?: string; timestamp: Date;
}): Promise<boolean> {
  const { error } = await supabase.from('meal_entries').upsert({
    id:        entry.id,
    user_id:   entry.userId,
    name:      entry.name,
    category:  entry.category,
    calories:  entry.calories,
    carbs:     entry.carbs,
    protein:   entry.protein,
    fat:       entry.fat,
    image_uri: entry.imageUri ?? null,
    completed: true,
    timestamp: entry.timestamp.toISOString(),
  }, { onConflict: 'id' });
  if (error) { console.warn('[Supabase] upsertMeal:', error.message); return false; }
  return true;
}

export async function upsertMedicationEntry(entry: {
  id: string; userId: string; medName: string; medType: string;
  dosage: string; zone?: string; timestamp: Date;
}): Promise<boolean> {
  const { error } = await supabase.from('medication_entries').upsert({
    id:        entry.id,
    user_id:   entry.userId,
    med_name:  entry.medName,
    med_type:  entry.medType,
    dosage:    entry.dosage,
    zone:      entry.zone ?? null,
    completed: true,
    timestamp: entry.timestamp.toISOString(),
  }, { onConflict: 'id' });
  if (error) { console.warn('[Supabase] upsertMedication:', error.message); return false; }
  return true;
}

export async function upsertDocument(doc: {
  id: string; userId: string; name: string; type: string; uri: string;
  sizeBytes?: number; tags?: string; description?: string; uploadedAt: Date;
}): Promise<boolean> {
  const { error } = await supabase.from('repository_documents').upsert({
    id:          doc.id,
    user_id:     doc.userId,
    name:        doc.name,
    type:        doc.type,
    uri:         doc.uri,
    size_bytes:  doc.sizeBytes ?? 0,
    tags:        doc.tags ?? null,
    description: doc.description ?? null,
    uploaded_at: doc.uploadedAt.toISOString(),
  }, { onConflict: 'id' });
  if (error) { console.warn('[Supabase] upsertDocument:', error.message); return false; }
  return true;
}

export async function insertSosAlert(alert: {
  userId: string; alertType: string; glucoseVal?: number;
  latitude?: number; longitude?: number; mapsUrl?: string;
  contactName?: string; messageBody?: string;
}): Promise<boolean> {
  const { error } = await supabase.from('emergency_alerts').insert({
    user_id:      alert.userId,
    alert_type:   alert.alertType,
    glucose_val:  alert.glucoseVal  ?? null,
    latitude:     alert.latitude    ?? null,
    longitude:    alert.longitude   ?? null,
    maps_url:     alert.mapsUrl     ?? null,
    contact_name: alert.contactName ?? null,
    message_body: alert.messageBody ?? null,
  });
  if (error) { console.warn('[Supabase] insertSosAlert:', error.message); return false; }
  return true;
}
// ─── LIMPIAR SESIÓN MANUALMENTE ───────────────────────────────────────────────
// Llama esto desde cualquier pantalla cuando detectes el error de refresh token.
// Ejemplo de uso en un componente:
//   import { forceSignOut } from '@/service/supabaseClient';
//   await forceSignOut();
//   router.replace('/login');
export async function forceSignOut(): Promise<void> {
  try { await supabase.auth.signOut(); } catch {}
  await clearSupabaseStorage();
  try {
    const { db_logout } = require('@/service/database');
    db_logout();
  } catch {}
}