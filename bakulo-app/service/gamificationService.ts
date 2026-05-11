/**
 * service/gamificationService.ts — v1
 *
 * Sistema de logros, rachas y notificaciones estilo Duolingo.
 * ✅ 40+ logros con distintos niveles de dificultad
 * ✅ Sistema de rachas diarias
 * ✅ Notificaciones graciosas tipo Duolingo
 * ✅ Guardado en Supabase + SQLite local
 */

import { supabase } from './supabaseClient';
import { getDb, generateUUID } from './database';
import * as Notifications from 'expo-notifications';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type AchievementCategory =
  | 'glucosa' | 'medicacion' | 'ejercicio' | 'alimentacion'
  | 'racha'   | 'social'    | 'especial'   | 'medico';

export type AchievementDifficulty = 'bronce' | 'plata' | 'oro' | 'diamante' | 'legendario';

export interface Achievement {
  id:          string;
  name:        string;
  description: string;
  emoji:       string;
  category:    AchievementCategory;
  difficulty:  AchievementDifficulty;
  xp:          number;
  condition:   (stats: UserStats) => boolean;
  unlocked?:   boolean;
  unlockedAt?: Date;
}

export interface UserStats {
  glucoseToday:       number;   // mediciones hoy
  glucoseStreak:      number;   // días consecutivos con medición
  glucoseInRange:     number;   // % tiempo en rango
  medicationStreak:   number;   // días consecutivos tomando medicación
  exerciseDays:       number;   // días con ejercicio este mes
  totalGlucose:       number;   // total mediciones históricas
  totalMedications:   number;   // total medicaciones
  totalExercise:      number;   // total sesiones ejercicio
  currentStreak:      number;   // racha actual (días)
  longestStreak:      number;   // racha más larga
  doctorVisits:       number;   // visitas al médico registradas
  mealsLogged:        number;   // comidas registradas
  level:              number;   // nivel del usuario
  totalXP:            number;   // XP total
}

export interface StreakData {
  currentStreak:  number;
  longestStreak:  number;
  lastActivityDate: string;
  streakFrozen:   boolean;
}

// ─── 40+ LOGROS ───────────────────────────────────────────────────────────────

