import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Circle, Droplets, Pill, Utensils, Footprints, Moon } from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

export default function DailyTasksScreen() {
  const router = useRouter();

  const tasks = [
    { id: 1, title: 'Glucose Check (Fasting)', time: '08:00 AM', desc: 'Ayunas antes de medicación', icon: <Droplets color="#c4ebe0" size={20} />, completed: true, period: 'Morning' },
    { id: 2, title: 'Medication (Insulin)', time: '08:15 AM', desc: 'Dosis matutina habitual', icon: <Pill color="#c4ebe0" size={20} />, completed: true, period: 'Morning' },
    { id: 3, title: 'Exercise (30 min walk)', time: '05:00 PM', desc: 'Caminata ligera en el parque', icon: <Footprints color="#c4ebe0" size={20} />, completed: false, period: 'Afternoon' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Tareas Diarias</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Bento Box */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>Progreso del día</Text>
            <Text style={styles.heroValue}>6/8 tareas</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>¡Casi terminas!</Text></View>
          </View>
          
          <View style={styles.progressCircleContainer}>
            <Svg width="80" height="80" viewBox="0 0 100 100">
              <SvgCircle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
              <SvgCircle cx="50" cy="50" r="40" stroke="#c4ebe0" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.25} strokeLinecap="round" />
            </Svg>
            <Text style={styles.progressText}>75%</Text>
          </View>
        </View>

        {/* Task List */}
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>MAÑANA</Text>
          {tasks.filter(t => t.period === 'Morning').map(task => (
            <TaskItem key={task.id} task={task} />
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>TARDE</Text>
          {tasks.filter(t => t.period === 'Afternoon').map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TaskItem = ({ task }: any) => (
  <View style={[styles.taskCard, !task.completed && styles.taskCardPending]}>
    <View style={styles.taskIconWrapper}>{task.icon}</View>
    <View style={{ flex: 1 }}>
      <View style={styles.taskRow}>
        <Text style={[styles.taskTitle, !task.completed && { color: 'white' }]}>{task.title}</Text>
        <Text style={styles.taskTime}>{task.time}</Text>
      </View>
      <View style={styles.taskRow}>
        <Text style={styles.taskDesc}>{task.desc}</Text>
        {task.completed ? (
          <CheckCircle2 color="#005229" size={20} fill="#005229" />
        ) : (
          <Circle color="#6f787d" size={20} />
        )}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8 },
  headerTitle: { color: '#c4ebe0', fontSize: 20, fontWeight: '800', marginLeft: 10 },
  scrollContent: { padding: 20 },
  heroCard: { 
    backgroundColor: '#004e63', 
    borderRadius: 24, 
    padding: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  heroValue: { color: 'white', fontSize: 32, fontWeight: '800', marginVertical: 4 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  progressCircleContainer: { justifyContent: 'center', alignItems: 'center' },
  progressText: { position: 'absolute', color: 'white', fontWeight: '800', fontSize: 16 },
  taskSection: { gap: 12 },
  sectionTitle: { color: '#c4ebe0', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  taskCard: { backgroundColor: '#212b2c', padding: 16, borderRadius: 20, flexDirection: 'row', gap: 16, alignItems: 'center' },
  taskCardPending: { backgroundColor: '#1d2426', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  taskIconWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(196, 235, 224, 0.05)', justifyContent: 'center', alignItems: 'center' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { color: '#c4ebe0', fontWeight: '700', fontSize: 15 },
  taskTime: { color: '#6f787d', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 6 },
  taskDesc: { color: '#6f787d', fontSize: 12, marginTop: 4 },
});