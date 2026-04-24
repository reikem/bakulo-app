import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TopAppBar } from '../../components/ui/TopAppBar';
import { CustomTabBar } from '../../components/ui/TabBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* Única instancia del Header para todas las pestañas. 
          Si alguna pantalla específica no debe llevarlo, 
          habría que moverlo dentro de cada pantalla individual.
      */}
      <TopAppBar />

      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false, // Ocultamos el header por defecto de los Tabs
          tabBarActiveTintColor: '#006782',
          tabBarInactiveTintColor: '#6f787d',
        }}>
        
        {/* --- PANTALLAS PRINCIPALES (Visibles en el TabBar) --- */}
        
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Dashboard' 
          }} 
        />
        
        <Tabs.Screen 
          name="history" 
          options={{ 
            title: 'History' 
          }} 
        />
        
        <Tabs.Screen 
          name="advice" 
          options={{ 
            title: 'Advice' 
          }} 
        />
        
        <Tabs.Screen 
          name="explore" 
          options={{ 
            title: 'Explore' 
          }} 
        />
        
        <Tabs.Screen 
          name="settings" 
          options={{ 
            title: 'Settings' 
          }} 
        />

        {/* --- PANTALLAS DE NAVEGACIÓN INTERNA (Ocultas en el TabBar) --- */}
        {/* Usamos href: null para que existan en el sistema de rutas 
            pero no generen un botón en la barra inferior.
        */}

        <Tabs.Screen 
          name="LogGlucoseScreen" 
          options={{ 
            href: null,
            title: 'Log Glucose'
          }} 
        />

        <Tabs.Screen 
          name="InsightsScreen" 
          options={{ 
            href: null,
            title: 'Insights'
          }} 
        />

        <Tabs.Screen 
          name="NutritionList" 
          options={{ 
            href: null,
            title: 'Nutrition'
          }} 
        />

        <Tabs.Screen 
          name="ArticleDetail" 
          options={{ 
            href: null,
            title: 'Article Detail'
          }} 
        />
        <Tabs.Screen 
  name="DailyTasksScreen" 
  options={{ 
    href: null,
    title: 'Daily Tasks'
  }} 
/>

        {/* Agrega aquí cualquier otra pantalla que esté dentro de la carpeta (tabs) */}

      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
});