export const ALL_ACHIEVEMENTS: Achievement[] = [

  // ── GLUCOSA ────────────────────────────────────────────────────────────────
  {
    id: 'first_glucose', name: 'Primera Gota 🩸', emoji: '🩸',
    description: 'Registra tu primera medición de glucosa',
    category: 'glucosa', difficulty: 'bronce', xp: 50,
    condition: s => s.totalGlucose >= 1,
  },
  {
    id: 'glucose_week', name: 'Semana de Hierro 💪', emoji: '💪',
    description: 'Mide tu glucosa 7 días seguidos',
    category: 'glucosa', difficulty: 'plata', xp: 150,
    condition: s => s.glucoseStreak >= 7,
  },
  {
    id: 'glucose_month', name: 'Diabético Legendario 🏅', emoji: '🏅',
    description: 'Mide tu glucosa 30 días consecutivos',
    category: 'glucosa', difficulty: 'oro', xp: 500,
    condition: s => s.glucoseStreak >= 30,
  },
  {
    id: 'glucose_100', name: 'Centenario 💯', emoji: '💯',
    description: '100 mediciones de glucosa registradas',
    category: 'glucosa', difficulty: 'plata', xp: 200,
    condition: s => s.totalGlucose >= 100,
  },
  {
    id: 'glucose_1000', name: 'Maestro del Glucómetro 🔬', emoji: '🔬',
    description: '1000 mediciones de glucosa. ¡Eres una máquina!',
    category: 'glucosa', difficulty: 'diamante', xp: 1000,
    condition: s => s.totalGlucose >= 1000,
  },
  {
    id: 'glucose_perfect_day', name: 'Día Perfecto ⭐', emoji: '⭐',
    description: '5+ mediciones en un día, todas en rango',
    category: 'glucosa', difficulty: 'oro', xp: 300,
    condition: s => s.glucoseToday >= 5 && s.glucoseInRange >= 100,
  },
  {
    id: 'glucose_in_range_week', name: 'En la Zona 🎯', emoji: '🎯',
    description: 'Tiempo en rango > 70% durante 7 días',
    category: 'glucosa', difficulty: 'oro', xp: 400,
    condition: s => s.glucoseInRange >= 70 && s.glucoseStreak >= 7,
  },
  {
    id: 'glucose_legend', name: 'El Inmortal 🦾', emoji: '🦾',
    description: '60 días consecutivos midiendo glucosa',
    category: 'glucosa', difficulty: 'legendario', xp: 2000,
    condition: s => s.glucoseStreak >= 60,
  },

  // ── MEDICACIÓN ─────────────────────────────────────────────────────────────
  {
    id: 'first_med', name: 'Primera Dosis 💊', emoji: '💊',
    description: 'Registra tu primer medicamento',
    category: 'medicacion', difficulty: 'bronce', xp: 50,
    condition: s => s.totalMedications >= 1,
  },
  {
    id: 'med_streak_7', name: 'Puntual 7 ⏰', emoji: '⏰',
    description: '7 días sin olvidar tu medicación',
    category: 'medicacion', difficulty: 'plata', xp: 150,
    condition: s => s.medicationStreak >= 7,
  },
  {
    id: 'med_streak_30', name: 'Robot Farmacéutico 🤖', emoji: '🤖',
    description: '30 días con medicación perfecta',
    category: 'medicacion', difficulty: 'oro', xp: 500,
    condition: s => s.medicationStreak >= 30,
  },
  {
    id: 'med_streak_100', name: 'Indestructible 💎', emoji: '💎',
    description: '100 días sin olvidar medicación. ¡Leyenda!',
    category: 'medicacion', difficulty: 'legendario', xp: 2500,
    condition: s => s.medicationStreak >= 100,
  },
  {
    id: 'med_insulin_pro', name: 'Pro de la Insulina 💉', emoji: '💉',
    description: '50 registros de insulina',
    category: 'medicacion', difficulty: 'plata', xp: 200,
    condition: s => s.totalMedications >= 50,
  },

  // ── EJERCICIO ──────────────────────────────────────────────────────────────
  {
    id: 'first_exercise', name: 'Primer Paso 👟', emoji: '👟',
    description: 'Registra tu primera sesión de ejercicio',
    category: 'ejercicio', difficulty: 'bronce', xp: 75,
    condition: s => s.totalExercise >= 1,
  },
  {
    id: 'exercise_10', name: 'Deportista 🏃', emoji: '🏃',
    description: '10 sesiones de ejercicio registradas',
    category: 'ejercicio', difficulty: 'plata', xp: 200,
    condition: s => s.totalExercise >= 10,
  },
  {
    id: 'exercise_50', name: 'Atleta Serio 🏋️', emoji: '🏋️',
    description: '50 sesiones de ejercicio. ¡Impresionante!',
    category: 'ejercicio', difficulty: 'oro', xp: 500,
    condition: s => s.totalExercise >= 50,
  },
  {
    id: 'exercise_month', name: 'Mes Olímpico 🥇', emoji: '🥇',
    description: '20+ días con ejercicio en un mes',
    category: 'ejercicio', difficulty: 'diamante', xp: 800,
    condition: s => s.exerciseDays >= 20,
  },
  {
    id: 'exercise_100', name: 'Maratonista Digital 🏆', emoji: '🏆',
    description: '100 sesiones de ejercicio registradas',
    category: 'ejercicio', difficulty: 'legendario', xp: 2000,
    condition: s => s.totalExercise >= 100,
  },

  // ── RACHAS ─────────────────────────────────────────────────────────────────
  {
    id: 'streak_3', name: 'Calentando Motores 🔥', emoji: '🔥',
    description: 'Racha de 3 días',
    category: 'racha', difficulty: 'bronce', xp: 75,
    condition: s => s.currentStreak >= 3,
  },
  {
    id: 'streak_7', name: 'Semana Perfecta 🌟', emoji: '🌟',
    description: 'Racha de 7 días',
    category: 'racha', difficulty: 'plata', xp: 200,
    condition: s => s.currentStreak >= 7,
  },
  {
    id: 'streak_14', name: 'Dos Semanas de Fuego 🌋', emoji: '🌋',
    description: 'Racha de 14 días',
    category: 'racha', difficulty: 'plata', xp: 350,
    condition: s => s.currentStreak >= 14,
  },
  {
    id: 'streak_30', name: 'Mes Imparable 🚀', emoji: '🚀',
    description: 'Racha de 30 días',
    category: 'racha', difficulty: 'oro', xp: 600,
    condition: s => s.currentStreak >= 30,
  },
  {
    id: 'streak_60', name: 'Dos Meses Épico ⚡', emoji: '⚡',
    description: 'Racha de 60 días',
    category: 'racha', difficulty: 'diamante', xp: 1200,
    condition: s => s.currentStreak >= 60,
  },
  {
    id: 'streak_100', name: 'Centurión de Salud 🛡️', emoji: '🛡️',
    description: 'Racha de 100 días. ¡Increíble!',
    category: 'racha', difficulty: 'diamante', xp: 2000,
    condition: s => s.currentStreak >= 100,
  },
  {
    id: 'streak_365', name: 'Un Año Sin Rendirse 👑', emoji: '👑',
    description: 'Racha de 365 días. Eres una leyenda.',
    category: 'racha', difficulty: 'legendario', xp: 10000,
    condition: s => s.currentStreak >= 365,
  },

  // ── MÉDICO ─────────────────────────────────────────────────────────────────
  {
    id: 'first_doctor', name: 'Paciente Modelo 🩺', emoji: '🩺',
    description: 'Registra tu primera visita médica',
    category: 'medico', difficulty: 'bronce', xp: 100,
    condition: s => s.doctorVisits >= 1,
  },
  {
    id: 'doctor_5', name: 'Fan del Médico 👨‍⚕️', emoji: '👨‍⚕️',
    description: '5 visitas médicas registradas',
    category: 'medico', difficulty: 'plata', xp: 250,
    condition: s => s.doctorVisits >= 5,
  },
  {
    id: 'doctor_checkup', name: 'Control al Día ✅', emoji: '✅',
    description: 'Registra 2 atenciones de salud en el mes',
    category: 'medico', difficulty: 'plata', xp: 200,
    condition: s => s.doctorVisits >= 2,
  },

  // ── ALIMENTACIÓN ───────────────────────────────────────────────────────────
  {
    id: 'first_meal', name: '¡A Comer! 🍽️', emoji: '🍽️',
    description: 'Registra tu primera comida',
    category: 'alimentacion', difficulty: 'bronce', xp: 50,
    condition: s => s.mealsLogged >= 1,
  },
  {
    id: 'meals_50', name: 'Chef Diabético 👨‍🍳', emoji: '👨‍🍳',
    description: '50 comidas registradas',
    category: 'alimentacion', difficulty: 'plata', xp: 200,
    condition: s => s.mealsLogged >= 50,
  },
  {
    id: 'meals_200', name: 'Sommelier Nutricional 🍷', emoji: '🍷',
    description: '200 comidas registradas',
    category: 'alimentacion', difficulty: 'oro', xp: 600,
    condition: s => s.mealsLogged >= 200,
  },

  // ── NIVELES ────────────────────────────────────────────────────────────────
  {
    id: 'level_5', name: 'Aprendiz de Salud 📚', emoji: '📚',
    description: 'Alcanza el nivel 5',
    category: 'especial', difficulty: 'bronce', xp: 100,
    condition: s => s.level >= 5,
  },
  {
    id: 'level_10', name: 'Explorador de Salud 🗺️', emoji: '🗺️',
    description: 'Alcanza el nivel 10',
    category: 'especial', difficulty: 'plata', xp: 300,
    condition: s => s.level >= 10,
  },
  {
    id: 'level_25', name: 'Maestro de Salud 🎓', emoji: '🎓',
    description: 'Alcanza el nivel 25',
    category: 'especial', difficulty: 'oro', xp: 750,
    condition: s => s.level >= 25,
  },
  {
    id: 'level_50', name: 'Gurú de Salud 🧘', emoji: '🧘',
    description: 'Alcanza el nivel 50',
    category: 'especial', difficulty: 'diamante', xp: 2000,
    condition: s => s.level >= 50,
  },

  // ── ESPECIALES ─────────────────────────────────────────────────────────────
  {
    id: 'early_bird', name: 'Madrugador 🌅', emoji: '🌅',
    description: 'Registra glucosa antes de las 7am',
    category: 'especial', difficulty: 'plata', xp: 150,
    condition: s => s.glucoseToday >= 1, // se valida por hora en el trigger
  },
  {
    id: 'night_owl', name: 'Búho Nocturno 🦉', emoji: '🦉',
    description: 'Registra glucosa después de las 10pm',
    category: 'especial', difficulty: 'plata', xp: 150,
    condition: s => s.glucoseToday >= 1,
  },
  {
    id: 'all_rounder', name: 'Todo Terreno 🏅', emoji: '🏅',
    description: 'Registra glucosa, medicación, comida y ejercicio el mismo día',
    category: 'especial', difficulty: 'oro', xp: 400,
    condition: s => s.glucoseToday >= 1 && s.totalMedications >= 1 && s.mealsLogged >= 1 && s.totalExercise >= 1,
  },
  {
    id: 'comeback_kid', name: 'El Regreso 🔄', emoji: '🔄',
    description: 'Vuelve después de 3+ días sin actividad',
    category: 'especial', difficulty: 'plata', xp: 200,
    condition: s => s.currentStreak >= 1, // lógica en el trigger de racha
  },
  {
    id: 'xp_1000', name: 'Coleccionista de XP ⚡', emoji: '⚡',
    description: 'Acumula 1000 puntos de experiencia',
    category: 'especial', difficulty: 'plata', xp: 0,
    condition: s => s.totalXP >= 1000,
  },
  {
    id: 'xp_10000', name: 'Millonario de XP 💰', emoji: '💰',
    description: 'Acumula 10,000 puntos de experiencia',
    category: 'especial', difficulty: 'diamante', xp: 0,
    condition: s => s.totalXP >= 10000,
  },
];

