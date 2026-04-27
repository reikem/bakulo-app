/**
 * app/(tabs)/_layout.tsx — Layout de tabs
 *
 * ✅ Solo define la barra de navegación inferior
 * ✅ NO repite providers (ya están en app/_layout.tsx)
 * ✅ Las pantallas dentro de (tabs) que no son tabs reales
 *    (InsightsScreen, DailyTasksScreen, etc.) se ocultan de la tab bar
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : `${name}-outline` as IoniconsName}
      size={24}
      color={focused ? '#6C63FF' : '#8E8E93'}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F1A',
          borderTopColor: '#1E1E2E',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {/* ── Tabs visibles ──────────────────────────────────────────────── */}

      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => <TabIcon name="time" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="advice"
        options={{
          title: 'Consejos',
          tabBarIcon: ({ focused }) => <TabIcon name="bulb" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => <TabIcon name="compass" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />

      {/* ── Pantallas dentro de (tabs) que NO aparecen en la tab bar ───── */}

      <Tabs.Screen
        name="InsightsScreen"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="DailyTasksScreen"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="ArticleDetail"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="NutritionList"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="LogGlucoseScreen"
        options={{ href: null }}
      />

    </Tabs>
  );
}
