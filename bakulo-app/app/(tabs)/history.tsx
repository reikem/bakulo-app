import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
// Asegúrate de importar Href para solucionar el error de TS
import { Href } from 'expo-router'; 
import { ChevronLeft, ChevronRight, Droplets, Utensils, Dumbbell, ArrowLeft, Plus } from 'lucide-react-native';
import { CalendarDay, LogCard } from '@/components/ui/HistoryComponents';

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedDay, setSelectedDay] = useState(12);
  
  const [dailyLogs, setDailyLogs] = useState([
    { id: 1, type: 'glucose', title: 'Blood Glucose', value: '114', unit: 'mg/dL', time: '08:30 AM', color: '#86d0ef' },
    { id: 2, type: 'meal', title: 'Nutrition', desc: 'Desayuno Saludable', value: '450', unit: 'kcal', time: '09:00 AM', color: '#a9cec4' }
  ]);

  useEffect(() => {
    if (params.newLog) {
      try {
        const parsedLog = JSON.parse(params.newLog as string);
        
        setDailyLogs(prev => {
          // Verificamos que el ID no exista para no duplicar en re-renders
          const exists = prev.some(item => item.id === parsedLog.id);
          if (exists) return prev;
          
          // Agregamos al inicio de la lista
          return [parsedLog, ...prev];
        });
      } catch (e) {
        console.error("Error parsing", e);
      }
    }
  }, [params.newLog]);

  const handlePressDetail = (log: any) => {
    // Definimos las rutas. Agregué el casteo "as const"
    const routeMap = {
      glucose: "/log-details",
      meal: "/meal-details",
      exercise: "/exercise-details"
    } as const;

    const targetPath = routeMap[log.type as keyof typeof routeMap] || "/log-details";

    router.push({
      pathname: targetPath as Href, // <--- Aquí se soluciona el error TS(2322)
      params: { 
        title: log.desc || log.title, 
        type: log.type, 
        value: log.value 
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#baeaff" size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Daily Logs</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>History</Text>
          <Text style={styles.subTitle}>REVIEW YOUR JOURNEY AND PROGRESS.</Text>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>April 2026</Text>
            <View style={styles.navButtons}>
              <TouchableOpacity><ChevronLeft color="#6f787d" size={20} /></TouchableOpacity>
              <TouchableOpacity><ChevronRight color="#6f787d" size={20} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.calendarGrid}>
            {[8, 9, 10, 11, 12, 13, 14].map((d) => (
              <CalendarDay key={d} day={d} active={selectedDay === d} onPress={() => setSelectedDay(d)} dot={d === 12} />
            ))}
          </View>
        </View>

        <View style={styles.logsList}>
          {dailyLogs.map((log) => (
            <LogCard 
              key={log.id} 
              title={log.title} 
              time={log.time} 
              value={log.value} 
              unit={log.unit || 'min'} 
              desc={log.desc} // Asegúrate que LogExercise pase el nombre de la actividad aquí
              color={log.color}
              icon={
                log.type === 'glucose' ? <Droplets color={log.color} size={24}/> : 
                log.type === 'meal' ? <Utensils color={log.color} size={24}/> :
                <Dumbbell color={log.color} size={24}/>
              }
              onPress={() => handlePressDetail(log)}
            />
          ))}

          <TouchableOpacity 
            style={styles.emptyCard} 
            onPress={() => router.push('/log-exercise' as Href)}
          >
            <Plus color="#6f787d" size={24} />
            <Text style={styles.emptyText}>Add Exercise or Activity</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  navTitle: { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 24 },
  headerSection: { marginBottom: 28 },
  mainTitle: { color: '#baeaff', fontSize: 34, fontWeight: '800' },
  subTitle: { color: '#6f787d', fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  calendarCard: { backgroundColor: '#1a1a1a', borderRadius: 32, padding: 24, marginBottom: 30 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  monthText: { color: '#f5f5f5', fontSize: 18, fontWeight: '700' },
  navButtons: { flexDirection: 'row', gap: 10 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logsList: { gap: 12 },
  emptyCard: { padding: 30, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 24, alignItems: 'center', gap: 10, marginTop: 10 },
  emptyText: { color: '#6f787d', fontWeight: '600' }
});