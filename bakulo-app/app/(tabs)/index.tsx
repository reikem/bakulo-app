/**
 * app/(tabs)/index.tsx — Auth Guard
 *
 * ✅ Si hay sesión activa  → Dashboard
 * ✅ Si no hay sesión      → Login
 * ✅ Mientras verifica     → Splash animado
 *
 * Orden de verificación:
 *  1. SQLite local (db_getCurrentUser) — instantáneo, offline-first
 *  2. Supabase Auth (authGetCurrentSession) — confirma token vigente
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { db_getCurrentUser } from '@/service/database';
import { authGetCurrentUser } from '@/service/authService';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export default function Index() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in del splash
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        400,
      useNativeDriver: true,
    }).start();

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // ── Paso 1: verificación local instantánea ─────────────────────
      const localUser = db_getCurrentUser();

      // Si no hay usuario local → login inmediato sin esperar red
      if (!localUser) {
        setAuthState('unauthenticated');
        return;
      }

      // ── Paso 2: confirmar sesión con Supabase (token vigente) ───────
      const supaUser = await Promise.race([
        authGetCurrentUser(),
        // Timeout de 3s: si Supabase tarda, usamos la sesión local
        new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
      ]);

      if (supaUser) {
        setAuthState('authenticated');
      } else if (localUser) {
        // Sin internet o token expirado → dejar pasar con sesión local
        // El sync se realizará cuando haya conexión
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    } catch {
      // Error de red u otro → usar sesión local si existe
      const localUser = db_getCurrentUser();
      setAuthState(localUser ? 'authenticated' : 'unauthenticated');
    }
  };

  // ── Splash mientras verifica ─────────────────────────────────────────
  if (authState === 'checking') {
    return (
      <Animated.View style={[styles.splash, { opacity: fadeAnim }]}>
        {/* Círculos decorativos de fondo */}
        <View style={[styles.glow, { top: -80, left: -80, backgroundColor: '#004e63' }]} />
        <View style={[styles.glow, { bottom: -80, right: -80, backgroundColor: '#005229' }]} />

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🩺</Text>
        </View>
        <Text style={styles.appName}>Serenity</Text>
        <Text style={styles.tagline}>Gestión empática de tu salud</Text>

        {/* Spinner */}
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#86d0ef" size="large" />
          <Text style={styles.loadingText}>Verificando sesión...</Text>
        </View>
      </Animated.View>
    );
  }

  // ── Redirigir ─────────────────────────────────────────────────────────
  if (authState === 'authenticated') {
    return <Redirect href="/(tabs)/DashboardScreen" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  splash: {
    flex:            1,
    backgroundColor: '#171d1e',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
  },
  glow: {
    position:     'absolute',
    width:         300,
    height:        300,
    borderRadius:  150,
    opacity:       0.15,
  },
  logoWrap: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: '#006782',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    12,
    shadowColor:     '#006782',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.4,
    shadowRadius:    20,
    elevation:       12,
  },
  logoEmoji:   { fontSize: 40 },
  appName:     { color: '#baeaff', fontSize: 38, fontWeight: '900', letterSpacing: -0.5 },
  tagline:     { color: '#6f787d', fontSize: 14, marginTop: 4, marginBottom: 32 },
  loaderWrap:  { alignItems: 'center', gap: 12 },
  loadingText: { color: '#6f787d', fontSize: 13 },
});