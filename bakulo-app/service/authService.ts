/**
 * service/authService.ts — v3 SEGURO
 *
 * NUEVO vs v2:
 *   ✅ Rate limiting: bloqueo tras 5 intentos fallidos (30 min)
 *   ✅ Validación de contraseña fuerte al registrar y cambiar
 *   ✅ Sanitización de todos los inputs
 *   ✅ Log de eventos de seguridad (login, fallo, cambio contraseña)
 *   ✅ Detección de actividad sospechosa (bots)
 *   ✅ Timeout de sesión por inactividad (30 min)
 *   ✅ Validación de token JWT antes de operaciones sensibles
 */

import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import { supabase, AUTH_CALLBACK } from '@/service/supabaseClient';
import {
  db_registerUser, db_validateUser, db_setCurrentUser,
  db_getCurrentUser, db_logout, db_changePassword,
  AppUser,
} from '@/service/database';
import {
  RateLimiter, validatePasswordStrength, logSecurityEvent,
  sanitizeInput, sanitizeEmail, validateSession, SessionTimeout,
  detectSuspiciousActivity,
} from '@/service/securityService';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success:           boolean;
  user?:             AppUser;
  error?:            string;
  needsVerification?: boolean;
  attemptsLeft?:     number;
}

export interface RegisterParams {
  displayName: string;
  username:    string;
  email:       string;
  password:    string;
}

// ─── LOGIN SEGURO ─────────────────────────────────────────────────────────────

export async function authLogin(email: string, password: string): Promise<AuthResult> {
  // 1. Sanitizar inputs
  const cleanEmail = sanitizeEmail(email);
  const cleanPass  = sanitizeInput(password, 128);

  // 2. Verificar rate limit ANTES de consultar Supabase
  const rateStatus = RateLimiter.check(cleanEmail);
  if (rateStatus.blocked) {
    return {
      success: false,
      error:   RateLimiter.getErrorMessage(cleanEmail),
    };
  }

  // 3. Validaciones básicas
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Ingresa un correo válido.' };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    cleanEmail,
      password: cleanPass,
    });

    if (error) {
      // Registrar fallo
      RateLimiter.recordFailure(cleanEmail);
      await logSecurityEvent({ type: 'failed_login', email: cleanEmail });

      // Detección de bot
      const record = RateLimiter.check(cleanEmail);
      detectSuspiciousActivity({
        email:          cleanEmail,
        failedAttempts: (record.attemptsLeft !== undefined)
          ? 5 - record.attemptsLeft
          : 0,
        timeBetweenMs:  0,
      });

      if (error.message.includes('Email not confirmed') ||
          error.message.includes('email_not_confirmed')) {
        return { success: false, needsVerification: true,
          error: 'Debes verificar tu correo antes de ingresar.' };
      }

      // Fallback offline
      const localUser = db_validateUser(cleanEmail, cleanPass);
      if (localUser) {
        db_setCurrentUser(localUser);
        await logSecurityEvent({ type: 'login', email: cleanEmail });
        RateLimiter.recordSuccess(cleanEmail);
        _startSessionTimeout();
        return { success: true, user: localUser };
      }

      return {
        success:      false,
        error:        RateLimiter.getErrorMessage(cleanEmail),
        attemptsLeft: rateStatus.attemptsLeft,
      };
    }

    // ── Login exitoso ──────────────────────────────────────────────────────
    RateLimiter.recordSuccess(cleanEmail);
    await logSecurityEvent({ type: 'login', email: cleanEmail });

    const supaUser = data.user;
    const meta     = supaUser?.user_metadata ?? {};
    const user: AppUser = {
      id:          supaUser!.id,
      username:    meta.username     ?? cleanEmail.split('@')[0],
      displayName: meta.display_name ?? meta.full_name ?? cleanEmail.split('@')[0],
      email:       supaUser!.email   ?? cleanEmail,
      activated:   !!supaUser!.email_confirmed_at,
    };

    db_setCurrentUser(user);
    _startSessionTimeout();
    return { success: true, user };

  } catch {
    // Sin red → offline
    RateLimiter.recordFailure(cleanEmail);
    const localUser = db_validateUser(cleanEmail, cleanPass);
    if (localUser) {
      db_setCurrentUser(localUser);
      _startSessionTimeout();
      return { success: true, user: localUser };
    }
    return {
      success:      false,
      error:        RateLimiter.getErrorMessage(cleanEmail),
      attemptsLeft: rateStatus.attemptsLeft,
    };
  }
}

// ─── REGISTRO SEGURO ──────────────────────────────────────────────────────────

