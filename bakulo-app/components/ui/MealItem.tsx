import { NotificationService } from '@/service/notificationService';
import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';


export const MealItem = ({ icon, title, time, id }: any) => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  const toggleSwitch = async (value: boolean) => {
    setIsEnabled(value);
    if (value) {
      // Programamos una alerta (ejemplo: 5 segundos para probar, 
      // en real usarías la diferencia de tiempo hasta la hora del 'time')
      await NotificationService.schedule(
        `Hora de ${title}`,
        `No olvides registrar tu nivel de glucosa para el ${title.toLowerCase()}.`,
        5 
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBg}>{icon}</View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
      <Switch 
        value={isEnabled} 
        onValueChange={toggleSwitch}
        trackColor={{ false: '#3f484c', true: '#006782' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 22, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },
  time: { color: '#6f787d', fontSize: 13 },
});