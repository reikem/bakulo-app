/**
 * utils/inputValidator.ts
 *
 * Validadores y sanitizadores para todos los inputs de la app.
 * Previene XSS, SQL injection y datos malformados.
 */

// ─── SANITIZACIÓN ─────────────────────────────────────────────────────────────

export const sanitize = {
    /** Texto general: elimina HTML y limita longitud */
    text: (v: string, max = 500): string =>
      v.trim().slice(0, max)
       .replace(/[<>]/g, '')
       .replace(/javascript:/gi, '')
       .replace(/on\w+\s*=/gi, ''),
  
    /** Email: lowercase + trim + máximo RFC 5321 */
    email: (v: string): string =>
      v.trim().toLowerCase().slice(0, 254),
  
    /** Username: solo alfanumérico y guiones bajos */
    username: (v: string): string =>
      v.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30),
  
    /** Número: solo dígitos */
    number: (v: string): string =>
      v.replace(/[^0-9.]/g, '').slice(0, 10),
  
    /** Teléfono: solo dígitos y + */
    phone: (v: string): string =>
      v.replace(/[^0-9+\-\s]/g, '').slice(0, 20),
  
    /** UUID: solo hex y guiones */
    uuid: (v: string): string =>
      v.replace(/[^0-9a-f\-]/gi, '').slice(0, 36),
  
    /** Nota médica: permite más caracteres pero limita HTML */
    medicalNote: (v: string): string =>
      v.trim().slice(0, 2000)
       .replace(/<script[^>]*>.*?<\/script>/gi, '')
       .replace(/<[^>]+>/g, ''),
  };
  
  // ─── VALIDADORES ──────────────────────────────────────────────────────────────
  
  export const validate = {
    email: (v: string): { ok: boolean; error?: string } => {
      if (!v.trim()) return { ok: false, error: 'El correo es requerido.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
        return { ok: false, error: 'Ingresa un correo válido.' };
      if (v.length > 254) return { ok: false, error: 'Correo demasiado largo.' };
      return { ok: true };
    },
  
    password: (v: string): { ok: boolean; error?: string } => {
      if (!v) return { ok: false, error: 'La contraseña es requerida.' };
      if (v.length < 6) return { ok: false, error: 'Mínimo 6 caracteres.' };
      if (v.length > 128) return { ok: false, error: 'Contraseña demasiado larga.' };
      return { ok: true };
    },
  
    passwordStrong: (v: string): { ok: boolean; error?: string } => {
      if (!v) return { ok: false, error: 'La contraseña es requerida.' };
      if (v.length < 8)           return { ok: false, error: 'Mínimo 8 caracteres.' };
      if (!/[A-Z]/.test(v))       return { ok: false, error: 'Necesita al menos una mayúscula.' };
      if (!/[0-9]/.test(v))       return { ok: false, error: 'Necesita al menos un número.' };
      if (!/[^A-Za-z0-9]/.test(v)) return { ok: false, error: 'Necesita al menos un símbolo.' };
      const weak = ['123456','password','qwerty','111111','abc123'];
      if (weak.some(p => v.toLowerCase().includes(p)))
        return { ok: false, error: 'Contraseña demasiado común.' };
      return { ok: true };
    },
  
    username: (v: string): { ok: boolean; error?: string } => {
      if (!v.trim()) return { ok: false, error: 'El usuario es requerido.' };
      if (v.length < 3) return { ok: false, error: 'Mínimo 3 caracteres.' };
      if (v.length > 30) return { ok: false, error: 'Máximo 30 caracteres.' };
      if (!/^[a-z0-9_]+$/.test(v))
        return { ok: false, error: 'Solo letras minúsculas, números y _' };
      return { ok: true };
    },
  
    name: (v: string): { ok: boolean; error?: string } => {
      if (!v.trim()) return { ok: false, error: 'El nombre es requerido.' };
      if (v.trim().length < 2) return { ok: false, error: 'Mínimo 2 caracteres.' };
      if (v.length > 100) return { ok: false, error: 'Nombre demasiado largo.' };
      return { ok: true };
    },
  
    glucoseValue: (v: number): { ok: boolean; error?: string } => {
      if (isNaN(v) || v <= 0)  return { ok: false, error: 'Valor de glucosa inválido.' };
      if (v < 20)   return { ok: false, error: 'Valor demasiado bajo (mín. 20 mg/dL).' };
      if (v > 600)  return { ok: false, error: 'Valor demasiado alto (máx. 600 mg/dL).' };
      return { ok: true };
    },
  
    required: (v: string, label = 'Este campo'): { ok: boolean; error?: string } => {
      if (!v.trim()) return { ok: false, error: `${label} es requerido.` };
      return { ok: true };
    },
  
    url: (v: string): { ok: boolean; error?: string } => {
      try {
        const url = new URL(v);
        if (!['http:', 'https:'].includes(url.protocol))
          return { ok: false, error: 'URL debe usar http o https.' };
        return { ok: true };
      } catch {
        return { ok: false, error: 'URL inválida.' };
      }
    },
  };
  
  // ─── HELPER: validar formulario completo ──────────────────────────────────────
  
  type ValidationRules = Record<string, () => { ok: boolean; error?: string }>;
  
  export function validateForm(rules: ValidationRules): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    for (const [field, rule] of Object.entries(rules)) {
      const result = rule();
      if (!result.ok) errors[field] = result.error ?? 'Campo inválido.';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }