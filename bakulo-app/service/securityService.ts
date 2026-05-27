/**
 * service/securityService.ts — v1
 *
 * Seguridad completa para Serenity:
 *   ✅ Token JWT validado en cada request a Supabase (automático via SDK)
 *   ✅ Rate limiting local: bloqueo temporal tras 5 intentos fallidos
 *   ✅ Detección de sesiones sospechosas
 *   ✅ Registro de eventos de seguridad
 *   ✅ Validación de contraseña fuerte
 *   ✅ Hash de contraseña local (SQLite) con salt
 *   ✅ Protección contra inyección SQL (ya usa params)
 *   ✅ Timeout de sesión por inactividad
 */

import { supabase } from './supabaseClient';
import { db_logSecurityEvent, getDb } from './database';
import * as Crypto from 'expo-crypto';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface SecurityEvent {
  type:     'login' | 'failed_login' | 'password_change' | 'logout' | 'suspicious';
  email?:   string;
  metadata?: Record<string, any>;
}

export interface PasswordStrength {
  score:      0 | 1 | 2 | 3 | 4;
  label:      string;
  color:      string;
  issues:     string[];
  isStrong:   boolean;
}

// ─── RATE LIMITER LOCAL ───────────────────────────────────────────────────────
// Bloquea temporalmente después de N intentos fallidos
// Funciona offline — no depende de Supabase

const _failedAttempts: Map<string, { count: number; firstAttempt: number; blockedUntil?: number }> = new Map();

const RATE_LIMIT = {
  maxAttempts:    5,           // intentos antes de bloquear
  windowMs:       15 * 60000, // ventana de 15 minutos
  blockDurationMs: 30 * 60000, // bloqueo de 30 minutos
};

export const RateLimiter = {
  /**
   * Verifica si el email está bloqueado.
   * Retorna { blocked: false } si puede intentar,
   * { blocked: true, remainingMs } si debe esperar.
   */
  check(email: string): { blocked: boolean; remainingMs?: number; attemptsLeft?: number } {
    const key     = email.toLowerCase().trim();
    const record  = _failedAttempts.get(key);
    const now     = Date.now();

    if (!record) return { blocked: false, attemptsLeft: RATE_LIMIT.maxAttempts };

    // ¿Está bloqueado?
    if (record.blockedUntil && now < record.blockedUntil) {
      return { blocked: true, remainingMs: record.blockedUntil - now };
    }

    // ¿Venció la ventana de tiempo?
    if (now - record.firstAttempt > RATE_LIMIT.windowMs) {
      _failedAttempts.delete(key);
      return { blocked: false, attemptsLeft: RATE_LIMIT.maxAttempts };
    }

    const attemptsLeft = Math.max(0, RATE_LIMIT.maxAttempts - record.count);
    return { blocked: false, attemptsLeft };
  },

  /** Registra un intento fallido */
  recordFailure(email: string): void {
    const key    = email.toLowerCase().trim();
    const now    = Date.now();
    const record = _failedAttempts.get(key);

    if (!record) {
      _failedAttempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    // Reiniciar si venció la ventana
    if (now - record.firstAttempt > RATE_LIMIT.windowMs) {
      _failedAttempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    const newCount = record.count + 1;
    if (newCount >= RATE_LIMIT.maxAttempts) {
      _failedAttempts.set(key, {
        ...record,
        count:        newCount,
        blockedUntil: now + RATE_LIMIT.blockDurationMs,
      });
      console.warn(`[Security] Email ${key} bloqueado por 30 minutos`);
    } else {
      _failedAttempts.set(key, { ...record, count: newCount });
    }
  },

  /** Limpia el contador tras login exitoso */
  recordSuccess(email: string): void {
    _failedAttempts.delete(email.toLowerCase().trim());
  },

  /** Mensaje de error apropiado según el estado */
  getErrorMessage(email: string): string {
    const status = this.check(email);
    if (!status.blocked) {
      const left = status.attemptsLeft ?? 0;
      if (left <= 2) return `Credenciales incorrectas. ${left} intento(s) restante(s) antes del bloqueo.`;
      return 'Usuario o contraseña incorrectos.';
    }
    const mins = Math.ceil((status.remainingMs ?? 0) / 60000);
    return `Cuenta bloqueada temporalmente. Intenta en ${mins} minuto(s).`;
  },
};

// ─── VALIDADOR DE CONTRASEÑA FUERTE ───────────────────────────────────────────

export function validatePasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];

  if (password.length < 8)           issues.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password))       issues.push('Al menos una mayúscula');
  if (!/[a-z]/.test(password))       issues.push('Al menos una minúscula');
  if (!/[0-9]/.test(password))       issues.push('Al menos un número');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Al menos un símbolo (!@#$...)');
  if (password.length < 12 && issues.length === 0) issues.push('Recomendado: 12+ caracteres');

  // Patrones débiles comunes
  const weakPatterns = ['123456', 'password', 'qwerty', '111111', 'abc123', '000000'];
  if (weakPatterns.some(p => password.toLowerCase().includes(p))) {
    issues.push('Contraseña demasiado común');
  }

  const criticalIssues = issues.filter(i => !i.startsWith('Recomendado'));
  const score = Math.max(0, 4 - criticalIssues.length) as 0|1|2|3|4;

  const labels: Record<number, string> = { 0:'Muy débil', 1:'Débil', 2:'Regular', 3:'Fuerte', 4:'Muy fuerte' };
  const colors: Record<number, string> = { 0:'#ef4444', 1:'#f97316', 2:'#eab308', 3:'#84cc16', 4:'#22c55e' };

  return {
    score,
    label:    labels[score],
    color:    colors[score],
    issues:   criticalIssues,
    isStrong: score >= 3,
  };
}

