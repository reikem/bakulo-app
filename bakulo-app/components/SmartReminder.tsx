import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Edit3 } from 'lucide-react-native';


export const SmartReminder = () => {
  const [hours, setHours] = React.useState(2);

  const updateInterval = () => {
    const nextValue = hours >= 4 ? 1 : hours + 1;
    setHours(nextValue);
    
    // Feedback al usuario
    Alert.alert(
      "Configuración Guardada", 
      `Te avisaremos ${nextValue} ${nextValue === 1 ? 'hora' : 'horas'} después de cada registro de comida.`
    );
  };

  return (
    <TouchableOpacity style={styles.banner} onPress={updateInterval}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Smart Reminders</Text>
        <Text style={styles.sub}>Medir glucosa post-ingesta.</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{hours}h Después</Text>
        <Edit3 color="#fff" size={14} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: { backgroundColor: '#004e63', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 14 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' }
});