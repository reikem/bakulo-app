import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { db_getCurrentUser, db_setCurrentUser } from '@/service/database';
import { authGetCurrentUser } from '@/service/authService';
import { supabase } from '@/service/supabaseClient';
import { useAppStore } from '@/store/AppStore';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export default function Index() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const { setCurrentUser } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. Verificar sesión activa en Supabase (OAuth/Google)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Sincronizar datos del usuario de la nube a local/store
        const userDetails = await authGetCurrentUser();
        if (userDetails) {
          db_setCurrentUser(userDetails);
          setCurrentUser(userDetails);
        }
        setAuthState('authenticated');
        return;
      }

      // 2. Fallback a SQLite local (Modo Offline)
      const localUser = db_getCurrentUser();
      if (localUser) {
        setCurrentUser(localUser);
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    } catch (error) {
      setAuthState('unauthenticated');
    }
  };

  if (authState === 'checking') {
    return (
      <Animated.View style={[styles.splash, { opacity: fadeAnim }]}>
        <View style={styles.logoWrap}>
          <Text style={{ fontSize: 40 }}>🧘</Text>
        </View>
        <ActivityIndicator color="#86d0ef" size="large" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </Animated.View>
    );
  }

  return authState === 'authenticated' 
    ? <Redirect href="/(tabs)/DashboardScreen" /> 
    : <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#171d1e', alignItems: 'center', justifyContent: 'center', gap: 20 },
  logoWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#006782', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  loadingText: { color: '#86d0ef', marginTop: 10, fontSize: 14, fontWeight: '600' }
});