// ─── NOTIFICACIONES TIPO DUOLINGO ─────────────────────────────────────────────

export const NOTIFICATION_MESSAGES = {
  glucose: [
    { title: '🩸 ¡Hora de pincharte!',         body: 'Tu dedo te extraña. 5 segundos y listo, campeón.' },
    { title: '📊 ¿Cómo anda el azúcar?',        body: 'Tu glucómetro tiene polvo. ¡A usarlo!' },
    { title: '🎯 Glucosa sin medir = misterio', body: 'Y los misterios de salud no son divertidos. ¡Mide ya!' },
    { title: '⚡ ¡Reto del día!',               body: 'Mide tu glucosa antes de que me ponga triste 🥺' },
    { title: '🔥 Tu racha peligra',             body: '¡No la rompas ahora que ibas tan bien!' },
    { title: '🏆 A un registro de la gloria',   body: 'Una medición más y subes de nivel. ¡Dale!' },
    { title: '😤 Se me está acabando',          body: 'La paciencia. Mide tu glucosa. YA.' },
    { title: '🧠 Dato curioso',                 body: 'Medir glucosa regularmente mejora tu control. Tú ya lo sabes 😏' },
  ],
  medication: [
    { title: '💊 ¡Tu medicamento te llama!',    body: 'Dice que se siente abandonado. ¡Tómalo!' },
    { title: '🕐 Hora de la insulina',          body: 'No la dejes esperando. Ella no olvida.' },
    { title: '🤖 Robot farmacéutico activado',  body: 'TOMAR MEDICAMENTO. AHORA. ERROR 404: excusa no encontrada.' },
    { title: '💉 ¿Ya te inyectaste?',           body: 'Porque si no... tu cuerpo se va a quejar toda la tarde.' },
    { title: '🔔 Recordatorio amistoso',        body: 'Tu medicación te necesita. Como tú necesitas el Wi-Fi.' },
    { title: '⏰ ¡Tic tac!',                    body: 'El tiempo de tomar tu medicamento es AHORA. No después. Ahora.' },
  ],
  exercise: [
    { title: '🏃 ¡A moverse!',                 body: 'Tu glucosa baja mejor con ejercicio. Tu sofá no cuenta.' },
    { title: '💪 Hoy es día de sudar',          body: '10 minutos de caminata ya es un logro. ¡Tú puedes!' },
    { title: '🧘 Cuerpo en movimiento',         body: 'Incluso Duolingo salió a caminar hoy. ¿Y tú?' },
    { title: '🦵 Tus piernas extrañan moverse', body: 'Anda. Solo un rato. Después te sientes increíble.' },
  ],
  meal: [
    { title: '🍽️ ¿Qué comiste hoy?',           body: 'Registrar comidas ayuda a entender tu glucosa. 2 minutos nada más.' },
    { title: '🥗 Hora de registrar',            body: 'Tu dieta importa más de lo que crees. ¡Anótala!' },
    { title: '🧆 ¿Almorzaste sano?',            body: 'Cuéntame qué comiste. Sin juicios, lo juro 🤝' },
  ],
  streak_at_risk: [
    { title: '🔥 ¡TU RACHA ESTÁ EN RIESGO!',    body: '¡No la rompas ahora! Solo una medición y se salva. ¡CORRE!' },
    { title: '😱 Llevas X días seguidos...',     body: '...y hoy podrías perderlo todo. No lo hagas.' },
    { title: '🚨 ALERTA MÁXIMA',                body: 'Tu racha de X días muere en pocas horas. Haz algo. AHORA.' },
  ],
  streak_milestone: [
    { title: '🔥 ¡X días de racha!',            body: '¡Eres una bestia! Sigue así y conquistas el mundo.' },
    { title: '🎉 ¡Nueva marca personal!',        body: 'X días seguidos. Tu yo del pasado no te creería.' },
    { title: '👑 ¡Racha épica!',                body: 'X días sin rendirte. Mereces todos los aplausos 👏' },
  ],
  doctor: [
    { title: '🩺 ¿Cuándo es tu próxima cita?', body: 'Registra tu cita médica en Serenity. Tu médico y tú se lo merecen.' },
    { title: '📅 Control médico pendiente',     body: 'No olvides tu cita. Los controles regulares salvan vidas.' },
  ],
  achievement: [
    { title: '🏆 ¡Nuevo logro desbloqueado!',   body: 'Conseguiste: {name}. ¡Eres increíble!' },
    { title: '⭐ ¡LOGRO ÉPICO!',               body: '"{name}" es tuyo. Tu esfuerzo vale mucho.' },
  ],
  late_night: [
    { title: '🦉 Son las {hour}... ¿mediste?', body: 'Sé que es tarde. Pero mide la glucosa antes de dormir 😴' },
    { title: '🌙 Buenas noches y...',           body: '...¿ya registraste todo? 5 minutitos y duermes tranquilo.' },
  ],
  morning: [
    { title: '🌅 ¡Buenos días, campeón!',       body: 'El día empieza con glucosa en ayunas. ¡A por ello!' },
    { title: '☀️ Un nuevo día, una nueva racha', body: 'Empieza bien el día: mide tu azúcar en ayunas.' },
  ],
};

