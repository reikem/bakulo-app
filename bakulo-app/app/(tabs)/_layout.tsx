// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TopAppBar } from '../../components/ui/TopAppBar';
import { CustomTabBar } from '../../components/ui/TabBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* Única instancia del Header */}
      <TopAppBar />

      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false, 
        }}>
        
        {/* Pantallas principales del menú */}
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="advice" options={{ title: 'Advice' }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        
        
        {/* Si 'log' y 'documents' NO deben tener botón abajo, ponles href: null */}
        {/* Pero si quieres que aparezcan, no los pongas aquí abajo */}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});