// ─── HASH DE CONTRASEÑA LOCAL ─────────────────────────────────────────────────
// Para SQLite local usamos SHA-256 con salt
// (Supabase usa bcrypt en su lado — esto es solo para la caché local)

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const usedSalt = salt ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${usedSalt}:${password}:serenity_salt_2026`
  );
  return { hash, salt: usedSalt };
}

export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// ─── REGISTRO DE EVENTOS DE SEGURIDAD ────────────────────────────────────────

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  // 1. SQLite local (siempre)
  try {
    db_logSecurityEvent(event.type as any);
  } catch { /* no crítico */ }

  // 2. Supabase (si hay conexión)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('security_events').insert({
        user_id:    user.id,
        event_type: event.type,
        metadata:   event.metadata ?? {},
      });
    }
  } catch { /* sin red — OK */ }
}

// ─── VALIDACIÓN DE TOKEN JWT ──────────────────────────────────────────────────
// Supabase SDK valida el JWT automáticamente en cada request.
// Esta función verifica manualmente si la sesión sigue vigente.

export async function validateSession(): Promise<{
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  needsRefresh?: boolean;
}> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { valid: false };
    }

    const expiresAt  = new Date(session.expires_at! * 1000);
    const now        = new Date();
    const msLeft     = expiresAt.getTime() - now.getTime();
    const needsRefresh = msLeft < 5 * 60 * 1000; // menos de 5 minutos

    if (needsRefresh) {
      // Refrescar automáticamente
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        return {
          valid:      true,
          userId:     refreshed.session.user.id,
          expiresAt:  new Date(refreshed.session.expires_at! * 1000),
          needsRefresh: false,
        };
      }
    }

    return {
      valid:      true,
      userId:     session.user.id,
      expiresAt,
      needsRefresh,
    };
  } catch {
    return { valid: false };
  }
}

// ─── TIMEOUT DE SESIÓN POR INACTIVIDAD ───────────────────────────────────────

class SessionTimeoutManager {
  private timer:       ReturnType<typeof setTimeout> | null = null;
  private onTimeout:   (() => void) | null = null;
  private timeoutMs:   number = 30 * 60 * 1000; // 30 minutos por defecto

  configure(timeoutMinutes: number, onTimeout: () => void) {
    this.timeoutMs  = timeoutMinutes * 60 * 1000;
    this.onTimeout  = onTimeout;
    this.reset();
  }

  reset() {
    if (this.timer) clearTimeout(this.timer);
    if (!this.onTimeout) return;
    this.timer = setTimeout(() => {
      console.warn('[Security] Sesión expirada por inactividad');
      this.onTimeout?.();
    }, this.timeoutMs);
  }

  stop() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
}

export const SessionTimeout = new SessionTimeoutManager();

// ─── SANITIZACIÓN DE INPUTS ───────────────────────────────────────────────────
// Protección extra contra XSS e inyección

export function sanitizeInput(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '')           // quitar HTML tags
    .replace(/javascript:/gi, '')   // quitar javascript: URIs
    .replace(/on\w+\s*=/gi, '');    // quitar event handlers
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

// ─── DETECTOR DE ACTIVIDAD SOSPECHOSA ────────────────────────────────────────

export function detectSuspiciousActivity(params: {
  email:          string;
  failedAttempts: number;
  timeBetweenMs:  number;
}): boolean {
  // Más de 3 intentos en menos de 10 segundos = bot
  if (params.failedAttempts >= 3 && params.timeBetweenMs < 10000) {
    console.warn('[Security] Actividad sospechosa detectada:', params.email);
    logSecurityEvent({
      type:     'suspicious',
      email:    params.email,
      metadata: { reason: 'rapid_attempts', ...params },
    });
    return true;
  }
  return false;
}