// ─── SERVICIO PRINCIPAL ───────────────────────────────────────────────────────

class GamificationServiceClass {

  // ── Configurar notificaciones ──────────────────────────────────────────────
  async setupNotifications(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return false;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge:  true,
        }),
      });

      await this.scheduleAllNotifications();
      return true;
    } catch { return false; }
  }

  // ── Programar todas las notificaciones diarias ────────────────────────────
  async scheduleAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Glucosa: 7am, 12pm, 7pm, 10pm
      const glucoseHours = [7, 12, 19, 22];
      for (const hour of glucoseHours) {
        const msgs  = NOTIFICATION_MESSAGES.glucose;
        const msg   = msgs[Math.floor(Math.random() * msgs.length)];
        await Notifications.scheduleNotificationAsync({
          content: { title: msg.title, body: msg.body, sound: true },
          trigger: { hour, minute: 0, repeats: true } as any,
        });
      }

      // Medicación: 8am y 9pm
      const medHours = [8, 21];
      for (const hour of medHours) {
        const msgs = NOTIFICATION_MESSAGES.medication;
        const msg  = msgs[Math.floor(Math.random() * msgs.length)];
        await Notifications.scheduleNotificationAsync({
          content: { title: msg.title, body: msg.body, sound: true },
          trigger: { hour, minute: 0, repeats: true } as any,
        });
      }

      // Ejercicio: 6pm
      const exMsg = NOTIFICATION_MESSAGES.exercise[Math.floor(Math.random() * NOTIFICATION_MESSAGES.exercise.length)];
      await Notifications.scheduleNotificationAsync({
        content: { title: exMsg.title, body: exMsg.body, sound: true },
        trigger: { hour: 18, minute: 0, repeats: true } as any,
      });

      // Comida: 1pm
      const mealMsg = NOTIFICATION_MESSAGES.meal[Math.floor(Math.random() * NOTIFICATION_MESSAGES.meal.length)];
      await Notifications.scheduleNotificationAsync({
        content: { title: mealMsg.title, body: mealMsg.body, sound: true },
        trigger: { hour: 13, minute: 0, repeats: true } as any,
      });

      // Racha en riesgo: 11pm
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 ¡Tu racha está en riesgo!',
          body: 'Son las 11pm. ¿Registraste algo hoy? ¡No rompas tu racha!',
          sound: true,
        },
        trigger: { hour: 23, minute: 0, repeats: true } as any,
      });

      console.log('[Gamification] ✅ Notificaciones programadas');
    } catch (e) {
      console.warn('[Gamification] Error programando notificaciones:', e);
    }
  }

  // ── Enviar notificación inmediata ──────────────────────────────────────────
  async sendImmediateNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch { /* no crítico */ }
  }

  // ── Calcular stats del usuario ─────────────────────────────────────────────
  async calculateStats(userId: string): Promise<UserStats> {
    const today     = new Date();
    const todayStr  = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    try {
      const [gToday, gAll, medAll, exAll, mealsAll, attAll, streakData, xpData] = await Promise.all([
        supabase.from('glucose_entries').select('value', { count: 'exact' })
          .eq('user_id', userId).gte('timestamp', `${todayStr}T00:00:00`),
        supabase.from('glucose_entries').select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase.from('medication_entries').select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase.from('exercise_entries').select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase.from('meal_entries').select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase.from('health_attentions').select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase.from('user_streaks').select('*').eq('user_id', userId).single(),
        supabase.from('user_xp').select('*').eq('user_id', userId).single(),
      ]);

      // Calcular días con ejercicio este mes
      const { data: exMonth } = await supabase.from('exercise_entries')
        .select('timestamp').eq('user_id', userId).gte('timestamp', monthStart);
      const exerciseDays = new Set(
        (exMonth ?? []).map(e => new Date(e.timestamp).toISOString().split('T')[0])
      ).size;

      // Glucosa hoy y tiempo en rango
      const todayValues = (gToday.data ?? []).map((r: any) => r.value);
      const inRangePct  = todayValues.length
        ? Math.round(100 * todayValues.filter((v: number) => v >= 70 && v <= 180).length / todayValues.length)
        : 0;

      const streak   = streakData.data as any;
      const xp       = xpData.data as any;
      const totalXP  = xp?.total_xp ?? 0;
      const level    = Math.floor(totalXP / 500) + 1;

      return {
        glucoseToday:      todayValues.length,
        glucoseStreak:     streak?.glucose_streak ?? 0,
        glucoseInRange:    inRangePct,
        medicationStreak:  streak?.medication_streak ?? 0,
        exerciseDays,
        totalGlucose:      gAll.count ?? 0,
        totalMedications:  medAll.count ?? 0,
        totalExercise:     exAll.count ?? 0,
        currentStreak:     streak?.current_streak ?? 0,
        longestStreak:     streak?.longest_streak ?? 0,
        doctorVisits:      attAll.count ?? 0,
        mealsLogged:       mealsAll.count ?? 0,
        level,
        totalXP,
      };
    } catch {
      // Fallback SQLite
      return this._statsFromSQLite();
    }
  }

  private _statsFromSQLite(): UserStats {
    try {
      const db = getDb();
      const totalGlucose    = (db.getFirstSync<any>('SELECT COUNT(*) as c FROM glucose_entries')?.c ?? 0);
      const totalMedications= (db.getFirstSync<any>('SELECT COUNT(*) as c FROM medication_entries')?.c ?? 0);
      const totalExercise   = (db.getFirstSync<any>('SELECT COUNT(*) as c FROM exercise_entries')?.c ?? 0);
      const mealsLogged     = (db.getFirstSync<any>('SELECT COUNT(*) as c FROM meal_entries')?.c ?? 0);
      return {
        glucoseToday: 0, glucoseStreak: 0, glucoseInRange: 0,
        medicationStreak: 0, exerciseDays: 0,
        totalGlucose, totalMedications, totalExercise,
        currentStreak: 0, longestStreak: 0,
        doctorVisits: 0, mealsLogged,
        level: 1, totalXP: 0,
      };
    } catch { return { glucoseToday:0, glucoseStreak:0, glucoseInRange:0, medicationStreak:0, exerciseDays:0, totalGlucose:0, totalMedications:0, totalExercise:0, currentStreak:0, longestStreak:0, doctorVisits:0, mealsLogged:0, level:1, totalXP:0 }; }
  }

  // ── Verificar logros nuevos ────────────────────────────────────────────────
  async checkAndUnlockAchievements(userId: string, stats: UserStats): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];
    try {
      // Obtener logros ya desbloqueados
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const unlockedIds = new Set((existing ?? []).map((r: any) => r.achievement_id));

      for (const ach of ALL_ACHIEVEMENTS) {
        if (unlockedIds.has(ach.id)) continue;
        if (!ach.condition(stats)) continue;

        // ¡Nuevo logro!
        await supabase.from('user_achievements').insert({
          id:             generateUUID(),
          user_id:        userId,
          achievement_id: ach.id,
          unlocked_at:    new Date().toISOString(),
          xp_awarded:     ach.xp,
        });

        // Dar XP
        if (ach.xp > 0) {
          await this.addXP(userId, ach.xp, `achievement_${ach.id}`);
        }

        newlyUnlocked.push({ ...ach, unlocked: true, unlockedAt: new Date() });

        // Notificación de logro
        await this.sendImmediateNotification(
          `🏆 ¡${ach.emoji} ${ach.name} desbloqueado!`,
          `+${ach.xp} XP — ${ach.description}`
        );
      }
    } catch (e) { console.warn('[Gamification] checkAchievements error:', e); }
    return newlyUnlocked;
  }

  // ── XP ────────────────────────────────────────────────────────────────────
  async addXP(userId: string, xp: number, reason: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('user_xp')
        .select('total_xp')
        .eq('user_id', userId)
        .single();

      const current = (data as any)?.total_xp ?? 0;
      const newTotal = current + xp;

      await supabase.from('user_xp').upsert({
        user_id:  userId,
        total_xp: newTotal,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // Log XP
      await supabase.from('xp_log').insert({
        user_id: userId, xp_amount: xp, reason, created_at: new Date().toISOString(),
      });

      return newTotal;
    } catch { return 0; }
  }

  // ── Actualizar racha ──────────────────────────────────────────────────────
  async updateStreak(userId: string, activityType: 'glucose' | 'medication' | 'general'): Promise<StreakData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      const streak = data as any;
      const lastDate   = streak?.last_activity_date ?? '';
      const yesterday  = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let currentStreak = streak?.current_streak ?? 0;
      let longestStreak = streak?.longest_streak ?? 0;

      if (lastDate === today) {
        // Ya registró hoy — no cambiar racha
      } else if (lastDate === yesterday) {
        // Día consecutivo
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        // Dar XP por mantener racha
        await this.addXP(userId, 10, 'daily_streak');
      } else {
        // Racha rota o nueva
        if (lastDate !== '' && lastDate < yesterday) {
          currentStreak = 1; // resetear
        } else {
          currentStreak = 1;
        }
      }

      await supabase.from('user_streaks').upsert({
        user_id:            userId,
        current_streak:     currentStreak,
        longest_streak:     longestStreak,
        last_activity_date: today,
        glucose_streak:     activityType === 'glucose' ? currentStreak : (streak?.glucose_streak ?? 0),
        medication_streak:  activityType === 'medication' ? currentStreak : (streak?.medication_streak ?? 0),
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // Notificación de hito de racha
      const milestones = [3, 7, 14, 30, 60, 100, 365];
      if (milestones.includes(currentStreak)) {
        await this.sendImmediateNotification(
          `🔥 ¡${currentStreak} días de racha!`,
          currentStreak >= 30
            ? `¡Eres absolutamente increíble! ${currentStreak} días seguidos sin rendirte 🏆`
            : `¡${currentStreak} días seguidos! Sigue así, lo estás haciendo genial 💪`
        );
      }

      return {
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        streakFrozen:     false,
      };
    } catch { return { currentStreak: 0, longestStreak: 0, lastActivityDate: '', streakFrozen: false }; }
  }

  // ── Obtener logros del usuario ────────────────────────────────────────────
  async getUserAchievements(userId: string): Promise<(Achievement & { unlocked: boolean; unlockedAt?: Date })[]> {
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      const unlockedMap: Record<string, Date> = {};
      (data ?? []).forEach((r: any) => {
        unlockedMap[r.achievement_id] = new Date(r.unlocked_at);
      });

      return ALL_ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked:   !!unlockedMap[ach.id],
        unlockedAt: unlockedMap[ach.id],
      }));
    } catch {
      return ALL_ACHIEVEMENTS.map(ach => ({ ...ach, unlocked: false }));
    }
  }

  // ── Obtener racha del usuario ──────────────────────────────────────────────
  async getUserStreak(userId: string): Promise<StreakData> {
    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      const s = data as any;
      return {
        currentStreak:    s?.current_streak    ?? 0,
        longestStreak:    s?.longest_streak    ?? 0,
        lastActivityDate: s?.last_activity_date ?? '',
        streakFrozen:     s?.streak_frozen      ?? false,
      };
    } catch {
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: '', streakFrozen: false };
    }
  }

  // ── Ranking de logros (quién los ha obtenido) ──────────────────────────────
  async getAchievementRanking(achievementId: string): Promise<{ displayName: string; unlockedAt: Date }[]> {
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select('unlocked_at, users(display_name)')
        .eq('achievement_id', achievementId)
        .order('unlocked_at', { ascending: true })
        .limit(10);

      return (data ?? []).map((r: any) => ({
        displayName: r.users?.display_name ?? 'Usuario',
        unlockedAt:  new Date(r.unlocked_at),
      }));
    } catch { return []; }
  }
}

export const GamificationService = new GamificationServiceClass();