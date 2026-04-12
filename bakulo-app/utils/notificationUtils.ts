import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configuración de respuesta inmediata
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  // 1. Caso Web
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // 2. Caso Móvil (Android/iOS)
  if (!Device.isDevice) {
    console.warn("Debes usar un dispositivo físico para probar notificaciones.");
    return true; 
  }

  // Configurar Canal Android (CRÍTICO para Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#86d0ef',
      sound: 'default', // O el nombre de tu archivo si lo configuraste en app.json
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const scheduleAlert = async (title: string, body: string, seconds: number) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.error("No hay permisos para notificaciones");
    return;
  }

  if (Platform.OS === 'web') {
    setTimeout(() => {
      new Notification(title, { body });
    }, seconds * 1000);
  } else {
    // IMPORTANTE: trigger en Android/iOS
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: { 
          seconds: seconds > 0 ? seconds : 1, // No puede ser 0
          channelId: 'default', // Debe coincidir con el canal de arriba
        },
      });
      console.log("Notificación programada con éxito");
    } catch (e) {
      console.error("Error al programar:", e);
    }
  }
};

export const cancelAllNotifications = async () => {
  if (Platform.OS !== 'web') {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};