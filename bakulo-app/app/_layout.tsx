import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      {/* Añadimos la pantalla de exportación como un modal */}
      <Stack.Screen 
        name="export" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom' 
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          presentation: 'modal', 
          animation: 'slide_from_bottom' 
        }} 
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen 
  name="log-medication" 
  options={{ 
    presentation: 'modal',
    headerShown: false 
  }} 
/>
    </Stack>
  );
}