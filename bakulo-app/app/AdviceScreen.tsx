import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Sun, CloudSun, Moon } from 'lucide-react-native';
import { MedicationManager } from '@/components/MedicationManager';
import { SmartReminder } from '@/components/SmartReminder';
import { AlertSettings } from '@/components/ui/AlertSettings';
import { MealItem } from '@/components/ui/MealItem';
import { NotificationService } from '@/service/notificationService';


export default function AdviceScreen() {
  useEffect(() => {
    NotificationService.setup();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.mainTitle}>Configuración</Text>
      
      <AlertSettings />

      <Text style={styles.sectionTitle}>Comidas Diarias</Text>
      <MealItem icon={<Sun color="#baeaff" size={20}/>} title="Desayuno" time="07:30 AM" />
      <MealItem icon={<CloudSun color="#baeaff" size={20}/>} title="Almuerzo" time="01:00 PM" />
      <MealItem icon={<Moon color="#baeaff" size={20}/>} title="Cena" time="08:00 PM" />

      <View style={{ marginTop: 20 }}>
        <SmartReminder />
      </View>
      
      <MedicationManager />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 24 },
  mainTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 15, marginTop: 10 }
});