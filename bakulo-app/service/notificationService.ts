import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  setup: async () => {
    if (Platform.OS === 'web') return;
    
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Clinical Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#86d0ef',
          sound: 'default', // En Development Build aquí pones tu archivo .wav
        });
      }
    }
  },

  schedule: async (title: string, body: string, seconds: number) => {
    if (Platform.OS === 'web') {
      if (Notification.permission === 'granted') {
        setTimeout(() => new Notification(title, { body }), seconds * 1000);
      }
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { seconds, channelId: 'alerts' },
    });
  }
};