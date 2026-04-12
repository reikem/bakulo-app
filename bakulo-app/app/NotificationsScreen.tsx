import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Settings, TrendingUp, TrendingDown, Utensils, Stethoscope } from 'lucide-react-native';

// IMPORTACIÓN DE TUS NUEVOS COMPONENTES
import { AlertCard, ReminderItem } from '@/components/ui/NotificationComponents';

export default function NotificationsScreen() {
  const router = useRouter();

  // Estados
  const [highGlucose, setHighGlucose] = useState(true);
  const [lowGlucose, setLowGlucose] = useState(true);
  const [mealPrompts, setMealPrompts] = useState(true);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#c4ebe0" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clinical Serenity</Text>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRP80aKPLzc7_T9ECdITKIJXWAEEYiBzHXy26sp0zS1l3dFk_YjVsQNGUwzeUdr5mO6h5QWrhAQcEk_JdH5ensmwGcVhraEde3o5DkA6xWoZcAWVkFNrMr8g4htdzTmGaykE4fUTMnVcWMpkSU4FFbduOqp-PF0hUJMo1ch_N9TR7Oj6eRTZ8YBtcHqENAXVlGeNgZBvqWpKfQm9IzIwW75WNraA3toacoBN-dfXMYLUiu6JZuipCoomY5l0cDqrnv5nvb2EiuSrIf' }} 
            style={styles.avatar} 
          />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.mainTitle}>Notifications</Text>
          <Text style={styles.subTitle}>Customize alerts and wellness reminders.</Text>
        </View>

        {/* Sección Alertas usando el componente extraído */}
        <View style={styles.section}>
          <AlertCard 
            icon={<TrendingUp color="#ba1a1a" size={28} />}
            title="High Glucose"
            desc="Notify when levels rise"
            threshold="180"
            unit="mg/dL"
            isEnabled={highGlucose}
            onToggle={setHighGlucose}
            iconBg="rgba(255, 218, 214, 0.1)"
          />

          <AlertCard 
            icon={<TrendingDown color="#a9cec4" size={28} />}
            title="Low Glucose"
            desc="Urgent hypoglycemia warning"
            threshold="75"
            unit="mg/dL"
            isEnabled={lowGlucose}
            onToggle={setLowGlucose}
            iconBg="rgba(196, 235, 224, 0.1)"
          />
        </View>

        {/* Sección Recordatorios */}
        <View style={styles.section}>
          <ReminderItem 
            icon={<Utensils color="#a4f4b7" size={24} />}
            title="Meal Prompts"
            tags={["1h after", "2h after"]}
            isEnabled={mealPrompts}
            onToggle={setMealPrompts}
            iconBg="rgba(26, 108, 60, 0.2)"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  headerSafeArea: { backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 5 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  scrollContent: { padding: 24 },
  hero: { marginBottom: 30 },
  mainTitle: { color: '#baeaff', fontSize: 32, fontWeight: '800' },
  subTitle: { color: '#6f787d', fontSize: 16, marginTop: 8 },
  section: { marginBottom: 20 },
  saveButton: { backgroundColor: '#006782', padding: 20, borderRadius: 24, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: '800' }
});