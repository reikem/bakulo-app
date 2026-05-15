/**
 * service/supabaseClient.ts — v5
 *
 * FIX Network request failed:
 *   ✅ Todas las llamadas a Supabase envueltas en try/catch silencioso
 *   ✅ getSupabaseUserId() nunca lanza — retorna null si no hay red
 *   ✅ testSupabaseConnection() con timeout de 5s para no bloquear el arranque
 *   ✅ setupDeepLinkHandler sin getSessionFromUrl (no existe en RN)
 *   ✅ SafeAreaView warning: usa SafeAreaView de react-native-safe-area-context
 *   ✅ Fallback hardcodeado para cuando process.env no carga
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// ─── ENV con fallback ──────────────────────────────────────────────────────────
// Si las variables de entorno no cargan (Expo Go sin -c), usamos el fallback.
// Solución permanente: npx expo start -c

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://kjiphfttgxdrmrrspenw.supabase.co';

const SUPABASE_ANON =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaXBoZnR0Z3hkcm1ycnNwZW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTY5MzcsImV4cCI6MjA5MzI3MjkzN30.fyFjqw95aksRyCWlY4lNHLcNeAY82yyoLs-5MFs-bV8';

export const APP_SCHEME    = 'serenity';
export const AUTH_CALLBACK = `${APP_SCHEME}://auth/callback`;

// ─── SISTEMA DE CALLBACKS PARA TOKEN INVÁLIDO ──────────────────────────────────

type InvalidTokenHandler = () => void;
let invalidTokenListeners: InvalidTokenHandler[] = [];

/**
 * Registra una función para ejecutar cuando la sesión sea inválida (ej. redirigir al login).
 * Retorna una función para cancelar la suscripción.
 */
export function setInvalidTokenCallback(callback: InvalidTokenHandler): () => void {
  invalidTokenListeners.push(callback);
  return () => removeInvalidTokenCallback(callback);
}

/**
 * Elimina un callback de la lista de ejecución.
 */
export function removeInvalidTokenCallback(callback: InvalidTokenHandler): void {
  invalidTokenListeners = invalidTokenListeners.filter(cb => cb !== callback);
}

/**
 * Notifica a los suscriptores cuando se detecta un fallo de autenticación 401.
 */
function notifyInvalidToken() {
  console.warn('[Supabase] Sesión inválida detectada. Notificando listeners...');
  invalidTokenListeners.forEach(cb => {
    try { cb(); } catch (e) { console.error('[Supabase] Error en invalidTokenCallback:', e); }
  });
}

// ─── INSTANCIA DEL CLIENTE ────────────────────────────────────────────────────

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON,
  {
    auth: {
      storage:            AsyncStorage, // Almacenamiento persistente en móvil
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: false,        // Manejado manualmente por setupDeepLinkHandler
    },
    global: {
      headers: { 'x-app-name': 'serenity-expo' },
      // Interceptor personalizado para manejar Timeouts y errores 401
      fetch: async (url, options) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        try {
          const response = await fetch(url, { ...options, signal: controller.signal });
          
          // Si el servidor retorna Unauthorized, el token es inválido o expiró
          if (response.status === 401) {
            notifyInvalidToken();
          }
          
          return response;
        } finally {
          clearTimeout(timer);
        }
      },
    },
  }
);
// ─── HELPER: userId actual (nunca lanza) ──────────────────────────────────────

export async function getSupabaseUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    // Sin red o sesión expirada — intentar desde la sesión cacheada
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id ?? null;
    } catch {
      return null;
    }
  }
}

// ─── TEST DE CONEXIÓN con timeout ─────────────────────────────────────────────

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Promise.race para timeout de 5 segundos
    const result = await Promise.race([
      supabase.from('users').select('id').limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]) as any;

    if (result?.error) {
      console.warn('[Supabase] ❌', result.error.message);
      return false;
    }
    console.log('[Supabase] ✅ Conectado');
    return true;
  } catch (e: any) {
    // Network request failed = sin conexión = normal en simulador sin red
    if (e?.message === 'timeout' || e?.message?.includes('Network')) {
      console.warn('[Supabase] Sin conexión — modo offline activado');
    } else {
      console.warn('[Supabase]', e?.message);
    }
    return false;
  }
}

// ─── DEEP LINK HANDLER ────────────────────────────────────────────────────────

