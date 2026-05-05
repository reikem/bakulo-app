/**
 * service/authService.ts — v2
 *
 * FIX v2:
 *   ✅ Eliminado expo-auth-session (requería ExpoCrypto nativo — incompatible con Expo Go)
 *   ✅ OAuth Google/Apple usa supabase.auth.signInWithOAuth + Linking directamente
 *   ✅ Sin imports problemáticos — funciona en Expo Go sin rebuild
 */

import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import { supabase, AUTH_CALLBACK } from '@/service/supabaseClient';
import {
  db_registerUser,
  db_validateUser,
  db_setCurrentUser,
  db_getCurrentUser,
  db_logout,
  db_changePassword,
  db_logSecurityEvent,
  AppUser,
} from '@/service/database';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  user?: AppUser;
  error?: string;
  needsVerification?: boolean;
}

export interface RegisterParams {
  displayName: string;
  username:    string;
  email:       string;
  password:    string;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function authLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Email no verificado
      if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('email_not_confirmed')
      ) {
        return {
          success:           false,
          needsVerification: true,
          error:             'Debes verificar tu correo antes de ingresar.',
        };
      }

      // Credenciales incorrectas → intento offline SQLite
      const localUser = db_validateUser(email.trim().toLowerCase(), password);
      if (localUser) {
        db_setCurrentUser(localUser);
        db_logSecurityEvent('login');
        return { success: true, user: localUser };
      }

      return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const supaUser = data.user;
    const meta     = supaUser?.user_metadata ?? {};

    const user: AppUser = {
      id:          supaUser!.id,
      username:    meta.username     ?? email.split('@')[0],
      displayName: meta.display_name ?? meta.full_name ?? email.split('@')[0],
      email:       supaUser!.email   ?? email,
      activated:   !!supaUser!.email_confirmed_at,
    };

    db_setCurrentUser(user);
    db_logSecurityEvent('login');
    return { success: true, user };

  } catch {
    // Sin red → SQLite offline
    const localUser = db_validateUser(email.trim().toLowerCase(), password);
    if (localUser) {
      db_setCurrentUser(localUser);
      db_logSecurityEvent('login');
      return { success: true, user: localUser };
    }
    return { success: false, error: 'Sin conexión y no hay sesión local guardada.' };
  }
}

// ─── REGISTRO ─────────────────────────────────────────────────────────────────

export async function authRegister(params: RegisterParams): Promise<AuthResult> {
  try {
    // 1. SQLite local primero (funciona offline)
    const localResult = db_registerUser({
      username:    params.username,
      password:    params.password,
      displayName: params.displayName,
      email:       params.email,
    });

    if (!localResult) {
      return { success: false, error: 'Este correo o nombre de usuario ya está en uso.' };
    }

    // 2. Supabase Auth — envía email de activación automáticamente
    const { error } = await supabase.auth.signUp({
      email:    params.email,
      password: params.password,
      options:  {
        data: {
          display_name: params.displayName,
          username:     params.username,
        },
        emailRedirectTo: AUTH_CALLBACK,   // serenity://auth/callback
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Este correo ya tiene una cuenta registrada.' };
      }
      // Fallo Supabase sin red → usuario quedó en SQLite igualmente
      console.warn('[authRegister] Supabase:', error.message);
    }

    db_logSecurityEvent('register');
    return { success: true, user: localResult.user };

  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error al registrar.' };
  }
}

// ─── OAUTH GOOGLE ─────────────────────────────────────────────────────────────
//
// Sin expo-auth-session. Abre el URL de Supabase OAuth en el navegador del sistema.
// El deep link serenity://auth/callback devuelve los tokens y setupDeepLinkHandler
// los captura en _layout.tsx.
//
// Para un flujo in-app más pulido en producción (build nativo) se puede agregar
// expo-auth-session sin problema, ya que el módulo nativo estará disponible.

export async function authWithGoogle(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: AUTH_CALLBACK, skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      return { success: false, error: error?.message ?? 'No se pudo iniciar Google.' };
    }

    // Abre el navegador del sistema — el resultado vuelve por deep link
    await Linking.openURL(data.url);

    // La sesión se establece en setupDeepLinkHandler (_layout.tsx)
    // Devolvemos success: false aquí para no navegar todavía
    return { success: false, error: '_OAUTH_REDIRECT_' };

  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error con Google.' };
  }
}

// ─── OAUTH APPLE ──────────────────────────────────────────────────────────────

export async function authWithApple(): Promise<AuthResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign In solo disponible en iOS.' };
  }

  try {
    // expo-apple-authentication funciona sin expo-crypto
    const AppleAuth = await import('expo-apple-authentication');

    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { success: false, error: 'No se recibió token de Apple.' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token:    credential.identityToken,
    });

    if (error) return { success: false, error: error.message };

    const supaUser    = data.user;
    const fullName    = credential.fullName;
    const displayName = [fullName?.givenName, fullName?.familyName]
      .filter(Boolean).join(' ') || supaUser?.email?.split('@')[0] || 'Usuario';

    const user: AppUser = {
      id:          supaUser!.id,
      username:    supaUser!.id.slice(0, 8),
      displayName,
      email:       supaUser!.email,
      activated:   true,
    };

    db_setCurrentUser(user);
    db_logSecurityEvent('login');
    return { success: true, user };

  } catch (e: any) {
    if (e?.code === 'ERR_CANCELED') return { success: false, error: 'Cancelado.' };
    return { success: false, error: e?.message ?? 'Error con Apple.' };
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export async function authLogout(): Promise<void> {
  try { await supabase.auth.signOut(); } catch { /* sin red */ }
  db_logout();
}

// ─── RESET DE CONTRASEÑA ──────────────────────────────────────────────────────

export async function authResetPassword(email: string): Promise<AuthResult> {
  try {
    await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: AUTH_CALLBACK }
    );
  } catch { /* no revelar si email existe */ }
  return { success: true };
}

// ─── CAMBIAR CONTRASEÑA ───────────────────────────────────────────────────────

export async function authUpdatePassword(params: {
  currentPassword: string;
  newPassword:     string;
}): Promise<AuthResult> {
  try {
    const localUser = db_getCurrentUser();

    if (localUser) {
      const ok = db_changePassword({
        userId:          localUser.id,
        currentPassword: params.currentPassword,
        newPassword:     params.newPassword,
      });
      if (!ok) return { success: false, error: 'La contraseña actual es incorrecta.' };
    }

    const { error } = await supabase.auth.updateUser({ password: params.newPassword });
    if (error) console.warn('[authUpdatePassword]', error.message);

    db_logSecurityEvent('password_change');
    return { success: true };

  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error al cambiar contraseña.' };
  }
}

// ─── REENVIAR VERIFICACIÓN ────────────────────────────────────────────────────

export async function authResendVerification(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type:    'signup',
      email:   email.trim().toLowerCase(),
      options: { emailRedirectTo: AUTH_CALLBACK },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error al reenviar.' };
  }
}

// ─── USUARIO ACTUAL ───────────────────────────────────────────────────────────

export async function authGetCurrentUser(): Promise<AppUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const meta = user.user_metadata ?? {};
      return {
        id:          user.id,
        username:    meta.username     ?? user.email?.split('@')[0] ?? '',
        displayName: meta.display_name ?? meta.full_name ?? '',
        email:       user.email,
        avatarUrl:   meta.avatar_url,
        activated:   !!user.email_confirmed_at,
      };
    }
  } catch { /* sin red */ }
  return db_getCurrentUser();
}

export function authGetCurrentUserSync(): AppUser | null {
  return db_getCurrentUser();
}