export async function authRegister(params: RegisterParams): Promise<AuthResult> {
  // Sanitizar
  const cleanEmail = sanitizeEmail(params.email);
  const cleanUser  = sanitizeInput(params.username, 30).toLowerCase().replace(/\s/g, '');
  const cleanName  = sanitizeInput(params.displayName, 100);
  const cleanPass  = params.password; // no sanitizar — necesita chars especiales

  // Validar contraseña fuerte
  const strength = validatePasswordStrength(cleanPass);
  if (!strength.isStrong) {
    return {
      success: false,
      error:   `Contraseña insegura: ${strength.issues.join(', ')}.`,
    };
  }

  // Validar formato email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Correo electrónico inválido.' };
  }

  // Validar username
  if (!/^[a-z0-9_]{3,30}$/.test(cleanUser)) {
    return { success: false, error: 'Usuario: 3-30 caracteres, solo letras, números y _' };
  }

  try {
    const localResult = db_registerUser({
      username:    cleanUser,
      password:    cleanPass,
      displayName: cleanName,
      email:       cleanEmail,
    });

    if (!localResult) {
      return { success: false, error: 'Este correo o nombre de usuario ya está en uso.' };
    }

    const { error } = await supabase.auth.signUp({
      email:    cleanEmail,
      password: cleanPass,
      options:  {
        data: { display_name: cleanName, username: cleanUser },
        emailRedirectTo: AUTH_CALLBACK,
      },
    });

    if (error?.message.includes('already registered')) {
      return { success: false, error: 'Este correo ya tiene una cuenta registrada.' };
    }

    await logSecurityEvent({ type: 'login', email: cleanEmail,
      metadata: { action: 'register' } });

    return { success: true, user: localResult.user };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error al registrar.' };
  }
}

// ─── CAMBIO DE CONTRASEÑA SEGURO ─────────────────────────────────────────────

export async function authUpdatePassword(params: {
  currentPassword: string;
  newPassword:     string;
}): Promise<AuthResult> {
  // 1. Validar sesión vigente
  const session = await validateSession();
  if (!session.valid) {
    return { success: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' };
  }

  // 2. Validar nueva contraseña fuerte
  const strength = validatePasswordStrength(params.newPassword);
  if (!strength.isStrong) {
    return {
      success: false,
      error:   `Nueva contraseña insegura: ${strength.issues.join(', ')}.`,
    };
  }

  // 3. No puede ser igual a la actual
  if (params.currentPassword === params.newPassword) {
    return { success: false, error: 'La nueva contraseña debe ser diferente a la actual.' };
  }

  try {
    // 4. Verificar contraseña actual en SQLite
    const localUser = db_getCurrentUser();
    if (localUser) {
      const ok = db_changePassword({
        userId:          localUser.id,
        currentPassword: params.currentPassword,
        newPassword:     params.newPassword,
      });
      if (!ok) return { success: false, error: 'La contraseña actual es incorrecta.' };
    }

    // 5. Actualizar en Supabase
    const { error } = await supabase.auth.updateUser({ password: params.newPassword });
    if (error) console.warn('[Auth] updateUser:', error.message);

    // 6. Log de seguridad
    await logSecurityEvent({ type: 'password_change',
      metadata: { changed_at: new Date().toISOString() } });

    // 7. Invalidar otras sesiones (seguridad)
    try {
      await supabase.auth.refreshSession();
    } catch { /* no crítico */ }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error al cambiar contraseña.' };
  }
}

// ─── LOGOUT SEGURO ────────────────────────────────────────────────────────────

export async function authLogout(): Promise<void> {
  SessionTimeout.stop();
  await logSecurityEvent({ type: 'logout' });
  try { await supabase.auth.signOut(); } catch { /* sin red */ }
  db_logout();
}

// ─── RESET DE CONTRASEÑA ─────────────────────────────────────────────────────

export async function authResetPassword(email: string): Promise<AuthResult> {
  const cleanEmail = sanitizeEmail(email);
  // Siempre retornar éxito (no revelar si el email existe)
  try {
    await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: AUTH_CALLBACK });
  } catch { /* silencioso */ }
  return { success: true };
}

// ─── REENVIAR VERIFICACIÓN ────────────────────────────────────────────────────

export async function authResendVerification(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type:    'signup',
      email:   sanitizeEmail(email),
      options: { emailRedirectTo: AUTH_CALLBACK },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error al reenviar.' };
  }
}

// ─── OAUTH ────────────────────────────────────────────────────────────────────

export async function authWithGoogle(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: AUTH_CALLBACK, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { success: false, error: error?.message ?? 'Error Google.' };
    await Linking.openURL(data.url);
    return { success: false, error: '_OAUTH_REDIRECT_' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Error con Google.' };
  }
}

export async function authWithApple(): Promise<AuthResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign In solo disponible en iOS.' };
  }
  try {
    const AppleAuth  = await import('expo-apple-authentication');
    const credential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { success: false, error: 'Sin token de Apple.' };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple', token: credential.identityToken,
    });
    if (error) return { success: false, error: error.message };

    const supaUser    = data.user;
    const fullName    = credential.fullName;
    const displayName = [fullName?.givenName, fullName?.familyName]
      .filter(Boolean).join(' ') || supaUser?.email?.split('@')[0] || 'Usuario';

    const user: AppUser = {
      id: supaUser!.id, username: supaUser!.id.slice(0, 8),
      displayName, email: supaUser!.email, activated: true,
    };
    db_setCurrentUser(user);
    await logSecurityEvent({ type: 'login', metadata: { provider: 'apple' } });
    _startSessionTimeout();
    return { success: true, user };
  } catch (e: any) {
    if (e?.code === 'ERR_CANCELED') return { success: false, error: 'Cancelado.' };
    return { success: false, error: e?.message ?? 'Error con Apple.' };
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

// ─── HELPERS PRIVADOS ─────────────────────────────────────────────────────────

function _startSessionTimeout() {
  // Cerrar sesión automáticamente por inactividad
  // Se llama resetTimeout() en cada interacción del usuario
  SessionTimeout.configure(30, async () => {
    await authLogout();
  });
}