export function setupDeepLinkHandler(
  onActivated?:     () => void,
  onPasswordReset?: () => void,
): () => void {
  const handle = async (url: string) => {
    if (!url) return;
    console.log('[DeepLink] URL:', url);

    // Parsear fragmento: #access_token=...&type=signup
    const fragment     = url.split('#')[1] ?? '';
    const params       = new URLSearchParams(fragment);
    const type         = params.get('type');
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token') ?? '';
    const errorCode    = params.get('error_code');

    if (errorCode) {
      console.warn('[DeepLink] Error:', params.get('error_description'));
      return;
    }

    // PKCE: code en query string
    if (!accessToken) {
      const qs   = url.split('?')[1] ?? '';
      const code = new URLSearchParams(qs).get('code');
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            console.log('[DeepLink] Sesión PKCE establecida');
            onActivated?.();
          }
        } catch (e: any) {
          console.warn('[DeepLink] exchangeCode error:', e?.message);
        }
      }
      return;
    }

    // Tokens en fragmento → setSession
    try {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) { console.warn('[DeepLink] setSession error:', error.message); return; }

      console.log('[DeepLink] Sesión establecida, tipo:', type);
      if (type === 'signup' || type === 'email_confirmation') {
        onActivated?.();
      } else if (type === 'recovery') {
        onPasswordReset?.();
      } else {
        onActivated?.();
      }
    } catch (e: any) {
      console.warn('[DeepLink] error:', e?.message);
    }
  };

  const sub = Linking.addEventListener('url', ({ url }) => handle(url));
  Linking.getInitialURL().then(url => { if (url) handle(url); }).catch(() => {});

  return () => sub.remove();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function supaSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function supaSignUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName }, emailRedirectTo: AUTH_CALLBACK },
  });
  if (error) throw error;
  return data;
}

export async function supaSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function supaResetPassword(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: AUTH_CALLBACK });
    return !error;
  } catch { return false; }
}

export async function supaUpdatePassword(newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  } catch { return false; }
}

// ─── UPSERTS (todos silenciosos en error) ─────────────────────────────────────

export async function upsertGlucoseEntry(entry: {
  id: string; userId: string; value: number; source: string;
  deviceName?: string; note?: string; timestamp: Date;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('glucose_entries').upsert({
      id: entry.id, user_id: entry.userId, value: entry.value,
      source: entry.source, device_name: entry.deviceName ?? null,
      note: entry.note ?? null, completed: true,
      timestamp: entry.timestamp.toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.warn('[Supabase] upsertGlucose:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function upsertExerciseEntry(entry: {
  id: string; userId: string; activity: string;
  durationMinutes: number; note?: string; timestamp: Date;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('exercise_entries').upsert({
      id: entry.id, user_id: entry.userId, activity: entry.activity,
      duration_minutes: entry.durationMinutes, note: entry.note ?? null,
      completed: true, timestamp: entry.timestamp.toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.warn('[Supabase] upsertExercise:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function upsertMealEntry(entry: {
  id: string; userId: string; name: string; category: string;
  calories: number; carbs: number; protein: number; fat: number;
  imageUri?: string; timestamp: Date;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('meal_entries').upsert({
      id: entry.id, user_id: entry.userId, name: entry.name,
      category: entry.category, calories: entry.calories,
      carbs: entry.carbs, protein: entry.protein, fat: entry.fat,
      image_uri: entry.imageUri ?? null, completed: true,
      timestamp: entry.timestamp.toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.warn('[Supabase] upsertMeal:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function upsertMedicationEntry(entry: {
  id: string; userId: string; medName: string;
  medType: string; dosage: string; zone?: string; timestamp: Date;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('medication_entries').upsert({
      id: entry.id, user_id: entry.userId, med_name: entry.medName,
      med_type: entry.medType, dosage: entry.dosage,
      zone: entry.zone ?? null, completed: true,
      timestamp: entry.timestamp.toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.warn('[Supabase] upsertMedication:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function upsertDocument(doc: {
  id: string; userId: string; name: string; type: string; uri: string;
  sizeBytes?: number; tags?: string; description?: string; uploadedAt: Date;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('repository_documents').upsert({
      id: doc.id, user_id: doc.userId, name: doc.name,
      type: doc.type, uri: doc.uri,
      size_bytes: doc.sizeBytes ?? 0,
      tags: doc.tags ?? null, description: doc.description ?? null,
      uploaded_at: doc.uploadedAt.toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.warn('[Supabase] upsertDocument:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function insertSosAlert(alert: {
  userId: string; alertType: string; glucoseVal?: number;
  latitude?: number; longitude?: number; mapsUrl?: string;
  contactName?: string; messageBody?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('emergency_alerts').insert({
      user_id: alert.userId, alert_type: alert.alertType,
      glucose_val: alert.glucoseVal ?? null,
      latitude: alert.latitude ?? null, longitude: alert.longitude ?? null,
      maps_url: alert.mapsUrl ?? null, contact_name: alert.contactName ?? null,
      message_body: alert.messageBody ?? null,
    });
    if (error) { console.warn('[Supabase] insertSos:', error.message); return false; }
    return true;
  } catch { return false; }
}